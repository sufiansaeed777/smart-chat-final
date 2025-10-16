import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { Conversation } from '@/entities/Conversation';

/**
 * GET /api/conversations/[id]
 * Fetch a single conversation by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const conversationRepository = AppDataSource.getRepository(Conversation);

    const conversation = await conversationRepository.findOne({
      where: { id },
      relations: ['bot', 'user', 'assignedAgent']
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        sessionId: conversation.sessionId,
        guestName: conversation.guestName,
        guestId: conversation.guestId,
        mode: conversation.mode,
        status: conversation.status,
        messages: conversation.messages || [],
        botName: conversation.bot?.name,
        assignedAgent: conversation.assignedAgent
          ? {
              id: conversation.assignedAgent.id,
              name: conversation.assignedAgent.name,
              email: conversation.assignedAgent.email
            }
          : null,
        metadata: conversation.metadata,
        createdAt: conversation.createdAt,
        lastMessageAt: conversation.lastMessageAt
      }
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/conversations/[id]
 * Update conversation (mode, status, assignment)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { mode, status, assignedAgentId, assignedAgentName, message } = body;

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
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

    // Update fields
    if (mode) {
      conversation.mode = mode;

      // Add system message when mode changes
      if (message) {
        const messages = conversation.messages || [];
        messages.push({
          id: Date.now().toString(),
          sender: mode === 'Human' ? 'agent' : 'bot',
          text: message,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        });
        conversation.messages = messages;
        conversation.lastMessageAt = new Date();
      }
    }

    if (status) {
      conversation.status = status;
    }

    if (assignedAgentId !== undefined) {
      conversation.assignedAgentId = assignedAgentId;
      conversation.assignedAgentName = assignedAgentName;
      conversation.assignedAt = assignedAgentId ? new Date() : undefined;
    }

    await conversationRepository.save(conversation);

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        mode: conversation.mode,
        status: conversation.status,
        assignedAgentId: conversation.assignedAgentId,
        messages: conversation.messages
      }
    });

  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}
