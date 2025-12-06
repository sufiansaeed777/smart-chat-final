import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';

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

    // Get user from database
    const userRepository = AppDataSource.getRepository("users");
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get bot assignments for this user
    const assignmentRepository = AppDataSource.getRepository("bot_assignments");
    const conversationRepository = AppDataSource.getRepository("conversations");

    const assignments = await assignmentRepository.find({
      where: {
        userId: user.id,
        status: 'active'
      },
      relations: ['bot']
    });

    // Get assigned bot IDs
    const assignedBotIds = assignments
      .map(assignment => assignment.bot?.id)
      .filter(Boolean);

    if (assignedBotIds.length === 0) {
      return NextResponse.json({
        bots: [],
        totalCount: 0
      });
    }

    // Get real conversation counts for each bot
    const conversationCounts = await conversationRepository
      .createQueryBuilder('conversation')
      .select('conversation.botId')
      .addSelect('COUNT(*)', 'count')
      .where('conversation.botId IN (:...assignedBotIds)', { assignedBotIds })
      .groupBy('conversation.botId')
      .getRawMany();

    // Create a map of botId to conversation count
    const conversationCountMap = conversationCounts.reduce((acc: Record<string, number>, item: any) => {
      acc[item.conversation_botId] = parseInt(item.count);
      return acc;
    }, {} as Record<string, number>);

    // Format the bots
    const formattedBots = assignments
      .filter(assignment => assignment.bot)
      .map(assignment => {
        const bot = assignment.bot;
        return {
          id: bot.id,
          name: bot.name,
          description: bot.description,
          domain: bot.domain,
          status: bot.status,
          conversations: conversationCountMap[bot.id] || 0,
          lastActive: bot.lastActive ? new Date(bot.lastActive).toLocaleString() : 'Never',
          createdAt: bot.createdAt?.toISOString().split('T')[0],
          assignmentId: assignment.id,
          assignedAt: assignment.createdAt?.toISOString()
        };
      });

    return NextResponse.json({
      bots: formattedBots,
      totalCount: formattedBots.length
    });

  } catch (error) {
    console.error('Error fetching user bots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
