import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';
import { Conversation } from '@/entities/Conversation';
import { N8nService } from '@/services/n8nService';
import OpenAI from 'openai';
import { getUserPlanLimits, checkLimit } from '@/middleware/planLimits';

// Session storage for website visitors (in-memory for now, could be Redis in production)
const visitorSessions: Map<string, { conversationId: string; messages: any[] }> = new Map();

// Helper function to get or create system bot for website chatbot
async function getOrCreateSystemBot(): Promise<{ id: string; createdBy: string } | null> {
  try {
    const botRepository = AppDataSource.getRepository(Bot);
    const userRepository = AppDataSource.getRepository(User);

    // Try to find existing system bot
    let systemBot = await botRepository.findOne({
      where: { name: 'Website Assistant' }
    });

    if (systemBot) {
      return { id: systemBot.id, createdBy: systemBot.createdBy };
    }

    // Find an admin user to be the owner
    const adminUser = await userRepository.findOne({
      where: { role: 'admin' }
    });

    if (!adminUser) {
      console.error('No admin user found to create system bot');
      return null;
    }

    // Create system bot
    systemBot = botRepository.create({
      name: 'Website Assistant',
      description: 'Default chatbot for website visitors',
      status: 'active',
      createdBy: adminUser.id,
      tone: 'professional',
      aiModel: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 500,
      customInstructions: 'You are a helpful AI assistant for website visitors. Be friendly, professional, and helpful.'
    });

    await botRepository.save(systemBot);
    console.log('✅ Created system bot for website chatbot:', systemBot.id);

    return { id: systemBot.id, createdBy: adminUser.id };
  } catch (error) {
    console.error('Error getting/creating system bot:', error);
    return null;
  }
}

// Helper function to save or update conversation
async function saveConversation(
  botId: string,
  visitorId: string,
  message: string,
  sender: 'visitor' | 'bot',
  isTestMessage: boolean = false,
  metadata?: Record<string, unknown>,
  isGuestUser: boolean = false,
  systemBotData?: { id: string; createdBy: string } | null
) {
  try {
    // Use Entity class for proper column name mapping
    const conversationRepository = AppDataSource.getRepository(Conversation);

    // For guest users with general-assistant, use the system bot
    const actualBotId = (isGuestUser && botId === 'general-assistant' && systemBotData)
      ? systemBotData.id
      : botId;
    const actualUserId = (isGuestUser && systemBotData)
      ? systemBotData.createdBy
      : visitorId;

    // For website visitors, use session-based conversation storage
    const sessionKey = `website-${actualBotId}-${Date.now().toString(36)}`;
    let session = visitorSessions.get(`${actualBotId}-${visitorId}`);

    // Check if we have an existing active conversation (within last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    let conversation: Conversation | null = null;

    if (session?.conversationId) {
      // Try to find existing conversation
      conversation = await conversationRepository.findOne({
        where: { id: session.conversationId }
      });
    }

    // If no existing conversation or it's too old, create a new one
    if (!conversation || (conversation.lastMessageAt && new Date(conversation.lastMessageAt) < thirtyMinutesAgo)) {
      const guestNumber = Math.floor(1000 + Math.random() * 9000);

      conversation = new Conversation();
      conversation.botId = actualBotId;
      conversation.userId = actualUserId;
      conversation.guestId = isGuestUser ? `WEB-${guestNumber}` : undefined;
      conversation.guestName = isGuestUser ? `Website Visitor #${guestNumber}` : undefined;
      conversation.sessionId = sessionKey;
      conversation.status = 'active';
      conversation.mode = 'AI';
      conversation.messages = [];
      conversation.isTestMessage = isTestMessage;
      conversation.startedAt = new Date();
      conversation.metadata = {
        ...metadata,
        source: 'website_chatbot',
        originalBotId: botId
      };

      await conversationRepository.save(conversation);

      // Update session
      session = { conversationId: conversation.id, messages: [] };
      visitorSessions.set(`${actualBotId}-${visitorId}`, session);
    }

    // Add message to conversation
    const newMessage = {
      id: Date.now().toString(),
      sender: sender,
      text: message,
      timestamp: new Date().toISOString()
    };

    // Ensure messages array exists
    if (!Array.isArray(conversation.messages)) {
      conversation.messages = [];
    }

    conversation.messages.push(newMessage);
    conversation.lastMessageAt = new Date();

    if (metadata) {
      conversation.metadata = { ...conversation.metadata, ...metadata };
    }

    await conversationRepository.save(conversation);

    return conversation;
  } catch (error) {
    console.error('Error saving conversation:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botId, message, userId, isTestMessage = false } = body;

    // Handle guest users for general assistant
    let user;
    if (userId === 'guest-user') {
      // Create a mock user for guest users
      user = {
        id: 'guest-user',
        email: 'guest@example.com',
        role: 'user'
      } as { id: string; email: string; role: string };
    } else {
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Initialize database connection
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }

      // Get user from database - Use Entity class for proper column name mapping
      const userRepository = AppDataSource.getRepository(User);
      user = await userRepository.findOne({
        where: { email: session.user.email }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    if (!botId || !message) {
      return NextResponse.json({
        error: 'Bot ID and message are required'
      }, { status: 400 });
    }

    // Check if user is assigned to this bot (unless it's a test message from manager or guest user)
    if (!isTestMessage && userId !== 'guest-user') {
      const { BotAssignment } = await import('@/entities/BotAssignment');
      const assignmentRepository = AppDataSource.getRepository("bot_assignments");
      const assignment = await assignmentRepository.findOne({
        where: {
          userId: user.id,
          botId: botId,
          status: 'active'
        }
      });

      if (!assignment) {
        return NextResponse.json({ error: 'Access denied. You are not assigned to this bot.' }, { status: 403 });
      }
    }

    // Get the bot from database
    const botRepository = AppDataSource.getRepository("bots");
    let bot;

    // Handle special case for general assistant (main chatbot)
    if (botId === 'general-assistant') {
      // Create a mock bot for the general assistant
      bot = {
        id: 'general-assistant',
        name: 'AI Assistant',
        description: 'General purpose AI assistant',
        domain: 'general',
        status: 'active',
        createdBy: 'system',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 500,
        systemPrompt: 'You are a helpful AI assistant. Be friendly, professional, and helpful.'
      } as any;
    } else if (isTestMessage) {
      // For test messages, check if the user is a manager and owns the bot
      bot = await botRepository.findOne({
        where: {
          id: botId,
          createdBy: user.id
        }
      });
    } else {
      // For regular messages, just check if bot exists
      bot = await botRepository.findOne({
        where: {
          id: botId
        }
      });
    }

    if (!bot) {
      return NextResponse.json({
        error: 'Bot not found or you do not have permission to access it'
      }, { status: 404 });
    }

    // Check if bot is active
    if (bot.status !== 'active') {
      return NextResponse.json({
        error: 'Bot is not active'
      }, { status: 400 });
    }

    // Check message quota for bot owner (skip for guest users on general-assistant)
    if (botId !== 'general-assistant' && bot.createdBy) {
      const userRepository = AppDataSource.getRepository(User);
      const conversationRepository = AppDataSource.getRepository(Conversation);

      const botOwner = await userRepository.findOne({
        where: { id: bot.createdBy }
      });

      if (botOwner) {
        const planLimits = getUserPlanLimits(botOwner.subscriptionPlan || 'free');

        // Get bot owner's bot IDs
        const botRepository = AppDataSource.getRepository(Bot);
        const ownerBots = await botRepository.find({
          where: { createdBy: botOwner.id },
          select: ['id']
        });
        const ownerBotIds = ownerBots.map(b => b.id);

        if (ownerBotIds.length > 0) {
          // Count messages this month across all bot owner's bots
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const messageCountResult = await conversationRepository
            .createQueryBuilder('conv')
            .select('COALESCE(SUM(jsonb_array_length(conv.messages)), 0)', 'totalMessages')
            .where('conv.botId IN (:...botIds)', { botIds: ownerBotIds })
            .andWhere('conv.createdAt >= :startOfMonth', { startOfMonth })
            .getRawOne();

          const currentMessageCount = Number(messageCountResult?.totalMessages || 0);
          const limitCheck = checkLimit(currentMessageCount, planLimits.monthlyMessages, 'messages');

          if (!limitCheck.allowed) {
            return NextResponse.json({
              error: 'Plan limit reached',
              message: limitCheck.message,
              currentCount: currentMessageCount,
              limit: planLimits.monthlyMessages,
              plan: botOwner.subscriptionPlan || 'free',
              upgradeRequired: true,
              upgradeUrl: '/manager-dashboard/billing'
            }, { status: 403 });
          }
        }
      }
    }

    // Save user message to conversation
    const isGuestUser = userId === 'guest-user';

    // For guest users, get or create the system bot
    let systemBotData: { id: string; createdBy: string } | null = null;
    if (isGuestUser && botId === 'general-assistant') {
      systemBotData = await getOrCreateSystemBot();
    }

    await saveConversation(botId, user.id, message, 'visitor', isTestMessage, undefined, isGuestUser, systemBotData);

    // Priority 1: Use n8n trained bot (RAG with vector embeddings) if bot is trained
    if (bot.trainingStatus === 'trained' && process.env.N8N_WEBHOOK_URL) {
      try {
        console.log(`🤖 Bot is trained, using n8n RAG for response`);
        const n8nResult = await N8nService.sendChatMessage({
          botId: bot.id,
          chatId: `dashboard_${Date.now()}`,
          message: message,
          userId: user.id
        });

        if (n8nResult.success && n8nResult.response) {
          console.log(`✅ n8n RAG response received`);
          await saveConversation(botId, user.id, n8nResult.response, 'bot', isTestMessage, {
            source: 'n8n_rag'
          }, isGuestUser, systemBotData);

          return NextResponse.json({
            response: n8nResult.response,
            success: true,
            source: 'n8n_rag'
          });
        }
      } catch (error) {
        console.error('❌ n8n RAG error, falling back to OpenAI:', error);
        // Fall through to OpenAI fallback
      }
    }

    // Priority 2: Use OpenAI for chat responses (fallback or if bot not trained)
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      console.log('OpenAI API key not configured, returning intelligent mock response');

      // Generate intelligent responses based on the message content
      const lowerMessage = message.toLowerCase();
      let response = '';

      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        response = `Hello! I'm ${bot.name}. How can I help you today?`;
      } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
        response = `I'm here to help! What do you need assistance with?`;
      } else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
        response = `You're welcome! Anything else I can help with?`;
      } else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you')) {
        response = `Goodbye! Feel free to reach out anytime.`;
      } else if (lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('why')) {
        response = `That's a great question! Could you provide more details?`;
      } else if (lowerMessage.includes('aoa') || lowerMessage.includes('salam') || lowerMessage.includes('assalam')) {
        response = `Wa Alaikum Assalam! I'm ${bot.name}. How can I help you?`;
      } else {
        response = `I'm ${bot.name}. How can I assist you with ${bot.domain}?`;
      }

      // Save bot response to conversation
      await saveConversation(botId, user.id, response, 'bot', isTestMessage, undefined, isGuestUser, systemBotData);

      return NextResponse.json({
        response: response,
        success: true
      });
    }

    // Use OpenAI API for chat responses
    try {
      console.log('Using OpenAI API for AI response');

      const openai = new OpenAI({
        apiKey: openaiApiKey,
      });

      // Build conversation context
      const systemPrompt = bot.systemPrompt || `You are ${bot.name}, a helpful AI assistant specializing in ${bot.domain}. ${bot.description || ''}`;

      const completion = await openai.chat.completions.create({
        model: bot.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: Number(bot.temperature) || 0.7,
        max_tokens: Number(bot.maxTokens) || 500,
      });

      const botResponse = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';

      // Save bot response to conversation
      await saveConversation(botId, user.id, botResponse, 'bot', isTestMessage, undefined, isGuestUser, systemBotData);

      return NextResponse.json({
        response: botResponse,
        success: true
      });
    } catch (openaiError: any) {
      console.error('Error calling OpenAI API:', openaiError);

      // Check if it's an API key error
      if (openaiError.message?.includes('API key') || openaiError.message?.includes('Incorrect')) {
        const errorResponse = 'Configuration error: Invalid OpenAI API key. Please contact your administrator.';
        await saveConversation(botId, user.id, errorResponse, 'bot', isTestMessage, undefined, isGuestUser, systemBotData);
        return NextResponse.json({
          response: errorResponse,
          success: false
        });
      }

      // Check if it's a rate limit error
      if (openaiError.message?.includes('rate limit')) {
        const errorResponse = 'The service is currently experiencing high demand. Please try again in a moment.';
        await saveConversation(botId, user.id, errorResponse, 'bot', isTestMessage, undefined, isGuestUser, systemBotData);
        return NextResponse.json({
          response: errorResponse,
          success: false
        });
      }

      // Fall back to a generic error message
      const fallbackResponse = 'I apologize, but I encountered an error processing your request. Please try again.';
      await saveConversation(botId, user.id, fallbackResponse, 'bot', isTestMessage, undefined, isGuestUser, systemBotData);
      return NextResponse.json({
        response: fallbackResponse,
        success: true
      });
    }

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}