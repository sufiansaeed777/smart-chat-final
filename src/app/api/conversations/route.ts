import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { Conversation } from '@/entities/Conversation';
import { User } from '@/entities/User';

/**
 * GET /api/conversations
 * Fetch active conversations for human handoff interface
 * Query params:
 *   - status: 'active' | 'waiting' | 'idle' | 'completed' (optional)
 *   - mode: 'AI' | 'Human' (optional)
 *   - assignedTo: userId (optional)
 *   - botId: botId (optional) - filter conversations by specific bot
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const mode = searchParams.get('mode');
    const assignedTo = searchParams.get('assignedTo');
    const botId = searchParams.get('botId');

    // Initialize database
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (error) {
        console.error('Database initialization failed:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Database connection failed'
          },
          { status: 500 }
        );
      }
    }

    // Get user from database
    const userRepository = AppDataSource.getRepository("users");
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get accessible bot IDs based on user role
    let accessibleBotIds: string[] = [];

    if (currentUser.role === 'admin') {
      // Admins can see all conversations - no filter needed
      accessibleBotIds = [];
    } else if (currentUser.role === 'manager') {
      // Managers can see conversations for their own bots
      const botRepository = AppDataSource.getRepository("bots");
      const managerBots = await botRepository.find({
        where: { createdBy: currentUser.id },
        select: ['id']
      });
      accessibleBotIds = managerBots.map(bot => bot.id);
    } else {
      // Regular users can only see conversations for assigned bots
      const assignmentRepository = AppDataSource.getRepository("bot_assignments");
      const assignments = await assignmentRepository.find({
        where: {
          userId: currentUser.id,
          status: 'active'
        },
        relations: ['bot']
      });
      accessibleBotIds = assignments
        .map(assignment => assignment.bot?.id)
        .filter(Boolean) as string[];
    }

    const conversationRepository = AppDataSource.getRepository(Conversation);

    // Build query
    const queryBuilder = conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.bot', 'bot')
      .leftJoinAndSelect('conversation.user', 'user')
      .leftJoinAndSelect('conversation.assignedAgent', 'assignedAgent')
      .orderBy('conversation.lastMessageAt', 'DESC')
      .addOrderBy('conversation.createdAt', 'DESC');

    // Apply bot access filter (unless admin)
    if (currentUser.role !== 'admin' && accessibleBotIds.length > 0) {
      queryBuilder.andWhere('conversation.botId IN (:...accessibleBotIds)', { accessibleBotIds });
    } else if (currentUser.role !== 'admin' && accessibleBotIds.length === 0) {
      // User has no accessible bots - return empty
      return NextResponse.json({
        success: true,
        conversations: [],
        total: 0
      });
    }

    // Apply filters
    if (status) {
      // Support comma-separated statuses (e.g., status=completed,idle)
      const statuses = status.split(',').map(s => s.trim());
      if (statuses.length === 1) {
        queryBuilder.andWhere('conversation.status = :status', { status: statuses[0] });
      } else {
        queryBuilder.andWhere('conversation.status IN (:...statuses)', { statuses });
      }
    }

    if (mode) {
      queryBuilder.andWhere('conversation.mode = :mode', { mode });
    }

    if (assignedTo) {
      queryBuilder.andWhere('conversation.assignedAgentId = :assignedTo', { assignedTo });
    }

    if (botId) {
      // If specific botId requested, verify user has access to it
      if (currentUser.role !== 'admin' && !accessibleBotIds.includes(botId)) {
        return NextResponse.json({
          success: false,
          error: 'Access denied to this bot'
        }, { status: 403 });
      }
      queryBuilder.andWhere('conversation.botId = :botId', { botId });
    }

    // Exclude completed/closed conversations by default unless specifically requested
    if (!status) {
      queryBuilder.andWhere('conversation.status IN (:...statuses)', {
        statuses: ['active', 'waiting', 'idle']
      });
    }

    const conversations = await queryBuilder.getMany();

    // Transform to frontend format
    const formattedConversations = conversations.map(conv => {
      const fallbackId = conv.sessionId?.slice(-4) || conv.id.slice(-4);
      const metadata = conv.metadata || {};

      // Determine visitor name - if user is logged in, use their info
      let visitorName = 'Guest';
      let visitorEmail = '';
      if (conv.user && conv.user.email) {
        visitorName = conv.user.firstName && conv.user.lastName
          ? `${conv.user.firstName} ${conv.user.lastName}`
          : conv.user.email.split('@')[0];
        visitorEmail = conv.user.email;
      } else if (conv.guestName) {
        visitorName = conv.guestName;
      }

      // Get visitor email from entity field, metadata, or user
      const finalVisitorEmail = conv.visitorEmail || visitorEmail || metadata.email || '';

      // Get page URL from entity field or metadata
      const finalPageUrl = conv.pageUrl || metadata.pageUrl || metadata.page_url || metadata.url || metadata.referrer || '';

      // Get country from entity field or metadata
      const finalCountry = conv.country || metadata.country || metadata.location || '';

      // Get first message time and text
      const firstMessageTime = conv.messages?.length > 0
        ? conv.messages[0].timestamp
        : conv.createdAt?.toISOString();

      // Get first visitor message (the actual first message content)
      const firstVisitorMessage = conv.messages?.find(m => m.sender === 'visitor');
      const firstMessageText = firstVisitorMessage?.text || 'No messages yet';

      // Check if this is a human handoff request (mode is Human and status is waiting)
      const isHandoffRequest = conv.mode === 'Human' && conv.status === 'waiting';

      return {
        id: conv.id,
        sessionId: conv.sessionId,
        guestName: visitorName,
        guestId: conv.guestId || `LC-${fallbackId}`,
        visitorEmail: finalVisitorEmail,
        pageUrl: finalPageUrl,
        country: finalCountry,
        ipAddress: conv.ipAddress || metadata.ipAddress || metadata.ip || '',
        mode: conv.mode,
        status: conv.status,
        messages: conv.messages || [],
        messageCount: conv.messages?.filter((m: { sender?: string; type?: string; text?: string }) => {
          // Exclude system/notification messages from count
          if (m.sender === 'system') return false;
          if (m.type === 'notification') return false;
          if (m.text && (
            m.text.includes("Now you're chatting with") ||
            m.text.includes('automatically returned to AI') ||
            m.text.includes('transferred to') ||
            m.text.includes('human agent')
          )) return false;
          return true;
        }).length || 0,
        lastMessage: conv.messages?.length > 0
          ? conv.messages[conv.messages.length - 1].text
          : 'No messages yet',
        firstMessage: firstMessageText,
        timestamp: conv.lastMessageAt
          ? getRelativeTime(new Date(conv.lastMessageAt))
          : 'Just now',
        firstMessageTime: firstMessageTime,
        isHandoffRequest: isHandoffRequest,
        botName: conv.bot?.name,
        assignedAgent: conv.assignedAgent
          ? {
              id: conv.assignedAgent.id,
              name: conv.assignedAgent.firstName && conv.assignedAgent.lastName
                ? `${conv.assignedAgent.firstName} ${conv.assignedAgent.lastName}`
                : conv.assignedAgentName || conv.assignedAgent.email?.split('@')[0] || 'Agent',
              email: conv.assignedAgent.email
            }
          : null,
        assignedAt: conv.assignedAt,
        createdAt: conv.createdAt,
        lastMessageAt: conv.lastMessageAt,
        metadata: conv.metadata
      };
    });

    return NextResponse.json({
      success: true,
      conversations: formattedConversations,
      total: formattedConversations.length
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch conversations',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get relative time string
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}
