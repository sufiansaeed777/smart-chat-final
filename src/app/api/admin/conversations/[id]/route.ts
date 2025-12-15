import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Conversation } from '@/entities/Conversation';

/**
 * GET /api/admin/conversations/[id]
 * Get single conversation details (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userRepository = AppDataSource.getRepository(User);
    const conversationRepository = AppDataSource.getRepository(Conversation);

    // Verify admin role
    const admin = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const conversationId = (await params).id;

    // Helper to ensure timestamp is a valid ISO string
    const formatTimestamp = (ts: any, fallback: any): string => {
      if (ts) {
        const date = new Date(ts);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      if (fallback) {
        const fallbackDate = new Date(fallback);
        if (!isNaN(fallbackDate.getTime())) {
          return fallbackDate.toISOString();
        }
      }
      return new Date().toISOString();
    };

    // Check if this is a session-based conversation
    const isSessionBased = conversationId.startsWith('session-');

    let conversation: any;

    if (isSessionBased) {
      // Session-based conversation - lookup by sessionId
      const sessionId = conversationId.replace('session-', '');

      const conv = await conversationRepository.findOne({
        where: { sessionId },
        relations: ['bot', 'user', 'assignedAgent']
      });

      if (!conv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      const messages = conv.messages || [];

      conversation = {
        id: conversationId,
        sessionId: conv.sessionId,
        botId: conv.botId,
        botName: conv.bot?.name || 'Unknown Bot',
        userId: conv.userId,
        guestName: conv.guestName,
        guestId: conv.guestId,
        visitorEmail: conv.visitorEmail,
        pageUrl: conv.pageUrl,
        country: conv.country,
        ipAddress: conv.ipAddress,
        mode: conv.mode,
        status: conv.status,
        source: 'wordpress',
        isFlagged: conv.isFlagged,
        flagReason: conv.flagReason,
        reviewStatus: conv.reviewStatus,
        assignedAgent: conv.assignedAgent
          ? {
              id: conv.assignedAgent.id,
              name: `${conv.assignedAgent.firstName || ''} ${conv.assignedAgent.lastName || ''}`.trim() || conv.assignedAgent.email?.split('@')[0],
              email: conv.assignedAgent.email
            }
          : null,
        createdAt: conv.createdAt?.toISOString(),
        messages: messages.map((msg: any, index: number) => ({
          id: msg.id || `msg-${index}`,
          message: msg.text || msg.message,
          sender: msg.sender === 'visitor' ? 'user' : msg.sender === 'bot' ? 'bot' : msg.sender,
          timestamp: formatTimestamp(msg.timestamp, conv.createdAt),
          isTestMessage: false
        }))
      };
    } else {
      // Check if this is a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (uuidRegex.test(conversationId)) {
        const conv = await conversationRepository.findOne({
          where: { id: conversationId },
          relations: ['bot', 'user', 'assignedAgent']
        });

        if (conv) {
          if (conv.messages && Array.isArray(conv.messages) && conv.messages.length > 0) {
            // New schema: Session-based conversation with messages array
            conversation = {
              id: conversationId,
              sessionId: conv.sessionId,
              botId: conv.botId,
              botName: conv.bot?.name || 'Unknown Bot',
              userId: conv.userId,
              guestName: conv.guestName,
              guestId: conv.guestId,
              visitorEmail: conv.visitorEmail,
              pageUrl: conv.pageUrl,
              country: conv.country,
              ipAddress: conv.ipAddress,
              mode: conv.mode,
              status: conv.status,
              source: conv.guestId ? 'wordpress' : 'playground',
              isFlagged: conv.isFlagged,
              flagReason: conv.flagReason,
              reviewStatus: conv.reviewStatus,
              assignedAgent: conv.assignedAgent
                ? {
                    id: conv.assignedAgent.id,
                    name: `${conv.assignedAgent.firstName || ''} ${conv.assignedAgent.lastName || ''}`.trim() || conv.assignedAgent.email?.split('@')[0],
                    email: conv.assignedAgent.email
                  }
                : null,
              createdAt: conv.createdAt?.toISOString(),
              messages: conv.messages.map((msg: any, index: number) => ({
                id: msg.id || `msg-${index}`,
                message: msg.text || msg.message,
                sender: msg.sender === 'visitor' ? 'user' : msg.sender === 'bot' ? 'bot' : msg.sender,
                timestamp: formatTimestamp(msg.timestamp, conv.createdAt),
                isTestMessage: false
              }))
            };
          } else if (conv.message || (!conv.messages && conv.botId && conv.userId)) {
            // Old schema: Single message per row
            const allMessages = await conversationRepository.find({
              where: {
                botId: conv.botId,
                userId: conv.userId
              },
              order: { createdAt: 'ASC' }
            });

            conversation = {
              id: conversationId,
              sessionId: conv.sessionId,
              botId: conv.botId,
              botName: conv.bot?.name || 'Unknown Bot',
              source: 'playground',
              createdAt: conv.createdAt?.toISOString(),
              messages: allMessages.map(msg => ({
                id: msg.id,
                message: msg.message,
                sender: msg.sender || 'user',
                timestamp: formatTimestamp(msg.createdAt, new Date()),
                isTestMessage: msg.isTestMessage || false
              }))
            };
          }
        }
      }

      // Fall back to old schema parsing (botId-userId format)
      if (!conversation) {
        const parts = conversationId.split('-');
        const userId = parts.slice(-5).join('-');
        const botId = parts.slice(0, -5).join('-');

        const conversations = await conversationRepository.find({
          where: {
            botId: botId,
            userId: userId
          },
          order: { createdAt: 'ASC' },
          relations: ['bot']
        });

        if (conversations.length === 0) {
          return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        conversation = {
          id: conversationId,
          botId: botId,
          botName: conversations[0].bot?.name || 'Unknown Bot',
          source: 'playground',
          messages: conversations.map(conv => ({
            id: conv.id,
            message: conv.message,
            sender: conv.sender,
            timestamp: formatTimestamp(conv.createdAt, new Date()),
            isTestMessage: conv.isTestMessage || false
          }))
        };
      }
    }

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, conversation });

  } catch (error) {
    console.error('Error fetching conversation details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation details' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/conversations/[id]
 * Delete a single conversation (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userRepository = AppDataSource.getRepository(User);
    const conversationRepository = AppDataSource.getRepository(Conversation);

    // Verify admin role
    const admin = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const conversationId = (await params).id;

    // Check if this is a session-based conversation
    const isSessionBased = conversationId.startsWith('session-');

    if (isSessionBased) {
      const sessionId = conversationId.replace('session-', '');
      const conv = await conversationRepository.findOne({
        where: { sessionId }
      });

      if (!conv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      await conversationRepository.remove(conv);
      return NextResponse.json({ success: true, message: 'Conversation deleted successfully' });
    }

    // Check if this is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(conversationId)) {
      const conv = await conversationRepository.findOne({
        where: { id: conversationId }
      });

      if (conv) {
        await conversationRepository.remove(conv);
        return NextResponse.json({ success: true, message: 'Conversation deleted successfully' });
      }
    }

    // Fall back to old schema parsing
    const parts = conversationId.split('-');
    const userId = parts.slice(-5).join('-');
    const botId = parts.slice(0, -5).join('-');

    const conversations = await conversationRepository.find({
      where: {
        botId: botId,
        userId: userId
      }
    });

    if (conversations.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    await conversationRepository.remove(conversations);

    return NextResponse.json({ success: true, message: 'Conversation deleted successfully' });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
