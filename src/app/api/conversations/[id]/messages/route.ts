import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { Conversation } from '@/entities/Conversation';

/**
 * POST /api/conversations/[id]/messages
 * Send a message to a conversation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { message, sender } = body;

    if (!message || !sender) {
      return NextResponse.json(
        { success: false, error: 'Message and sender are required' },
        { status: 400 }
      );
    }

    if (!['visitor', 'agent', 'bot'].includes(sender)) {
      return NextResponse.json(
        { success: false, error: 'Invalid sender type' },
        { status: 400 }
      );
    }

    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (error) {
        console.error('Database initialization failed:', error);
        return NextResponse.json(
          { success: false, error: 'Database connection failed' },
          { status: 500 }
        );
      }
    }

    const conversationRepository = AppDataSource.getRepository(Conversation);

    const conversation = await conversationRepository.findOne({
      where: { id }
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Add message to conversation
    const messages = conversation.messages || [];
    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sender: sender as 'visitor' | 'agent' | 'bot',
      text: message,
      timestamp: new Date().toISOString()
    };

    messages.push(newMessage);
    conversation.messages = messages;
    conversation.lastMessageAt = new Date();

    // Update status to active if message is sent (including completed conversations that restart)
    if (conversation.status === 'idle' || conversation.status === 'waiting' || conversation.status === 'completed') {
      conversation.status = 'active';
    }

    await conversationRepository.save(conversation);

    return NextResponse.json({
      success: true,
      message: newMessage,
      conversation: {
        id: conversation.id,
        messages: conversation.messages,
        lastMessageAt: conversation.lastMessageAt,
        status: conversation.status
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
