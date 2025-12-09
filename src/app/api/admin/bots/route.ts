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

    // Check if user is an admin
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can view all bots' }, { status: 403 });
    }

    // Get all bots (admin can see everything)
    const botRepository = AppDataSource.getRepository("bots");
    const conversationRepository = AppDataSource.getRepository("conversations");
    const botDocumentRepository = AppDataSource.getRepository("bot_documents");

    const bots = await botRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['assignments', 'assignments.user', 'botDocuments', 'botDocuments.document']
    });

    // Get real conversation counts for each bot
    const botIds = bots.map(bot => bot.id);
    let conversationCounts: any[] = [];
    let completedCounts: any[] = [];
    let allConversations: any[] = [];

    // Only query conversations if there are bots
    if (botIds.length > 0) {
      // Get total conversation counts
      conversationCounts = await conversationRepository
        .createQueryBuilder('conversation')
        .select('conversation.botId')
        .addSelect('COUNT(*)', 'count')
        .where('conversation.botId IN (:...botIds)', { botIds })
        .groupBy('conversation.botId')
        .getRawMany();

      // Get completed conversation counts for resolution rate
      completedCounts = await conversationRepository
        .createQueryBuilder('conversation')
        .select('conversation.botId')
        .addSelect('COUNT(*)', 'count')
        .where('conversation.botId IN (:...botIds)', { botIds })
        .andWhere('conversation.status = :status', { status: 'completed' })
        .groupBy('conversation.botId')
        .getRawMany();

      // Get all conversations with messages for response time calculation
      allConversations = await conversationRepository
        .createQueryBuilder('conversation')
        .select(['conversation.botId', 'conversation.messages', 'conversation.status'])
        .where('conversation.botId IN (:...botIds)', { botIds })
        .getMany();
    }

    // Create maps for counts
    const conversationCountMap = conversationCounts.reduce((acc, item) => {
      const botId = item.conversation_botId || item.botId || item.bot_id || item['conversation_bot_id'];
      const count = parseInt(item.count || item.COUNT || '0');
      if (botId) acc[botId] = count;
      return acc;
    }, {} as Record<string, number>);

    const completedCountMap = completedCounts.reduce((acc, item) => {
      const botId = item.conversation_botId || item.botId || item.bot_id || item['conversation_bot_id'];
      const count = parseInt(item.count || item.COUNT || '0');
      if (botId) acc[botId] = count;
      return acc;
    }, {} as Record<string, number>);

    // Calculate response times per bot from message data
    const responseTimeMap: Record<string, { totalMs: number; count: number }> = {};

    allConversations.forEach(conv => {
      if (!conv.messages || !Array.isArray(conv.messages) || conv.messages.length < 2) return;

      const botId = conv.botId;
      if (!responseTimeMap[botId]) {
        responseTimeMap[botId] = { totalMs: 0, count: 0 };
      }

      // Calculate response times between visitor messages and bot responses
      for (let i = 0; i < conv.messages.length - 1; i++) {
        const currentMsg = conv.messages[i];
        const nextMsg = conv.messages[i + 1];

        if ((currentMsg.sender === 'visitor' || currentMsg.sender === 'user') &&
            (nextMsg.sender === 'bot' || nextMsg.sender === 'agent')) {
          const userTime = new Date(currentMsg.timestamp).getTime();
          const botTime = new Date(nextMsg.timestamp).getTime();
          const responseTime = botTime - userTime;

          // Only count valid response times (positive and less than 5 minutes)
          if (responseTime > 0 && responseTime < 300000) {
            responseTimeMap[botId].totalMs += responseTime;
            responseTimeMap[botId].count++;
          }
        }
      }
    });

    // Transform the data to match the expected format with analytics
    const formattedBots = bots.map(bot => {
      const totalConversations = conversationCountMap[bot.id] || 0;
      const completedConversations = completedCountMap[bot.id] || 0;

      // Calculate resolution rate (% of completed conversations)
      const resolutionRate = totalConversations > 0
        ? Math.round((completedConversations / totalConversations) * 100)
        : 0;

      // Calculate average response time in seconds
      const responseData = responseTimeMap[bot.id];
      const avgResponseTimeMs = responseData && responseData.count > 0
        ? responseData.totalMs / responseData.count
        : 0;
      const responseTime = Math.round(avgResponseTimeMs / 100) / 10; // Convert to seconds with 1 decimal

      // Calculate satisfaction score (1-5 scale based on resolution rate and response time)
      // Higher resolution rate and lower response time = higher satisfaction
      let satisfaction = 0;
      if (totalConversations > 0) {
        // Base score from resolution rate (0-2.5 points)
        const resolutionScore = (resolutionRate / 100) * 2.5;
        // Response time score (0-2.5 points) - faster is better
        // Under 2 seconds = 2.5, under 5 seconds = 2.0, under 10 seconds = 1.5, else = 1.0
        let responseScore = 1.0;
        if (responseTime > 0 && responseTime < 2) responseScore = 2.5;
        else if (responseTime >= 2 && responseTime < 5) responseScore = 2.0;
        else if (responseTime >= 5 && responseTime < 10) responseScore = 1.5;
        else if (responseTime === 0) responseScore = 2.0; // No data, assume average

        satisfaction = Math.round((resolutionScore + responseScore) * 10) / 10;
        satisfaction = Math.min(5, Math.max(0, satisfaction)); // Clamp between 0-5
      }

      return {
        id: bot.id,
        name: bot.name,
        description: bot.description,
        domain: bot.domain,
        status: bot.status,
        category: bot.category || 'General',
        conversations: totalConversations,
        users: bot.assignments?.length || 0,
        totalUsers: bot.assignments?.length || 0,
        // Analytics metrics
        satisfaction,
        responseTime,
        resolutionRate,
        lastActive: bot.lastActive ? new Date(bot.lastActive).toLocaleString() : 'Never',
        assignedUsers: bot.assignments?.map(assignment => assignment.user?.email).filter(Boolean) || [],
        createdBy: bot.createdBy || 'Unknown',
        createdAt: bot.createdAt.toISOString().split('T')[0],
        lastConversation: bot.lastActive ? new Date(bot.lastActive).toISOString().split('T')[0] : null,
        documents: bot.botDocuments?.map(bd => ({
          id: bd.document.id,
          name: bd.document.name,
          type: bd.document.type,
          size: Number(bd.document.size) || 0
        })) || []
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

// PATCH /api/admin/bots - Update a bot
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository("users");
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update bots' }, { status: 403 });
    }

    const { botId, updates } = await request.json();

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    const botRepository = AppDataSource.getRepository("bots");
    const bot = await botRepository.findOne({ where: { id: botId } });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Update bot fields
    if (updates.name !== undefined) bot.name = updates.name;
    if (updates.description !== undefined) bot.description = updates.description;
    if (updates.domain !== undefined) bot.domain = updates.domain;
    if (updates.status !== undefined) bot.status = updates.status;
    if (updates.category !== undefined) bot.category = updates.category;

    await botRepository.save(bot);

    return NextResponse.json({
      success: true,
      message: 'Bot updated successfully',
      bot: {
        id: bot.id,
        name: bot.name,
        description: bot.description,
        domain: bot.domain,
        status: bot.status
      }
    });

  } catch (error) {
    console.error('Error updating bot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/bots - Delete a bot
export async function DELETE(request: NextRequest) {
  try {
    console.log('[Delete Bot] API called');
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository("users");
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete bots' }, { status: 403 });
    }

    const { botId } = await request.json();
    console.log('[Delete Bot] Bot ID:', botId);

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    const botRepository = AppDataSource.getRepository("bots");
    const bot = await botRepository.findOne({ where: { id: botId } });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    console.log('[Delete Bot] Found bot:', bot.name);

    // Delete related data first to avoid foreign key constraint errors

    // 1. Delete bot assignments
    const assignmentRepository = AppDataSource.getRepository("bot_assignments");
    const deletedAssignments = await assignmentRepository.delete({ botId });
    console.log('[Delete Bot] Deleted bot assignments:', deletedAssignments.affected);

    // 2. Delete bot documents
    const botDocumentRepository = AppDataSource.getRepository("bot_documents");
    const deletedBotDocs = await botDocumentRepository.delete({ botId });
    console.log('[Delete Bot] Deleted bot documents:', deletedBotDocs.affected);

    // 3. Delete conversations
    const conversationRepository = AppDataSource.getRepository("conversations");
    const deletedConversations = await conversationRepository.delete({ botId });
    console.log('[Delete Bot] Deleted conversations:', deletedConversations.affected);

    // 4. Delete document embeddings (if any specific to this bot)
    // Note: We're not deleting from document_embeddings table as documents might be shared

    // 5. Finally, delete the bot itself
    const deletedBot = await botRepository.delete(botId);
    console.log('[Delete Bot] Deleted bot:', deletedBot.affected);

    return NextResponse.json({
      success: true,
      message: 'Bot and all related data deleted successfully',
      deletedData: {
        bot: deletedBot.affected,
        assignments: deletedAssignments.affected,
        documents: deletedBotDocs.affected,
        conversations: deletedConversations.affected
      }
    });

  } catch (error) {
    console.error('[Delete Bot] Error:', error);
    console.error('[Delete Bot] Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
