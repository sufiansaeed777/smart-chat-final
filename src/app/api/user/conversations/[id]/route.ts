import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Conversation } from '@/entities/Conversation';
import { BotAssignment } from '@/entities/BotAssignment';

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
    const assignmentRepository = AppDataSource.getRepository(BotAssignment);

    // Get current user
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's assigned bot IDs
    const assignments = await assignmentRepository.find({
      where: { userId: currentUser.id, status: 'active' }
    });
    const assignedBotIds = assignments.map(a => a.botId);

    if (assignedBotIds.length === 0) {
      return NextResponse.json({ error: 'No bots assigned to user' }, { status: 403 });
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

    let conversation: any;

    // Check if this is a session-based conversation
    const isSessionBased = conversationId.startsWith('session-');

    if (isSessionBased) {
      const sessionId = conversationId.replace('session-', '');

      const conv = await conversationRepository.findOne({
        where: { sessionId },
        relations: ['bot']
      });

      if (!conv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Verify user has access to this bot
      if (!assignedBotIds.includes(conv.botId)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const messages = conv.messages || [];

      conversation = {
        id: conversationId,
        sessionId: conv.sessionId,
        botId: conv.botId,
        botName: conv.bot?.name || 'Unknown Bot',
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
      // Check if this is a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (uuidRegex.test(conversationId)) {
        const conv = await conversationRepository.findOne({
          where: { id: conversationId },
          relations: ['bot']
        });

        if (conv) {
          // Verify user has access to this bot
          if (!assignedBotIds.includes(conv.botId)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
          }

          if (conv.messages && Array.isArray(conv.messages) && conv.messages.length > 0) {
            // New schema: Session-based conversation with messages array
            conversation = {
              id: conversationId,
              sessionId: conv.sessionId,
              botId: conv.botId,
              botName: conv.bot?.name || 'Unknown Bot',
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
        const odUserId = parts.slice(-5).join('-');
        const botId = parts.slice(0, -5).join('-');

        // Verify user has access to this bot
        if (!assignedBotIds.includes(botId)) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const conversations = await conversationRepository.find({
          where: {
            botId: botId,
            userId: odUserId
          },
          relations: ['bot'],
          order: { createdAt: 'ASC' }
        });

        if (conversations.length === 0) {
          return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        conversation = {
          id: conversationId,
          botId: botId,
          botName: conversations[0]?.bot?.name || 'Unknown Bot',
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);
    const conversationRepository = AppDataSource.getRepository(Conversation);
    const assignmentRepository = AppDataSource.getRepository(BotAssignment);

    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's assigned bot IDs
    const assignments = await assignmentRepository.find({
      where: { userId: currentUser.id, status: 'active' }
    });
    const assignedBotIds = assignments.map(a => a.botId);

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

      if (!assignedBotIds.includes(conv.botId)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
        if (!assignedBotIds.includes(conv.botId)) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        await conversationRepository.remove(conv);
        return NextResponse.json({ success: true, message: 'Conversation deleted successfully' });
      }
    }

    // Fall back to old schema parsing
    const parts = conversationId.split('-');
    const odUserId = parts.slice(-5).join('-');
    const botId = parts.slice(0, -5).join('-');

    if (!assignedBotIds.includes(botId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const conversations = await conversationRepository.find({
      where: {
        botId: botId,
        userId: odUserId
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
