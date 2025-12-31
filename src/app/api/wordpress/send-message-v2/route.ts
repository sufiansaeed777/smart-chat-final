import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { Bot } from '@/entities/Bot';
import { Conversation } from '@/entities/Conversation';
import { User } from '@/entities/User';
import pool from '@/utils/db';
import { getUserPlanLimits, checkLimit } from '@/middleware/planLimits';

// Set SSL for Supabase connection - ONLY in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Helper function to get country from IP address
async function getCountryFromIP(ip: string): Promise<string> {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return 'Local';
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`, {
      signal: AbortSignal.timeout(3000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success' && data.country) {
        return data.country;
      }
    }
  } catch (error) {
    console.log(`[GeoIP] Could not determine country for IP ${ip}:`, error);
  }

  return 'Unknown';
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, message, sessionId, metadata } = body;

    if (!token || !message) {
      return NextResponse.json(
        { error: 'Token and message are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Look up token in database (same as validate-token endpoint)
    let tokenData;
    try {
      const tokenCheck = await pool.query(
        `SELECT wt.*, b.*, u.email, u."isActive" as user_active,
                wt.expires_at,
                CASE WHEN wt.expires_at IS NOT NULL AND wt.expires_at < NOW() THEN true ELSE false END as is_expired
         FROM wordpress_tokens wt
         JOIN bots b ON wt.bot_id = b.id
         JOIN users u ON wt.user_id = u.id
         WHERE wt.token = $1 AND wt.is_active = true`,
        [token]
      );

      if (tokenCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401, headers: corsHeaders }
        );
      }

      tokenData = tokenCheck.rows[0];

      // Check if token is expired
      if (tokenData.is_expired) {
        return NextResponse.json(
          { error: 'Token has expired' },
          { status: 401, headers: corsHeaders }
        );
      }
    } catch (error) {
      console.error('Token lookup failed:', error);
      return NextResponse.json(
        { error: 'Token validation failed' },
        { status: 500, headers: corsHeaders }
      );
    }

    const userId = tokenData.user_id;
    const botId = tokenData.bot_id;

    // Initialize database
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (error) {
        console.error('Database initialization failed:', error);
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Get bot configuration from database using TypeORM
    const botRepository = AppDataSource.getRepository(Bot);
    const bot = await botRepository.findOne({
      where: {
        id: botId,
        status: 'active'
      }
    });

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found or inactive' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get bot owner for message counting
    const userRepository = AppDataSource.getRepository(User);
    const botOwner = await userRepository.findOne({
      where: { id: userId }
    });

    // Check message quota for bot owner
    if (botOwner) {
      const planLimits = getUserPlanLimits(botOwner.subscriptionPlan || 'free');
      const conversationRepository = AppDataSource.getRepository(Conversation);

      // Get bot owner's bot IDs
      const ownerBots = await botRepository.find({
        where: { createdBy: botOwner.id },
        select: ['id']
      });
      const ownerBotIds = ownerBots.map(b => b.id);

      if (ownerBotIds.length > 0) {
        // Count messages this month
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
            error: 'Message limit reached',
            message: limitCheck.message,
            upgradeRequired: true
          }, { status: 403, headers: corsHeaders });
        }
      }
    }

    // Prepare AI response
    let aiResponse = 'I apologize, but I am currently unable to process your request.';

    // Demo mode when no API key or invalid key
    if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('YOUR_NEW_API_KEY')) {
      console.log('Running in DEMO mode - no valid OpenAI key');

      const lowerMessage = message.toLowerCase();
      let demoResponse = 'This is a demo response. In production, I would use AI to provide intelligent answers.';

      if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        demoResponse = 'Hello! I\'m your virtual assistant. In demo mode, I have limited responses, but with a valid OpenAI API key, I can have natural conversations!';
      } else if (lowerMessage.includes('help')) {
        demoResponse = 'I can help you with various tasks! In production mode with OpenAI, I can answer questions, provide information, and assist with your specific needs.';
      } else if (lowerMessage.includes('how are you')) {
        demoResponse = 'I\'m functioning well in demo mode! With a real API key, I would provide more engaging and contextual responses.';
      } else if (lowerMessage.includes('what can you do')) {
        demoResponse = 'In production, I can: answer questions, provide customer support, help with products, give information, and have natural conversations. Currently running in demo mode.';
      } else if (lowerMessage.includes('test')) {
        demoResponse = 'Test successful! The chatbot system is working. Just add a valid OpenAI API key for full AI capabilities.';
      }

      aiResponse = `[DEMO MODE] ${demoResponse}`;
    } else {
      try {
        // Call OpenAI API
        const systemPrompt = `You are ${bot.name}, a helpful AI assistant.
Your personality is ${bot.tone || 'professional'}.
${bot.customInstructions || ''}
${bot.trainingContext || ''}
Always be helpful, accurate, and concise.`;

        const openAIResponse = await fetch(OPENAI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: bot.aiModel || 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            temperature: Number(bot.temperature) || 0.7,
            max_tokens: Number(bot.maxTokens) || 500
          })
        });

        if (openAIResponse.ok) {
          const openAIData = await openAIResponse.json();
          if (openAIData.choices && openAIData.choices[0]) {
            aiResponse = openAIData.choices[0].message.content;
          }
        } else {
          const errorData = await openAIResponse.json();
          console.error('OpenAI API error:', errorData);

          if (openAIResponse.status === 401) {
            aiResponse = 'Authentication error with AI service. Please check the API configuration.';
          } else if (openAIResponse.status === 429) {
            aiResponse = 'AI service rate limit reached. Please try again later.';
          } else {
            aiResponse = 'I encountered an error processing your request. Please try again.';
          }
        }
      } catch (openAIError) {
        console.error('Error calling OpenAI:', openAIError);
        aiResponse = bot.fallbackMessage || 'I apologize, but I encountered an error connecting to the AI service.';
      }
    }

    // Store conversation using TypeORM with correct schema
    const conversationRepository = AppDataSource.getRepository(Conversation);
    const actualSessionId = sessionId || `wp_v2_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Find or create conversation
    let conversation = await conversationRepository.findOne({
      where: {
        botId: botId,
        sessionId: actualSessionId
      }
    });

    // Get visitor info
    const visitorIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      request.headers.get('x-real-ip') ||
                      metadata?.user_ip ||
                      metadata?.userIp ||
                      'Unknown';
    const country = await getCountryFromIP(visitorIp);
    const pageUrl = metadata?.page_url || metadata?.pageUrl || request.headers.get('referer') || '';
    const visitorName = metadata?.visitorName || `Guest #${Math.floor(1000 + Math.random() * 9000)}`;
    const visitorEmail = metadata?.visitorEmail || '';

    if (!conversation) {
      // Create new conversation
      conversation = conversationRepository.create({
        botId: botId,
        userId: userId,
        sessionId: actualSessionId,
        guestName: visitorName,
        guestId: `LC-${actualSessionId.slice(-4)}`,
        visitorEmail: visitorEmail,
        pageUrl: pageUrl,
        country: country,
        ipAddress: visitorIp,
        mode: 'AI',
        status: 'active',
        messages: [],
        startedAt: new Date(),
        lastMessageAt: new Date(),
        metadata: {
          ...metadata,
          source: 'wordpress',
          endpoint: 'v2',
          userIp: visitorIp,
          userAgent: metadata?.user_agent || request.headers.get('user-agent') || '',
          pageUrl: pageUrl,
          country: country
        }
      });
    }

    // Add messages to conversation
    const messages = conversation.messages || [];
    messages.push(
      {
        id: `${Date.now()}-visitor`,
        sender: 'visitor',
        text: message,
        timestamp: new Date().toISOString()
      },
      {
        id: `${Date.now()}-bot`,
        sender: 'bot',
        text: aiResponse,
        timestamp: new Date().toISOString()
      }
    );

    conversation.messages = messages;
    conversation.lastMessageAt = new Date();
    await conversationRepository.save(conversation);

    // Increment message usage counter
    if (botOwner) {
      botOwner.messagesUsedThisMonth = (botOwner.messagesUsedThisMonth || 0) + 1;
      await userRepository.save(botOwner);
    }

    // Return response
    return NextResponse.json({
      success: true,
      response: aiResponse,
      sessionId: actualSessionId,
      conversationId: conversation.id
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Message processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process message: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500, headers: corsHeaders }
    );
  }
}
