import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { Conversation } from '@/entities/Conversation';

// CORS headers for WordPress widget
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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
              name: conversation.assignedAgent.firstName && conversation.assignedAgent.lastName
                ? `${conversation.assignedAgent.firstName} ${conversation.assignedAgent.lastName}`
                : conversation.assignedAgent.email?.split('@')[0] || 'Agent',
              email: conversation.assignedAgent.email
            }
          : null,
        metadata: conversation.metadata,
        createdAt: conversation.createdAt,
        lastMessageAt: conversation.lastMessageAt
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversation' },
      { status: 500, headers: corsHeaders }
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

    // Update fields
    if (mode) {
      conversation.mode = mode;

      // Add system message when mode changes
      if (message) {
        const messages = conversation.messages || [];
        messages.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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

      // Add system message when conversation is completed
      if (status === 'completed' && message) {
        const messages = conversation.messages || [];
        messages.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          sender: 'bot',
          text: message,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        });
        conversation.messages = messages;
        conversation.lastMessageAt = new Date();
        conversation.completedAt = new Date();
      }
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
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update conversation' },
      { status: 500, headers: corsHeaders }
    );
  }
}
