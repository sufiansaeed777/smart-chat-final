import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';
import { BotAssignment } from '@/entities/BotAssignment';
import { Conversation } from '@/entities/Conversation';
import { BotDocument } from '@/entities/BotDocument';

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

    // Check if user is a manager
    if (user.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can view bots' }, { status: 403 });
    }

    // Get bots created by this manager
    const botRepository = AppDataSource.getRepository("bots");
    const conversationRepository = AppDataSource.getRepository("conversations");
    const botDocumentRepository = AppDataSource.getRepository("bot_documents");
    const bots = await botRepository.find({
      where: { createdBy: user.id },
      order: { createdAt: 'DESC' },
      relations: ['assignments', 'assignments.user', 'botDocuments', 'botDocuments.document']
    });

    // Get real conversation counts for each bot
    // FIX: Count unique conversations properly:
    // - NEW schema (session-based): Each row with sessionId is one conversation
    // - OLD schema (Playground): Each unique botId+userId pair is one conversation
    const botIds = bots.map(bot => bot.id);
    const conversationCountMap: Record<string, number> = {};

    // Initialize counts to 0 for all bots
    botIds.forEach(botId => {
      conversationCountMap[botId] = 0;
    });

    // Only query conversations if there are bots
    if (botIds.length > 0) {
      // Count session-based conversations (NEW schema - WordPress/widget)
      // FIX: Count DISTINCT sessionIds, not rows (multiple rows can share same sessionId)
      const sessionBasedCounts = await conversationRepository
        .createQueryBuilder('conversation')
        .select('conversation.botId')
        .addSelect('COUNT(DISTINCT conversation.sessionId)', 'count')
        .where('conversation.botId IN (:...botIds)', { botIds })
        .andWhere('conversation.sessionId IS NOT NULL')
        .groupBy('conversation.botId')
        .getRawMany();

      // Add session-based counts
      sessionBasedCounts.forEach(item => {
        conversationCountMap[item.conversation_botId] = parseInt(item.count);
      });

      // Count Playground conversations (OLD schema)
      // These don't have sessionId - count unique botId+userId pairs
      const playgroundCounts = await conversationRepository
        .createQueryBuilder('conversation')
        .select('conversation.botId')
        .addSelect('COUNT(DISTINCT conversation.userId)', 'count')
        .where('conversation.botId IN (:...botIds)', { botIds })
        .andWhere('conversation.sessionId IS NULL')
        .andWhere('conversation.userId IS NOT NULL')
        .groupBy('conversation.botId')
        .getRawMany();

      // Add playground counts
      playgroundCounts.forEach(item => {
        conversationCountMap[item.conversation_botId] =
          (conversationCountMap[item.conversation_botId] || 0) + parseInt(item.count);
      });
    }

    // Transform the data to match the expected format
    const formattedBots = bots.map(bot => {
      const allDocs = bot.botDocuments?.map(bd => bd.document) || [];
      // Webpages are documents with type 'url' or 'webpage' or have a url field
      const webpages = allDocs.filter(doc => doc?.type === 'url' || doc?.type === 'webpage' || doc?.url);
      const documents = allDocs.filter(doc => doc?.type !== 'url' && doc?.type !== 'webpage' && !doc?.url);

      return {
        id: bot.id,
        name: bot.name,
        description: bot.description,
        domain: bot.domain,
        status: bot.status,
        conversations: conversationCountMap[bot.id] || 0, // Use real conversation count
        totalUsers: bot.assignments?.length || 0,
        lastActive: bot.lastActive ? new Date(bot.lastActive).toLocaleString() : 'Never',
        assignedUsers: bot.assignments?.map(assignment => assignment.user?.email).filter(Boolean) || [],
        createdAt: bot.createdAt.toISOString().split('T')[0],
        lastConversation: bot.lastActive ? new Date(bot.lastActive).toISOString().split('T')[0] : null,
        documents: allDocs.map(doc => ({
          id: doc?.id,
          name: doc?.name,
          type: doc?.type,
          size: Number(doc?.size) || 0
        })).filter(doc => doc.id) || [],
        webpagesCount: webpages.length,
        documentsCount: documents.length
      };
    });

    return NextResponse.json({ 
      bots: formattedBots,
      totalCount: formattedBots.length 
    });

  } catch (error) {
    console.error('Error fetching bots:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
