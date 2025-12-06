import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Conversation } from '@/entities/Conversation';

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

    // Get current user
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser || currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const conversationId = (await params).id;

    // Check if this is a session-based conversation (WordPress/external) or old schema
    const isSessionBased = conversationId.startsWith('session-');

    let conversation: any;

    if (isSessionBased) {
      // Session-based conversation - lookup by sessionId
      const sessionId = conversationId.replace('session-', '');

      const conv = await conversationRepository.findOne({
        where: { sessionId }
      });

      if (!conv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Messages are stored in JSONB array
      const messages = conv.messages || [];

      // Helper to ensure timestamp is a valid ISO string
      const formatTimestamp = (ts: any, fallback: any): string => {
        if (ts) {
          // If it's already a valid date string or Date object
          const date = new Date(ts);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        }
        // Use fallback (createdAt)
        if (fallback) {
          const fallbackDate = new Date(fallback);
          if (!isNaN(fallbackDate.getTime())) {
            return fallbackDate.toISOString();
          }
        }
        return new Date().toISOString();
      };

      conversation = {
        id: conversationId,
        sessionId: conv.sessionId,
        guestName: conv.guestName,
        guestId: conv.guestId,
        mode: conv.mode,
        status: conv.status,
        source: 'wordpress',
        messages: messages.map((msg: any, index: number) => ({
          id: msg.id || `msg-${index}`,
          message: msg.text || msg.message,
          sender: msg.sender === 'visitor' ? 'user' : msg.sender === 'bot' ? 'bot' : msg.sender,
          timestamp: formatTimestamp(msg.timestamp, conv.createdAt),
          isTestMessage: false
        }))
      };
    } else {
      // Check if this is a UUID (actual conversation ID from session-based)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

      if (uuidRegex.test(conversationId)) {
        // Try to find by actual ID first
        const conv = await conversationRepository.findOne({
          where: { id: conversationId }
        });

        if (conv) {
          // Check if this is a new schema conversation (has messages in JSONB array)
          // OR an old schema conversation (has single message field)
          if (conv.messages && Array.isArray(conv.messages) && conv.messages.length > 0) {
            // New schema: Session-based conversation with messages array
            conversation = {
              id: conversationId,
              sessionId: conv.sessionId,
              guestName: conv.guestName,
              guestId: conv.guestId,
              mode: conv.mode,
              status: conv.status,
              source: conv.guestId ? 'wordpress' : 'playground',
              messages: conv.messages.map((msg: any, index: number) => ({
                id: msg.id || `msg-${index}`,
                message: msg.text || msg.message,
                sender: msg.sender === 'visitor' ? 'user' : msg.sender === 'bot' ? 'bot' : msg.sender,
                timestamp: formatTimestamp(msg.timestamp, conv.createdAt),
                isTestMessage: false
              }))
            };
          } else if (conv.message || (!conv.messages && conv.botId && conv.userId)) {
            // Old schema: Single message per row (Playground conversations)
            // Each message is a separate row - fetch ALL messages for this bot-user pair
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
              source: 'playground',
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
        const userId = parts.slice(-5).join('-'); // Last 5 parts = userId UUID
        const botId = parts.slice(0, -5).join('-'); // First parts = botId UUID

        // Get conversation details with messages (old schema - individual records)
        const conversations = await conversationRepository.find({
          where: {
            botId: botId,
            userId: userId
          },
          order: { createdAt: 'ASC' }
        });

        if (conversations.length === 0) {
          return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Group messages by session (old schema - each record is a message)
        conversation = {
          id: conversationId,
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

    return NextResponse.json({ success: true, conversation });

  } catch (error) {
    console.error('Error fetching conversation details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation details' },
      { status: 500 }
    );
  }
}

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

    // Get current user
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser || currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const conversationId = (await params).id;

    // Check if this is a session-based conversation (WordPress/external) or old schema
    const isSessionBased = conversationId.startsWith('session-');

    if (isSessionBased) {
      // Session-based conversation - lookup by sessionId
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

    // Check if this is a UUID (actual conversation ID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(conversationId)) {
      // Try to delete by actual ID first
      const conv = await conversationRepository.findOne({
        where: { id: conversationId }
      });

      if (conv) {
        await conversationRepository.remove(conv);
        return NextResponse.json({ success: true, message: 'Conversation deleted successfully' });
      }
    }

    // Fall back to old schema parsing (botId-userId format)
    const parts = conversationId.split('-');
    const userId = parts.slice(-5).join('-'); // Last 5 parts = userId UUID
    const botId = parts.slice(0, -5).join('-'); // First parts = botId UUID

    // Delete all messages in this conversation session
    const conversations = await conversationRepository.find({
      where: {
        botId: botId,
        userId: userId
      }
    });

    if (conversations.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Delete all messages
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
