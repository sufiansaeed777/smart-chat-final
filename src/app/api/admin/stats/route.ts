import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository('users');
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const botRepository = AppDataSource.getRepository('bots');
    const conversationRepository = AppDataSource.getRepository('conversations');

    const totalUsers = await userRepository.count();
    const totalBots = await botRepository.count();
    const totalConversations = await conversationRepository.count();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Count active users based on:
    // 1. Users with lastLoginAt in last 30 days, OR
    // 2. Users who have conversations in last 30 days
    const activeUsersFromLogin = await userRepository
      .createQueryBuilder('user')
      .where('user.lastLoginAt > :date', { date: thirtyDaysAgo })
      .getCount();

    // Also count users with recent conversations (for users without lastLoginAt tracking)
    const activeUsersFromConversations = await conversationRepository
      .createQueryBuilder('conv')
      .select('COUNT(DISTINCT conv.userId)', 'count')
      .where('conv.userId IS NOT NULL')
      .andWhere('conv.createdAt > :date', { date: thirtyDaysAgo })
      .getRawOne();

    const conversationActiveUsers = parseInt(activeUsersFromConversations?.count || '0');

    // Use the higher of the two counts, or combine unique users
    // For simplicity, we'll use users who logged in recently as the primary metric
    // If lastLoginAt is not being tracked, fall back to conversation-based activity
    const activeUsers = activeUsersFromLogin > 0 ? activeUsersFromLogin : conversationActiveUsers;

    // Count pending managers (managers with unverified emails or pending status)
    const pendingManagers = await userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: 'manager' })
      .andWhere('(user.isEmailVerified = :verified OR user.isActive = :active)', { verified: false, active: false })
      .getCount();

    const usersByRole = await userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const recentUsers = await userRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt']
    });

    // Get recent activity from various sources
    const recentActivity = [];

    // Recent user registrations
    const recentRegistrations = await userRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
      select: ['id', 'firstName', 'lastName', 'email', 'createdAt']
    });

    recentRegistrations.forEach(u => {
      recentActivity.push({
        type: 'user_registration',
        message: `New user registered: ${u.email}`,
        time: u.createdAt,
        userId: u.id
      });
    });

    // Recent bots created
    const recentBots = await botRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
      select: ['id', 'name', 'createdAt']
    });

    recentBots.forEach(b => {
      recentActivity.push({
        type: 'bot_created',
        message: `New bot created: ${b.name}`,
        time: b.createdAt,
        botId: b.id
      });
    });

    // Recent conversations
    const recentConversations = await conversationRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['bot'],
      select: ['id', 'createdAt', 'guestName']
    });

    recentConversations.forEach(c => {
      recentActivity.push({
        type: 'conversation',
        message: `New conversation${c.bot ? ` with ${c.bot.name}` : ''} by ${c.guestName || 'Guest'}`,
        time: c.createdAt,
        conversationId: c.id
      });
    });

    // Sort all activity by time (most recent first)
    recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Format time to relative string
    const formatTimeAgo = (date: Date) => {
      const now = new Date();
      const diffMs = now.getTime() - new Date(date).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      return new Date(date).toLocaleDateString();
    };

    const formattedActivity = recentActivity.slice(0, 10).map(activity => ({
      ...activity,
      time: formatTimeAgo(activity.time)
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalBots,
        totalConversations,
        activeUsers,
        pendingManagers,
        systemHealth: 'healthy',
        databaseStatus: 'connected',
        usersByRole,
        recentUsers,
        recentActivity: formattedActivity
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
