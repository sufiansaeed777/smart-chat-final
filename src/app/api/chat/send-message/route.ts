import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';
import { Conversation } from '@/entities/Conversation';
import OpenAI from 'openai';

// Helper function to save conversation
async function saveConversation(botId: string, userId: string, message: string, sender: 'user' | 'bot', isTestMessage: boolean = false, metadata?: Record<string, unknown>) {
  try {
    const conversationRepository = AppDataSource.getRepository("conversations");

    const conversation = new Conversation();
    conversation.botId = botId;
    conversation.userId = userId;
    conversation.message = message;
    conversation.sender = sender;
    conversation.isTestMessage = isTestMessage;
    conversation.metadata = metadata ? JSON.stringify(metadata) : undefined;

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

      // Get user from database
      const userRepository = AppDataSource.getRepository("users");
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

    // Save user message to conversation
    await saveConversation(botId, user.id, message, 'user', isTestMessage);

    // Use OpenAI for chat responses
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
      await saveConversation(botId, user.id, response, 'bot', isTestMessage);

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
        temperature: bot.temperature || 0.7,
        max_tokens: bot.maxTokens || 500,
      });

      const botResponse = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';

      // Save bot response to conversation
      await saveConversation(botId, user.id, botResponse, 'bot', isTestMessage);

      return NextResponse.json({
        response: botResponse,
        success: true
      });
    } catch (openaiError: any) {
      console.error('Error calling OpenAI API:', openaiError);

      // Check if it's an API key error
      if (openaiError.message?.includes('API key') || openaiError.message?.includes('Incorrect')) {
        const errorResponse = 'Configuration error: Invalid OpenAI API key. Please contact your administrator.';
        await saveConversation(botId, user.id, errorResponse, 'bot', isTestMessage);
        return NextResponse.json({
          response: errorResponse,
          success: false
        });
      }

      // Check if it's a rate limit error
      if (openaiError.message?.includes('rate limit')) {
        const errorResponse = 'The service is currently experiencing high demand. Please try again in a moment.';
        await saveConversation(botId, user.id, errorResponse, 'bot', isTestMessage);
        return NextResponse.json({
          response: errorResponse,
          success: false
        });
      }

      // Fall back to a generic error message
      const fallbackResponse = 'I apologize, but I encountered an error processing your request. Please try again.';
      await saveConversation(botId, user.id, fallbackResponse, 'bot', isTestMessage);
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