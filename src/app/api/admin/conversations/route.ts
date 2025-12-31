import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Conversation } from '@/entities/Conversation';
import { Bot } from '@/entities/Bot';

/**
 * GET /api/admin/conversations
 * Fetch ALL conversations across ALL bots and users (Admin only)
 * Query params:
 *   - sortBy: 'lastMessage' | 'user' | 'bot' | 'messages' (default: lastMessage)
 *   - sortOrder: 'asc' | 'desc' (default: desc)
 *   - status: 'all' | 'active' | 'completed' | 'waiting' | 'idle' (default: all)
 *   - botId: UUID or 'all' (default: all)
 *   - managerId: UUID or 'all' (default: all) - filter by bot owner
 *   - dateRange: 'all' | 'today' | 'week' | 'month' (default: all)
 *   - source: 'all' | 'wordpress' | 'playground' (default: all)
 *   - search: search term for user/bot name
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (error) {
        console.error('Database initialization failed:', error);
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        );
      }
    }

    // Verify admin role
    const userRepository = AppDataSource.getRepository(User);
    const admin = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'lastMessage';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status') || 'all';
    const botId = searchParams.get('botId') || 'all';
    const managerId = searchParams.get('managerId') || 'all';
    const dateRange = searchParams.get('dateRange') || 'all';
    const source = searchParams.get('source') || 'all';
    const search = searchParams.get('search') || '';

    // Get all bots for filter options
    const botRepository = AppDataSource.getRepository(Bot);
    const allBots = await botRepository.find();

    // Get all managers for filter options
    const allManagers = await userRepository.find({
      where: { role: 'manager' },
      select: ['id', 'firstName', 'lastName', 'email']
    });

    // Build query for ALL conversations
    const conversationRepository = AppDataSource.getRepository(Conversation);
    let query = conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.bot', 'bot')
      .leftJoinAndSelect('conversation.user', 'user')
      .leftJoinAndSelect('conversation.assignedAgent', 'assignedAgent');

    // Apply bot filter
    if (botId !== 'all') {
      query = query.andWhere('conversation.botId = :botId', { botId });
    }

    // Apply manager filter (by bot owner)
    if (managerId !== 'all') {
      query = query.andWhere('bot.createdBy = :managerId', { managerId });
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      query = query.andWhere('conversation.createdAt >= :startDate', { startDate });
    }

    // Apply source filter
    // Website conversations have BOTH sessionId AND guestId set
    if (source !== 'all') {
      if (source === 'wordpress') {
        query = query.andWhere('conversation.sessionId IS NOT NULL');
        query = query.andWhere('conversation.guestId IS NOT NULL');
      } else if (source === 'playground') {
        query = query.andWhere('(conversation.sessionId IS NULL OR conversation.guestId IS NULL)');
      }
    }

    // Apply search filter
    if (search) {
      query = query.andWhere(
        '(bot.name ILIKE :search OR conversation.guestName ILIKE :search OR user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'lastMessage':
        query = query.orderBy('conversation.lastMessageAt', sortOrder.toUpperCase() as 'ASC' | 'DESC')
          .addOrderBy('conversation.createdAt', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'user':
        query = query.orderBy('conversation.guestName', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'bot':
        query = query.orderBy('bot.name', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'messages':
        // Can't easily sort by JSONB array length in query, will sort after fetch
        query = query.orderBy('conversation.createdAt', 'DESC');
        break;
      default:
        query = query.orderBy('conversation.lastMessageAt', 'DESC')
          .addOrderBy('conversation.createdAt', 'DESC');
    }

    const conversations = await query.getMany();

    // Format conversations for response
    const formattedConversations = conversations.map(conv => {
      // Determine source
      const isExternalConversation = conv.sessionId && conv.guestId;
      const metadata = typeof conv.metadata === 'string' ? JSON.parse(conv.metadata || '{}') : (conv.metadata || {});
      const convSource = isExternalConversation ? (metadata.source || 'wordpress') : 'playground';

      // Get user info
      let userName: string;
      let userEmail: string;

      if (isExternalConversation) {
        userName = conv.guestName || `Visitor ${conv.guestId || 'Unknown'}`;
        userEmail = conv.visitorEmail || conv.guestId || 'External Visitor';
      } else {
        userName = conv.user
          ? `${conv.user.firstName || ''} ${conv.user.lastName || ''}`.trim() || conv.user.email.split('@')[0]
          : 'Unknown User';
        userEmail = conv.user?.email || 'Unknown';
      }

      // Count messages (exclude system messages)
      let messageCount = 0;
      if (conv.messages && Array.isArray(conv.messages) && conv.messages.length > 0) {
        messageCount = conv.messages.filter((msg: { sender?: string; type?: string; text?: string }) => {
          if (msg.sender === 'system') return false;
          if (msg.type === 'notification') return false;
          if (msg.text && (
            msg.text.includes("Now you're chatting with") ||
            msg.text.includes('automatically returned to AI') ||
            msg.text.includes('transferred to') ||
            msg.text.includes('human agent')
          )) return false;
          return true;
        }).length;
      } else if (conv.message) {
        messageCount = 1;
      }

      // Calculate duration
      const startTime = conv.startedAt || conv.createdAt;
      const endTime = conv.lastMessageAt || conv.createdAt;
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Determine status
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const lastMessageTime = conv.lastMessageAt || conv.createdAt;
      const isActive = lastMessageTime > thirtyMinutesAgo;
      const conversationStatus = conv.status || (isActive ? 'active' : 'completed');

      // Get bot owner info
      const botOwner = allManagers.find(m => m.id === conv.bot?.createdBy);
      const botOwnerName = botOwner
        ? `${botOwner.firstName || ''} ${botOwner.lastName || ''}`.trim() || botOwner.email.split('@')[0]
        : 'Unknown';

      return {
        id: conv.id,
        sessionId: conv.sessionId,
        botId: conv.botId,
        botName: conv.bot?.name || 'Unknown Bot',
        botOwner: botOwnerName,
        botOwnerId: conv.bot?.createdBy,
        userId: conv.userId,
        userName,
        userEmail,
        guestId: conv.guestId,
        visitorEmail: conv.visitorEmail,
        pageUrl: conv.pageUrl,
        country: conv.country,
        ipAddress: conv.ipAddress,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        lastMessageTime: (conv.lastMessageAt || conv.createdAt).toISOString(),
        status: conversationStatus,
        mode: conv.mode,
        messageCount,
        duration: duration > 0 ? `${duration} min` : '< 1 min',
        source: convSource,
        isFlagged: conv.isFlagged,
        flagReason: conv.flagReason,
        reviewStatus: conv.reviewStatus,
        assignedAgent: conv.assignedAgent
          ? {
              id: conv.assignedAgent.id,
              name: `${conv.assignedAgent.firstName || ''} ${conv.assignedAgent.lastName || ''}`.trim() || conv.assignedAgent.email?.split('@')[0] || 'Agent',
              email: conv.assignedAgent.email
            }
          : null,
        createdAt: conv.createdAt.toISOString(),
        messages: conv.messages || []
      };
    });

    // Apply status filter after formatting
    let filteredConversations = formattedConversations;
    if (status !== 'all') {
      filteredConversations = formattedConversations.filter(conv => conv.status === status);
    }

    // Sort by message count if needed
    if (sortBy === 'messages') {
      filteredConversations.sort((a, b) => {
        return sortOrder === 'desc'
          ? b.messageCount - a.messageCount
          : a.messageCount - b.messageCount;
      });
    }

    // Calculate stats
    const total = formattedConversations.length;
    const active = formattedConversations.filter(c => c.status === 'active').length;
    const waiting = formattedConversations.filter(c => c.status === 'waiting').length;
    const completed = formattedConversations.filter(c => c.status === 'completed').length;
    const flagged = formattedConversations.filter(c => c.isFlagged).length;
    const wordpress = formattedConversations.filter(c => c.source === 'wordpress').length;
    const totalMessages = formattedConversations.reduce((sum, c) => sum + c.messageCount, 0);

    return NextResponse.json({
      success: true,
      conversations: filteredConversations,
      stats: {
        total,
        active,
        waiting,
        completed,
        flagged,
        wordpress,
        totalMessages,
        avgMessagesPerConversation: total > 0 ? Math.round(totalMessages / total) : 0
      },
      filters: {
        bots: allBots.map(b => ({
          id: b.id,
          name: b.name,
          owner: b.createdBy
        })),
        managers: allManagers.map(m => ({
          id: m.id,
          name: `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email.split('@')[0],
          email: m.email
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching admin conversations:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/conversations
 * Bulk delete conversations (Admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Verify admin role
    const userRepository = AppDataSource.getRepository(User);
    const admin = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { conversationIds } = body;

    if (!conversationIds || !Array.isArray(conversationIds) || conversationIds.length === 0) {
      return NextResponse.json({ error: 'conversationIds array is required' }, { status: 400 });
    }

    const conversationRepository = AppDataSource.getRepository(Conversation);
    const result = await conversationRepository.delete(conversationIds);

    return NextResponse.json({
      success: true,
      deleted: result.affected || 0
    });

  } catch (error) {
    console.error('Error deleting conversations:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversations' },
      { status: 500 }
    );
  }
}
