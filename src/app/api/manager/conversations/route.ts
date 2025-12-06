import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { BotAssignment } from '@/entities/BotAssignment';
import { Conversation } from '@/entities/Conversation';
import { Bot } from '@/entities/Bot';
import { In } from 'typeorm';

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

    // Get manager from database
    const userRepository = AppDataSource.getRepository(User);
    const manager = await userRepository.findOne({ 
      where: { email: session.user.email } 
    });

    if (!manager || manager.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // Get query parameters for filtering and sorting
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'lastMessage';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status') || 'all';
    const botId = searchParams.get('botId') || 'all';
    const userId = searchParams.get('userId') || 'all';
    const dateRange = searchParams.get('dateRange') || 'all';

    // Get all users invited by this manager
    const invitedUsers = await userRepository.find({
      where: { invitedBy: manager.id },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt', 'password', 'lastLoginAt']
    });

    // Include the manager themselves in the user list for their own conversations
    const allRelevantUsers = [...invitedUsers, manager];
    const relevantUserIds = allRelevantUsers.map(u => u.id);

    if (relevantUserIds.length === 0) {
      return NextResponse.json({
        conversations: [],
        stats: {
          total: 0,
          active: 0,
          completed: 0,
          avgResponseTime: '0 min'
        }
      });
    }

    // Get bot assignments for these users
    const assignmentRepository = AppDataSource.getRepository(BotAssignment);
    const assignments = await assignmentRepository.find({
      where: { 
        userId: In(relevantUserIds),
        status: 'active'
      },
      relations: ['bot']
    });

    // Also get bots created by the manager (for manager's own conversations)
    const botRepository = AppDataSource.getRepository(Bot);
    const managerBots = await botRepository.find({
      where: { createdBy: manager.id }
    });

    const assignedBotIds = assignments.map(a => a.botId).filter(Boolean);
    const managerBotIds = managerBots.map(b => b.id);
    const allBotIds = [...new Set([...assignedBotIds, ...managerBotIds])]; // Remove duplicates

    if (allBotIds.length === 0) {
      return NextResponse.json({
        conversations: [],
        stats: {
          total: 0,
          active: 0,
          completed: 0,
          avgResponseTime: '0 min'
        },
        filters: {
          bots: [],
          users: allRelevantUsers.map(u => ({ 
            id: u.id, 
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email.split('@')[0],
            email: u.email 
          }))
        }
      });
    }

    // Build query for conversations
    // FIX: Include WordPress conversations (they have guestId instead of registered userId)
    // WordPress conversations have userId = bot owner, but they're guests with guestId
    let query = AppDataSource.getRepository(Conversation)
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.bot', 'bot')
      .leftJoinAndSelect('conversation.user', 'user')
      .where('conversation.botId IN (:...allBotIds)', { allBotIds })
      .andWhere(
        '(conversation.userId IN (:...relevantUserIds) OR conversation.guestId IS NOT NULL)',
        { relevantUserIds }
      );

    // Apply filters
    if (botId !== 'all') {
      query = query.andWhere('conversation.botId = :botId', { botId });
    }

    if (userId !== 'all') {
      query = query.andWhere('conversation.userId = :userId', { userId });
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

    // Apply sorting
    switch (sortBy) {
      case 'lastMessage':
        query = query.orderBy('conversation.createdAt', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'user':
        query = query.orderBy('user.email', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'bot':
        query = query.orderBy('bot.name', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      default:
        query = query.orderBy('conversation.createdAt', 'DESC');
    }

    const conversations = await query.getMany();

    // Group conversations - handle both old schema (individual records) and new schema (session-based with JSONB)
    const conversationSessions = new Map<string, {
      id: string;
      botId: string;
      botName: string;
      userId: string;
      userName: string;
      userEmail: string;
      startTime: Date;
      endTime: Date;
      lastMessageAt: Date;
      messageCount: number;
      conversations: Conversation[];
      status: string;
      source: string;
      guestId?: string;
      mode?: string;
      messages: { id: string; content: string; timestamp: Date }[]
    }>();

    conversations.forEach(conv => {
      // Determine if this is a WordPress/external conversation (session-based with guestId)
      const isExternalConversation = conv.sessionId && conv.guestId;

      // For external conversations, use sessionId as key; for internal, use botId-userId
      const sessionKey = isExternalConversation
        ? `session-${conv.sessionId}`
        : `${conv.botId}-${conv.userId}`;

      if (!conversationSessions.has(sessionKey)) {
        const user = allRelevantUsers.find(u => u.id === conv.userId);
        const bot = [...assignments.map(a => a.bot).filter(Boolean), ...managerBots].find(b => b?.id === conv.botId);

        // For external conversations, use guest info; for internal, use registered user info
        let userName: string;
        let userEmail: string;

        if (isExternalConversation) {
          userName = conv.guestName || `Visitor ${conv.guestId || 'Unknown'}`;
          userEmail = conv.guestId || 'External Visitor';
        } else {
          userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0] : 'Unknown User';
          userEmail = user?.email || 'Unknown';
        }

        // For session-based conversations, use stored timestamps; for old schema, use createdAt
        const startTime = conv.startedAt || conv.createdAt;
        const endTime = conv.lastMessageAt || conv.createdAt;

        // Count messages - for JSONB array, count array length; for old schema, count records
        // IMPORTANT: Exclude system/notification messages from count
        let messageCount = 0;
        if (conv.messages && Array.isArray(conv.messages) && conv.messages.length > 0) {
          // Count only user, AI, and agent messages (exclude system/notification)
          messageCount = conv.messages.filter((msg: { sender?: string; type?: string; text?: string }) => {
            // Exclude system messages
            if (msg.sender === 'system') return false;
            // Exclude notification type messages
            if (msg.type === 'notification') return false;
            // Exclude messages that look like system notifications
            if (msg.text && (
              msg.text.includes("Now you're chatting with") ||
              msg.text.includes('automatically returned to AI') ||
              msg.text.includes('transferred to') ||
              msg.text.includes('human agent')
            )) return false;
            return true;
          }).length;
        } else if (conv.message) {
          messageCount = 1; // Old schema - individual record
        }

        // Determine source
        let source = 'playground';
        if (isExternalConversation) {
          const metadata = typeof conv.metadata === 'string' ? JSON.parse(conv.metadata || '{}') : (conv.metadata || {});
          source = metadata.source || 'wordpress';
        }

        conversationSessions.set(sessionKey, {
          id: conv.id || sessionKey, // Use actual conversation ID for session-based
          botId: conv.botId,
          botName: bot?.name || 'Unknown Bot',
          userId: conv.userId,
          userName,
          userEmail,
          startTime,
          endTime,
          lastMessageAt: endTime,
          messageCount,
          conversations: [conv],
          status: conv.status || 'active',
          source,
          guestId: conv.guestId,
          mode: conv.mode,
          messages: []
        });
      } else {
        // For old schema (individual records), aggregate into session
        const session = conversationSessions.get(sessionKey);
        if (session && !isExternalConversation) {
          session.conversations.push(conv);
          session.messageCount++;

          // Update start and end times
          if (conv.createdAt < session.startTime) {
            session.startTime = conv.createdAt;
          }
          if (conv.createdAt > session.endTime) {
            session.endTime = conv.createdAt;
            session.lastMessageAt = conv.createdAt;
          }
        }
      }
    });

    // Convert to array and format
    const formattedSessions = Array.from(conversationSessions.values()).map(session => {
      // Auto-complete: If no message for 30 minutes, mark as completed
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const lastMessageTime = session.lastMessageAt || session.endTime;
      const isActive = lastMessageTime > thirtyMinutesAgo;
      const sessionStatus = isActive ? 'active' : 'completed';

      const duration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60));

      return {
        id: session.id,
        botId: session.botId,
        botName: session.botName,
        userId: session.userId,
        userName: session.userName,
        userEmail: session.userEmail,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString(),
        lastMessageTime: session.lastMessageAt.toISOString(),
        status: sessionStatus,
        messageCount: session.messageCount,
        duration: duration > 0 ? `${duration} min` : '< 1 min',
        satisfaction: Math.floor(Math.random() * 2) + 4, // Mock rating between 4-5
        source: session.source,
        guestId: session.guestId,
        mode: session.mode
      };
    });

    // Apply status filter after formatting
    let filteredSessions = formattedSessions;
    if (status !== 'all') {
      filteredSessions = formattedSessions.filter(session => session.status === status);
    }

    // Calculate stats
    const total = formattedSessions.length;
    const active = formattedSessions.filter(s => s.status === 'active').length;
    const completed = formattedSessions.filter(s => s.status === 'completed').length;
    const avgResponseTime = formattedSessions.length > 0 
      ? `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 9)} min`
      : '0 min';

    return NextResponse.json({
      conversations: filteredSessions,
      stats: {
        total,
        active,
        completed,
        avgResponseTime
      },
      filters: {
        bots: [...assignments.map(a => ({ id: a.botId, name: a.bot?.name || 'Unknown' })), ...managerBots.map(b => ({ id: b.id, name: b.name }))]
          .filter((bot, index, self) => self.findIndex(b => b.id === bot.id) === index), // Remove duplicate bots
        users: allRelevantUsers.map(u => ({ 
          id: u.id, 
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email.split('@')[0],
          email: u.email 
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching manager conversations:', error);
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
