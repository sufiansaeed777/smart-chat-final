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
    let conversationCounts = [];

    // Only query conversations if there are bots
    if (botIds.length > 0) {
      conversationCounts = await conversationRepository
        .createQueryBuilder('conversation')
        .select('conversation.botId')
        .addSelect('COUNT(*)', 'count')
        .where('conversation.botId IN (:...botIds)', { botIds })
        .groupBy('conversation.botId')
        .getRawMany();
    }

    // Create a map of botId to conversation count
    const conversationCountMap = conversationCounts.reduce((acc, item) => {
      acc[item.conversation_botId] = parseInt(item.count);
      return acc;
    }, {} as Record<string, number>);

    // Transform the data to match the expected format
    const formattedBots = bots.map(bot => ({
      id: bot.id,
      name: bot.name,
      description: bot.description,
      domain: bot.domain,
      status: bot.status,
      category: bot.category || 'General',
      conversations: conversationCountMap[bot.id] || 0, // Use real conversation count
      users: bot.assignments?.length || 0,
      totalUsers: bot.assignments?.length || 0,
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
    }));

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
