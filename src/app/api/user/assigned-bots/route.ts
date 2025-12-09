import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { BotAssignment } from '@/entities/BotAssignment';
import { Bot } from '@/entities/Bot';

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

    // Get bot assignments for this user with bot and document relations
    const assignmentRepository = AppDataSource.getRepository("bot_assignments");
    const assignments = await assignmentRepository.find({
      where: {
        userId: user.id,
        status: 'active'
      },
      relations: ['bot', 'bot.botDocuments', 'bot.botDocuments.document', 'assignedByUser']
    });

    // Get all assigned bot IDs
    const assignedBotIds = assignments
      .map(a => a.bot?.id)
      .filter(Boolean) as string[];

    if (assignedBotIds.length === 0) {
      return NextResponse.json({
        bots: [],
        totalCount: 0
      });
    }

    // Get real conversation counts from the conversations table
    const conversationRepository = AppDataSource.getRepository("conversations");
    const conversationCounts = await conversationRepository
      .createQueryBuilder('conversation')
      .select('conversation.botId', 'botId')
      .addSelect('COUNT(*)', 'count')
      .where('conversation.botId IN (:...assignedBotIds)', { assignedBotIds })
      .groupBy('conversation.botId')
      .getRawMany();

    // Create a map of botId to conversation count
    const conversationCountMap: Record<string, number> = {};
    conversationCounts.forEach((item: any) => {
      conversationCountMap[item.botId] = parseInt(item.count) || 0;
    });

    // Get user counts (agents) for each bot
    const userCounts = await assignmentRepository
      .createQueryBuilder('assignment')
      .select('assignment.botId', 'botId')
      .addSelect('COUNT(DISTINCT assignment.userId)', 'count')
      .where('assignment.botId IN (:...assignedBotIds)', { assignedBotIds })
      .andWhere('assignment.status = :status', { status: 'active' })
      .groupBy('assignment.botId')
      .getRawMany();

    // Create a map of botId to user count
    const userCountMap: Record<string, number> = {};
    userCounts.forEach((item: any) => {
      userCountMap[item.botId] = parseInt(item.count) || 0;
    });

    // Transform the data to match the expected format
    const assignedBots = assignments
      .filter(assignment => assignment.bot)
      .map(assignment => {
        const bot = assignment.bot;
        const botId = bot.id;

        // Get documents from the botDocuments relation
        const documents = (bot.botDocuments || [])
          .filter((bd: any) => bd.document)
          .map((bd: any) => ({
            id: bd.document.id,
            name: bd.document.name,
            type: bd.document.type || bd.document.mimeType,
            size: bd.document.size || 0
          }));

        return {
          id: botId,
          name: bot.name || 'Unknown Bot',
          description: bot.description || 'No description available',
          domain: bot.domain || 'unknown.com',
          status: bot.status || 'inactive',
          conversations: conversationCountMap[botId] || 0,
          totalUsers: userCountMap[botId] || 1,
          documents: documents,
          lastActive: bot.lastActive
            ? new Date(bot.lastActive).toLocaleString()
            : 'Never',
          assignedBy: assignment.assignedByUser?.firstName && assignment.assignedByUser?.lastName
            ? `${assignment.assignedByUser.firstName} ${assignment.assignedByUser.lastName}`
            : assignment.assignedByUser?.email || 'Unknown Manager',
          assignedAt: assignment.assignedAt?.toISOString().split('T')[0] || 'N/A',
          createdAt: bot.createdAt?.toISOString().split('T')[0]
        };
      });

    return NextResponse.json({
      bots: assignedBots,
      totalCount: assignedBots.length
    });

  } catch (error) {
    console.error('Error fetching assigned bots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
