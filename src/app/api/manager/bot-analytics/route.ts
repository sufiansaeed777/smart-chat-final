import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';
import { Conversation } from '@/entities/Conversation';

/**
 * Get analytics for a specific bot
 * GET /api/manager/bot-analytics?botId=xxx
 */
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
    const userRepository = AppDataSource.getRepository("users");
    const manager = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!manager || manager.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // Get botId from query params
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    // Get the bot and verify ownership
    const botRepository = AppDataSource.getRepository("bots");
    const bot = await botRepository.findOne({
      where: { id: botId, createdBy: manager.id }
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found or access denied' }, { status: 404 });
    }

    // Get conversations for this bot
    const conversationRepository = AppDataSource.getRepository("conversations");

    // Total conversations for this bot
    const totalConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId = :botId', { botId })
      .getCount();

    // Conversations in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeChats = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId = :botId', { botId })
      .andWhere('conversation.createdAt >= :twentyFourHoursAgo', { twentyFourHoursAgo })
      .getCount();

    // Unique users who messaged this bot
    const usersWhoMessaged = await conversationRepository
      .createQueryBuilder('conversation')
      .select('DISTINCT conversation.userId')
      .where('conversation.botId = :botId', { botId })
      .getRawMany();

    const totalUsersWhoMessaged = usersWhoMessaged.length;

    // Get conversations from last 7 days for trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const conversationsLast7Days = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId = :botId', { botId })
      .andWhere('conversation.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .orderBy('conversation.createdAt', 'ASC')
      .getMany();

    // Group conversations by day for trend chart
    const conversationsByDay: { [key: string]: number } = {};
    conversationsLast7Days.forEach(conv => {
      const dateKey = conv.createdAt.toISOString().split('T')[0];
      conversationsByDay[dateKey] = (conversationsByDay[dateKey] || 0) + 1;
    });

    // Fill in missing days with 0
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      trendData.push({
        day: dayName,
        date: dateKey,
        conversations: conversationsByDay[dateKey] || 0
      });
    }

    // Recent conversations
    const recentConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId = :botId', { botId })
      .orderBy('conversation.createdAt', 'DESC')
      .limit(10)
      .getMany();

    const analytics = {
      bot: {
        id: bot.id,
        name: bot.name,
        status: bot.status,
        createdAt: bot.createdAt
      },
      metrics: {
        totalConversations,
        activeChats,
        totalUsersWhoMessaged
      },
      trend: trendData,
      recentConversations: recentConversations.map(conv => ({
        id: conv.id,
        userId: conv.userId,
        createdAt: conv.createdAt,
        status: (conv as any).status || 'active'
      }))
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching bot analytics:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
