import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { BotAssignment } from '@/entities/BotAssignment';
import { Conversation } from '@/entities/Conversation';
import { In } from 'typeorm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get manager from database
    const userRepository = AppDataSource.getRepository(User);
    const manager = await userRepository.findOne({ 
      where: { email: session.user.email } 
    });

    if (!manager || manager.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // Get all users invited by this manager
    const invitedUsers = await userRepository.find({
      where: { invitedBy: manager.id },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt', 'password', 'lastLoginAt']
    });

    // Get bot assignments for these users
    const assignmentRepository = AppDataSource.getRepository(BotAssignment);
    const assignments = await assignmentRepository.find({
      where: { 
        userId: In(invitedUsers.map(u => u.id)),
        status: 'active'
      },
      relations: ['bot']
    });

    // Get recent conversations for these users (last 24 hours)
    const conversationRepository = AppDataSource.getRepository(Conversation);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.userId IN (:...userIds)', {
        userIds: invitedUsers.map(u => u.id)
      })
      .andWhere('conversation.createdAt >= :twentyFourHoursAgo', { twentyFourHoursAgo })
      .getMany();

    // Get total chat counts for all users
    const totalChatCounts = await Promise.all(
      invitedUsers.map(user =>
        conversationRepository.count({ where: { userId: user.id } })
          .then(count => ({ userId: user.id, count }))
      )
    );
    const chatCountMap = new Map(totalChatCounts.map(item => [item.userId, item.count]));

    // Process user data with online status and stats
    const usersWithStatus = invitedUsers.map(user => {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Determine online status based on last login
      let onlineStatus: 'online' | 'busy' | 'offline' = 'offline';
      if (user.lastLoginAt) {
        const lastLoginTime = new Date(user.lastLoginAt).getTime();
        const now = Date.now();
        const timeDiff = now - lastLoginTime;
        
        // Consider online if last login was within 15 minutes
        if (timeDiff < 15 * 60 * 1000) {
          onlineStatus = 'online';
        } else if (timeDiff < 60 * 60 * 1000) {
          // Consider busy if last login was within 1 hour
          onlineStatus = 'busy';
        }
      }

      // Count user's bot assignments
      const userAssignments = assignments.filter(a => a.userId === user.id);
      const assignedBots = userAssignments.length;

      // Count user's recent conversations
      const userConversations = recentConversations.filter(c => c.userId === user.id);
      const recentChatCount = userConversations.length;

      // Calculate average response time from actual data
      let avgResponseTime = 'N/A';
      const conversationsWithTimes = userConversations.filter(c => c.lastMessageAt);
      if (conversationsWithTimes.length > 0) {
        const totalResponseTimeMs = conversationsWithTimes.reduce((acc, conv) => {
          const responseTime = new Date(conv.lastMessageAt!).getTime() - new Date(conv.createdAt).getTime();
          return acc + responseTime;
        }, 0);
        const avgMs = totalResponseTimeMs / conversationsWithTimes.length;
        const avgMinutes = Math.round(avgMs / (1000 * 60) * 10) / 10;
        avgResponseTime = `${avgMinutes} min`;
      }

      // Get total chat count for this user from pre-fetched map
      const totalUserChats = chatCountMap.get(user.id) || 0;

      // Calculate user rating based on response time (faster = higher rating)
      let rating = '4.0';
      if (conversationsWithTimes.length > 0) {
        const avgMs = conversationsWithTimes.reduce((acc, conv) => {
          const responseTime = new Date(conv.lastMessageAt!).getTime() - new Date(conv.createdAt).getTime();
          return acc + responseTime;
        }, 0) / conversationsWithTimes.length;

        const avgMinutes = avgMs / (1000 * 60);
        if (avgMinutes < 2) rating = '5.0';
        else if (avgMinutes < 5) rating = '4.8';
        else if (avgMinutes < 10) rating = '4.5';
        else if (avgMinutes < 30) rating = '4.2';
      }

      return {
        id: user.id,
        name: fullName || user.email.split('@')[0] || 'Unknown User',
        email: user.email,
        role: user.role,
        status: user.password ? 'accepted' : 'pending',
        onlineStatus: onlineStatus,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        assignedBots: assignedBots,
        recentChats: recentChatCount,
        avgResponseTime: avgResponseTime,
        rating: rating,
        totalChats: totalUserChats
      };
    });

    // Calculate summary statistics
    const totalUsers = usersWithStatus.length;
    const onlineUsers = usersWithStatus.filter(u => u.onlineStatus === 'online').length;
    const busyUsers = usersWithStatus.filter(u => u.onlineStatus === 'busy').length;
    const offlineUsers = usersWithStatus.filter(u => u.onlineStatus === 'offline').length;
    const acceptedUsers = usersWithStatus.filter(u => u.status === 'accepted').length;
    const pendingUsers = usersWithStatus.filter(u => u.status === 'pending').length;
    const totalBots = assignments.length;
    const totalRecentChats = recentConversations.length;

    const stats = {
      totalUsers,
      onlineUsers,
      busyUsers,
      offlineUsers,
      acceptedUsers,
      pendingUsers,
      totalBots,
      totalRecentChats,
      avgResponseTime: '2.3 min'
    };

    return NextResponse.json({
      users: usersWithStatus,
      stats: stats
    });

  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
