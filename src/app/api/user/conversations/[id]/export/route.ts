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

    // Helper to format timestamp
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

    let exportData: any = null;

    // Check if this is a session-based conversation
    const isSessionBased = conversationId.startsWith('session-');

    if (isSessionBased) {
      const sessionId = conversationId.replace('session-', '');
      const conv = await conversationRepository.findOne({
        where: { sessionId },
        relations: ['bot']
      });

      if (!conv || !assignedBotIds.includes(conv.botId)) {
        return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
      }

      exportData = {
        id: conversationId,
        botName: conv.bot?.name || 'Unknown Bot',
        guestName: conv.guestName,
        status: conv.status,
        mode: conv.mode,
        source: 'wordpress',
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.email,
        messages: (conv.messages || []).map((msg: any, index: number) => ({
          id: msg.id || `msg-${index}`,
          sender: msg.sender === 'visitor' ? 'user' : msg.sender,
          text: msg.text || msg.message,
          timestamp: formatTimestamp(msg.timestamp, conv.createdAt)
        }))
      };
    } else {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (uuidRegex.test(conversationId)) {
        const conv = await conversationRepository.findOne({
          where: { id: conversationId },
          relations: ['bot']
        });

        if (conv && assignedBotIds.includes(conv.botId)) {
          if (conv.messages && Array.isArray(conv.messages) && conv.messages.length > 0) {
            exportData = {
              id: conversationId,
              botName: conv.bot?.name || 'Unknown Bot',
              guestName: conv.guestName,
              status: conv.status,
              mode: conv.mode,
              source: conv.guestId ? 'wordpress' : 'playground',
              exportedAt: new Date().toISOString(),
              exportedBy: currentUser.email,
              messages: conv.messages.map((msg: any, index: number) => ({
                id: msg.id || `msg-${index}`,
                sender: msg.sender === 'visitor' ? 'user' : msg.sender,
                text: msg.text || msg.message,
                timestamp: formatTimestamp(msg.timestamp, conv.createdAt)
              }))
            };
          } else {
            const allMessages = await conversationRepository.find({
              where: { botId: conv.botId, userId: conv.userId },
              order: { createdAt: 'ASC' }
            });

            exportData = {
              id: conversationId,
              botName: conv.bot?.name || 'Unknown Bot',
              source: 'playground',
              exportedAt: new Date().toISOString(),
              exportedBy: currentUser.email,
              messages: allMessages.map(msg => ({
                id: msg.id,
                sender: msg.sender || 'user',
                text: msg.message,
                timestamp: formatTimestamp(msg.createdAt, new Date()),
                isTestMessage: msg.isTestMessage
              }))
            };
          }
        }
      }

      // Fall back to old schema
      if (!exportData) {
        const parts = conversationId.split('-');
        const odUserId = parts.slice(-5).join('-');
        const botId = parts.slice(0, -5).join('-');

        if (!assignedBotIds.includes(botId)) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const conversations = await conversationRepository.find({
          where: { botId, userId: odUserId },
          relations: ['bot'],
          order: { createdAt: 'ASC' }
        });

        if (conversations.length === 0) {
          return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        exportData = {
          id: conversationId,
          botName: conversations[0]?.bot?.name || 'Unknown Bot',
          source: 'playground',
          exportedAt: new Date().toISOString(),
          exportedBy: currentUser.email,
          messages: conversations.map(conv => ({
            id: conv.id,
            sender: conv.sender || 'user',
            text: conv.message,
            timestamp: formatTimestamp(conv.createdAt, new Date()),
            isTestMessage: conv.isTestMessage
          }))
        };
      }
    }

    if (!exportData) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json(exportData);

  } catch (error) {
    console.error('Error exporting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to export conversation' },
      { status: 500 }
    );
  }
}
