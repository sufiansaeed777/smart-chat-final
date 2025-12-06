import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { Conversation } from '@/entities/Conversation';
import { Bot } from '@/entities/Bot';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/conversations/create-handoff
 * Create a new conversation for human handoff
 *
 * This endpoint creates a properly formatted conversation record for the human handoff interface.
 * It's called when a visitor requests human assistance from the ChatBot widget.
 */
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { botId, guestName, guestEmail, initialMessage, metadata } = body;

    // Validate required fields
    if (!botId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: botId'
        },
        { status: 400 }
      );
    }

    // Verify bot exists
    const botRepository = AppDataSource.getRepository(Bot);
    const bot = await botRepository.findOne({
      where: { id: botId }
    });

    if (!bot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bot not found'
        },
        { status: 404 }
      );
    }

    // Generate unique session ID and guest ID
    const sessionId = uuidv4();
    const guestId = `GUEST-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create conversation repository
    const conversationRepository = AppDataSource.getRepository(Conversation);

    // Create new conversation for human handoff
    const conversation = new Conversation();

    // Session information
    conversation.sessionId = sessionId;
    conversation.guestName = guestName || `Guest User`;
    conversation.guestId = guestId;

    // Bot assignment
    conversation.botId = botId;
    conversation.userId = bot.createdBy; // Assign to bot owner

    // Handoff configuration
    conversation.mode = 'AI'; // Starts in AI mode, can be switched to Human
    conversation.status = 'waiting'; // Waiting for agent to respond

    // Initialize messages array with initial message if provided
    conversation.messages = initialMessage ? [{
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sender: 'visitor' as const,
      text: initialMessage,
      timestamp: new Date().toISOString()
    }] : [];

    // Timestamps
    conversation.startedAt = new Date();
    conversation.lastMessageAt = initialMessage ? new Date() : undefined;

    // Additional metadata
    conversation.metadata = {
      ...metadata,
      guestEmail: guestEmail || undefined,
      source: 'chat_widget',
      createdVia: 'human_handoff_request'
    };

    // Not a test message
    conversation.isTestMessage = false;

    // Save to database
    await conversationRepository.save(conversation);

    console.log(`✅ Created human handoff conversation: ${conversation.id}`);
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Guest: ${guestName || 'Guest User'} (${guestId})`);
    console.log(`   Bot: ${bot.name} (${botId})`);

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        sessionId: conversation.sessionId,
        guestName: conversation.guestName,
        guestId: conversation.guestId,
        mode: conversation.mode,
        status: conversation.status,
        messages: conversation.messages
      }
    });

  } catch (error) {
    console.error('Error creating handoff conversation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
