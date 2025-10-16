import { NextRequest, NextResponse } from 'next/server';
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
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const mode = searchParams.get('mode');
    const assignedTo = searchParams.get('assignedTo');

    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
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

    // Apply filters
    if (status) {
      queryBuilder.andWhere('conversation.status = :status', { status });
    }

    if (mode) {
      queryBuilder.andWhere('conversation.mode = :mode', { mode });
    }

    if (assignedTo) {
      queryBuilder.andWhere('conversation.assignedAgentId = :assignedTo', { assignedTo });
    }

    // Exclude completed/closed conversations by default unless specifically requested
    if (!status) {
      queryBuilder.andWhere('conversation.status IN (:...statuses)', {
        statuses: ['active', 'waiting', 'idle']
      });
    }

    const conversations = await queryBuilder.getMany();

    // Transform to frontend format
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      sessionId: conv.sessionId,
      guestName: conv.guestName || `Guest #${conv.sessionId?.slice(-4)}`,
      guestId: conv.guestId || `LC-${conv.sessionId?.slice(-4)}`,
      mode: conv.mode,
      status: conv.status,
      messages: conv.messages || [],
      lastMessage: conv.messages?.length > 0
        ? conv.messages[conv.messages.length - 1].text
        : 'No messages yet',
      timestamp: conv.lastMessageAt
        ? getRelativeTime(new Date(conv.lastMessageAt))
        : 'Just now',
      botName: conv.bot?.name,
      assignedAgent: conv.assignedAgent
        ? {
            id: conv.assignedAgent.id,
            name: conv.assignedAgent.name || conv.assignedAgentName,
            email: conv.assignedAgent.email
          }
        : null,
      assignedAt: conv.assignedAt,
      createdAt: conv.createdAt,
      lastMessageAt: conv.lastMessageAt,
      metadata: conv.metadata
    }));

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
