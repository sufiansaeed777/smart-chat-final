import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { Conversation } from '@/entities/Conversation';

// CORS headers for WordPress widget cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST /api/conversations/[id]/close
 * Close a conversation session (mark as completed)
 *
 * Called by WordPress plugin when user clicks "End Chat"
 * This ensures the conversation is properly closed on the server
 * so the manager dashboard shows accurate status.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Parse request body (optional - plugin sends status and reason)
    let body: { status?: string; reason?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional, continue with defaults
    }

    const reason = body.reason || 'User ended chat';

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (error) {
        console.error('Database initialization failed:', error);
        return NextResponse.json(
          { success: false, error: 'Database connection failed' },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    const conversationRepository = AppDataSource.getRepository(Conversation);

    // Find the conversation
    const conversation = await conversationRepository.findOne({
      where: { id }
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if already completed (idempotent - don't error, just return success)
    if (conversation.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Conversation already closed',
        conversation: {
          id: conversation.id,
          status: conversation.status,
          completedAt: conversation.completedAt
        }
      }, { headers: corsHeaders });
    }

    // Update conversation status to completed
    conversation.status = 'completed';
    conversation.completedAt = new Date();

    // Reset mode back to AI (in case it was in Human mode)
    conversation.mode = 'AI';

    // Clear agent assignment if any
    if (conversation.assignedAgentId) {
      conversation.assignedAgentId = undefined;
      conversation.assignedAgentName = undefined;
    }

    // Add system message about conversation being closed
    const messages = conversation.messages || [];
    messages.push({
      id: `${Date.now()}-system-close`,
      sender: 'bot',
      text: `Chat session ended. ${reason}`,
      timestamp: new Date().toISOString()
    });
    conversation.messages = messages;
    conversation.lastMessageAt = new Date();

    await conversationRepository.save(conversation);

    console.log(`[CLOSE] Conversation ${id} closed. Reason: ${reason}`);

    return NextResponse.json({
      success: true,
      message: 'Conversation closed successfully',
      conversation: {
        id: conversation.id,
        status: conversation.status,
        completedAt: conversation.completedAt,
        sessionId: conversation.sessionId
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error closing conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to close conversation' },
      { status: 500, headers: corsHeaders }
    );
  }
}
