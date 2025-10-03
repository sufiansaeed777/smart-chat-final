import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';
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

    const invitedUserIds = invitedUsers.map(u => u.id);

    // Get all bots created by this manager
    const botRepository = AppDataSource.getRepository(Bot);
    const managerBots = await botRepository.find({
      where: { createdBy: manager.id },
      select: ['id', 'name', 'status', 'createdAt']
    });

    // Get bot assignments (only if there are invited users)
    const assignmentRepository = AppDataSource.getRepository(BotAssignment);
    let assignments: BotAssignment[] = [];
    if (invitedUserIds.length > 0) {
      assignments = await assignmentRepository.find({
        where: { 
          userId: In(invitedUserIds),
          status: 'active'
        },
        relations: ['bot']
      });
    }

    // Get conversations from last 24 hours
    const conversationRepository = AppDataSource.getRepository(Conversation);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    let recentConversations: Conversation[] = [];
    let yesterdayConversations: Conversation[] = [];
    
    if (invitedUserIds.length > 0) {
      recentConversations = await conversationRepository
        .createQueryBuilder('conversation')
        .where('conversation.userId IN (:...userIds)', { 
          userIds: invitedUserIds 
        })
        .andWhere('conversation.createdAt >= :twentyFourHoursAgo', { twentyFourHoursAgo })
        .orderBy('conversation.createdAt', 'DESC')
        .take(10)
        .getMany();

      // Get conversations from yesterday for comparison
      const yesterdayStart = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const yesterdayEnd = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      yesterdayConversations = await conversationRepository
        .createQueryBuilder('conversation')
        .where('conversation.userId IN (:...userIds)', { 
          userIds: invitedUserIds 
        })
        .andWhere('conversation.createdAt >= :yesterdayStart', { yesterdayStart })
        .andWhere('conversation.createdAt < :yesterdayEnd', { yesterdayEnd })
        .getMany();
    }

    // Calculate metrics
    const totalUsers = invitedUsers.length;
    const acceptedUsers = invitedUsers.filter(u => u.password).length;
    const pendingUsers = totalUsers - acceptedUsers;
    
    const totalBots = managerBots.length;
    const activeBots = managerBots.filter(b => b.status === 'active').length;
    
    const totalRecentChats = recentConversations.length;
    const totalYesterdayChats = yesterdayConversations.length;
    const chatChange = totalYesterdayChats > 0 
      ? ((totalRecentChats - totalYesterdayChats) / totalYesterdayChats * 100).toFixed(1)
      : totalRecentChats > 0 ? '100' : '0';

    // Calculate online users
    const now = Date.now();
    const onlineUsers = invitedUsers.filter(user => {
      if (!user.lastLoginAt) return false;
      const lastLoginTime = new Date(user.lastLoginAt).getTime();
      return (now - lastLoginTime) < 15 * 60 * 1000; // Online if last login within 15 minutes
    }).length;

    const busyUsers = invitedUsers.filter(user => {
      if (!user.lastLoginAt) return false;
      const lastLoginTime = new Date(user.lastLoginAt).getTime();
      const timeDiff = now - lastLoginTime;
      return timeDiff >= 15 * 60 * 1000 && timeDiff < 60 * 60 * 1000; // Busy if 15min-1hour
    }).length;

    // Process user data for overview
    const users = invitedUsers.map(user => {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();

      // Determine online status
      let onlineStatus: 'online' | 'busy' | 'offline' = 'offline';
      if (user.lastLoginAt) {
        const lastLoginTime = new Date(user.lastLoginAt).getTime();
        const timeDiff = now - lastLoginTime;

        if (timeDiff < 15 * 60 * 1000) {
          onlineStatus = 'online';
        } else if (timeDiff < 60 * 60 * 1000) {
          onlineStatus = 'busy';
        }
      }

      // Count assigned bots
      const userAssignments = assignments.filter(a => a.userId === user.id);
      const assignedBots = userAssignments.length;

      // Calculate last active time
      let lastActive = 'Never';
      if (user.lastLoginAt) {
        const lastLoginTime = new Date(user.lastLoginAt).getTime();
        const timeDiff = now - lastLoginTime;

        if (timeDiff < 60 * 1000) {
          lastActive = 'Just now';
        } else if (timeDiff < 60 * 60 * 1000) {
          const minutes = Math.floor(timeDiff / (60 * 1000));
          lastActive = `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (timeDiff < 24 * 60 * 60 * 1000) {
          const hours = Math.floor(timeDiff / (60 * 60 * 1000));
          lastActive = `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
          const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
          lastActive = `${days} day${days !== 1 ? 's' : ''} ago`;
        }
      }

      // Calculate user rating based on response time
      const userConvs = recentConversations.filter(c => c.userId === user.id && c.lastMessageAt);
      let rating = '4.0';
      if (userConvs.length > 0) {
        const avgMs = userConvs.reduce((acc, conv) => {
          const responseTime = new Date(conv.lastMessageAt!).getTime() - new Date(conv.createdAt).getTime();
          return acc + responseTime;
        }, 0) / userConvs.length;

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
        initials: fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase() : user.email[0].toUpperCase(),
        onlineStatus: onlineStatus,
        assignedBots: assignedBots,
        lastActive: lastActive,
        status: user.password ? 'accepted' : 'pending',
        rating: rating
      };
    });

    // Process recent activity
    const recentActivity = recentConversations.slice(0, 5).map(conv => {
      const user = invitedUsers.find(u => u.id === conv.userId);
      const bot = assignments.find(a => a.botId === conv.botId)?.bot;
      
      return {
        id: conv.id,
        type: 'conversation',
        title: `New conversation with ${bot?.name || 'Unknown Bot'}`,
        description: `User: ${user?.email || 'Unknown'} • ${Math.floor((now - conv.createdAt.getTime()) / (60 * 1000))} min ago`,
        status: 'active',
        timestamp: conv.createdAt
      };
    });

    // Process team performance
    const teamPerformance = users.slice(0, 4).map(user => {
      const userConversations = recentConversations.filter(c => c.userId === user.id);
      const chatCount = userConversations.length;
      
      return {
        id: user.id,
        name: user.name,
        initials: user.initials,
        chats: `${chatCount} chat${chatCount !== 1 ? 's' : ''} today`,
        rating: user.rating,
        status: user.onlineStatus,
        statusColor: user.onlineStatus === 'online' ? 'bg-green-100 text-green-600' : 
                     user.onlineStatus === 'busy' ? 'bg-orange-100 text-orange-600' : 
                     'bg-gray-100 text-gray-600'
      };
    });

    const overviewData = {
      metrics: {
        totalUsers: totalUsers,
        activeChats: totalRecentChats,
        pendingHandoffs: pendingUsers,
        resolvedToday: totalRecentChats
      },
      connectedMetrics: {
        totalUsers: totalUsers,
        totalBots: totalBots,
        availableAgents: onlineUsers
      },
      users: users,
      recentActivity: recentActivity,
      teamPerformance: teamPerformance,
      stats: {
        totalUsers,
        onlineUsers,
        busyUsers,
        offlineUsers: totalUsers - onlineUsers - busyUsers,
        acceptedUsers,
        pendingUsers,
        totalBots,
        activeBots,
        totalRecentChats,
        chatChange: chatChange
      }
    };

    return NextResponse.json(overviewData);

  } catch (error) {
    console.error('Error fetching manager overview:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      }, 
      { status: 500 }
    );
  }
}
