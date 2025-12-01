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

    // Platform Overview Stats
    const totalUsers = await userRepository.count();
    const totalBots = await botRepository.count();
    const totalConversations = await conversationRepository.count();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Active Users (last 30 days)
    const activeUsers = await userRepository
      .createQueryBuilder('user')
      .where('user.updatedAt > :date', { date: thirtyDaysAgo })
      .getCount();

    // Daily Active Users (last 24 hours)
    const dailyActiveUsers = await userRepository
      .createQueryBuilder('user')
      .where('user.updatedAt > :date', { date: twentyFourHoursAgo })
      .getCount();

    // Weekly Active Users (last 7 days)
    const weeklyActiveUsers = await userRepository
      .createQueryBuilder('user')
      .where('user.updatedAt > :date', { date: sevenDaysAgo })
      .getCount();

    // New Registrations (last 7 days)
    const newRegistrations = await userRepository
      .createQueryBuilder('user')
      .where('user.createdAt > :date', { date: sevenDaysAgo })
      .getCount();

    // Active Conversations (last 24 hours)
    const activeConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.updatedAt > :date', { date: twentyFourHoursAgo })
      .getCount();

    // User Growth Over Time (last 30 days)
    const userGrowthData = await userRepository
      .createQueryBuilder('user')
      .select('DATE(user.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('user.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy('DATE(user.createdAt)')
      .orderBy('DATE(user.createdAt)', 'ASC')
      .getRawMany();

    const userGrowth = userGrowthData.map(item => ({
      date: item.date,
      users: parseInt(item.count)
    }));

    // Conversation Volume Over Time (last 30 days)
    const conversationVolumeData = await conversationRepository
      .createQueryBuilder('conversation')
      .select('DATE(conversation.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('conversation.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy('DATE(conversation.createdAt)')
      .orderBy('DATE(conversation.createdAt)', 'ASC')
      .getRawMany();

    const conversationVolume = conversationVolumeData.map(item => ({
      date: item.date,
      conversations: parseInt(item.count)
    }));

    // Top Performing Bots (by conversation count)
    const topBotsData = await conversationRepository
      .createQueryBuilder('conversation')
      .select('conversation.botId', 'botId')
      .addSelect('COUNT(*)', 'conversationCount')
      .where('conversation.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy('conversation.botId')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    const botIds = topBotsData.map(b => b.botId).filter(Boolean);
    const bots = botIds.length > 0 ? await botRepository
      .createQueryBuilder('bot')
      .where('bot.id IN (:...botIds)', { botIds })
      .getMany() : [];

    const topBots = topBotsData.map(item => {
      const bot = bots.find(b => b.id === item.botId);
      return {
        id: item.botId,
        name: bot?.name || 'Unknown Bot',
        conversationCount: parseInt(item.conversationCount),
        status: bot?.status || 'unknown'
      };
    });

    // User Distribution by Role
    const usersByRole = await userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const userRoleDistribution = usersByRole.map(item => ({
      role: item.role,
      count: parseInt(item.count),
      percentage: totalUsers > 0 ? ((parseInt(item.count) / totalUsers) * 100).toFixed(1) : '0'
    }));

    // Growth Calculations
    const lastWeekUsers = await userRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .getCount();

    const previousWeek = new Date();
    previousWeek.setDate(previousWeek.getDate() - 14);
    const previousWeekUsers = await userRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :previousWeek', { previousWeek })
      .andWhere('user.createdAt < :sevenDaysAgo', { sevenDaysAgo })
      .getCount();

    const userWeeklyGrowth = previousWeekUsers > 0
      ? (((lastWeekUsers - previousWeekUsers) / previousWeekUsers) * 100).toFixed(1)
      : lastWeekUsers > 0 ? '100' : '0';

    const lastWeekConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .getCount();

    const previousWeekConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.createdAt >= :previousWeek', { previousWeek })
      .andWhere('conversation.createdAt < :sevenDaysAgo', { sevenDaysAgo })
      .getCount();

    const conversationWeeklyGrowth = previousWeekConversations > 0
      ? (((lastWeekConversations - previousWeekConversations) / previousWeekConversations) * 100).toFixed(1)
      : lastWeekConversations > 0 ? '100' : '0';

    // Bot Usage Statistics
    const botsWithConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .select('DISTINCT conversation.botId')
      .where('conversation.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getRawMany();

    const activeBots = botsWithConversations.length;
    const inactiveBots = totalBots - activeBots;

    // Average Conversations per User
    const avgConversationsPerUser = totalUsers > 0
      ? (totalConversations / totalUsers).toFixed(1)
      : '0';

    // Bot Distribution Across Users
    const botDistribution = await botRepository
      .createQueryBuilder('bot')
      .select('bot.createdBy', 'userId')
      .addSelect('COUNT(*)', 'botCount')
      .groupBy('bot.createdBy')
      .getRawMany();

    const avgBotsPerUser = totalUsers > 0
      ? (totalBots / totalUsers).toFixed(1)
      : '0';

    // Recent Activity (fetch more for pagination - initial 10, expandable to all)
    const recentConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.bot', 'bot')
      .leftJoinAndSelect('conversation.user', 'user')
      .orderBy('conversation.createdAt', 'DESC')
      .take(100)
      .getMany();

    const recentActivity = recentConversations.map(conv => ({
      id: conv.id,
      bot: conv.bot?.name || 'Unknown Bot',
      user: conv.user ? `${conv.user.firstName || ''} ${conv.user.lastName || ''}`.trim() || conv.user.email : 'Unknown User',
      createdAt: conv.createdAt,
      status: conv.status || 'active',
      messageCount: Array.isArray(conv.messages) ? conv.messages.length : 0
    }));

    return NextResponse.json({
      success: true,
      overview: {
        totalUsers,
        totalBots,
        totalConversations,
        activeUsers,
        activeConversations,
        activeBots,
        inactiveBots,
        dailyActiveUsers,
        weeklyActiveUsers,
        newRegistrations
      },
      growth: {
        userWeeklyGrowth: parseFloat(userWeeklyGrowth),
        conversationWeeklyGrowth: parseFloat(conversationWeeklyGrowth),
        userGrowth,
        conversationVolume
      },
      distribution: {
        userRoleDistribution,
        avgConversationsPerUser: parseFloat(avgConversationsPerUser),
        avgBotsPerUser: parseFloat(avgBotsPerUser)
      },
      topBots,
      recentActivity,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
