import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { Bot } from '@/entities/Bot';
import { Conversation } from '@/entities/Conversation';
import { User } from '@/entities/User';
import { N8nService } from '@/services/n8nService';
import { getUserPlanLimits, checkLimit } from '@/middleware/planLimits';

/**
 * WordPress Plugin Message Handler
 *
 * Processes messages from WordPress sites and returns AI responses
 *
 * TODO: Future Non-WordPress Support
 * - Add WebSocket support for real-time messaging
 * - Support streaming responses for better UX
 * - Add rate limiting per domain
 * - Implement message queuing for high traffic
 */

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

    // Parse token
    const [userId, botId, secretToken] = token.split(':');

    if (!userId || !botId) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get bot configuration
    const botRepository = AppDataSource.getRepository("bots");
    const bot = await botRepository.findOne({
      where: {
        id: botId,
        userId: userId,
        isActive: true
      }
    });

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found or inactive' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check user's message quota
    const userRepository = AppDataSource.getRepository("users");
    const botOwner = await userRepository.findOne({
      where: { id: userId },
    });

    if (!botOwner) {
      return NextResponse.json(
        { error: 'Bot owner not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check plan limits
    const planLimits = getUserPlanLimits(botOwner.subscriptionPlan || 'free');
    const limitCheck = checkLimit(
      botOwner.messagesUsedThisMonth || 0,
      planLimits.monthlyMessages,
      'messages'
    );

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Quota exceeded',
          message: limitCheck.message,
          upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/manager-dashboard/settings?tab=billing`,
        },
        { status: 429, headers: corsHeaders }
      );
    }

    // Check if subscription is active
    if (botOwner.subscriptionStatus && ['past_due', 'cancelled', 'suspended'].includes(botOwner.subscriptionStatus)) {
      return NextResponse.json(
        {
          error: 'Subscription inactive',
          message: 'Please update your payment method to continue using this bot.',
          billingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/manager-dashboard/settings?tab=billing`,
        },
        { status: 402, headers: corsHeaders }
      );
    }

    // Create or get conversation session
    const conversationRepository = AppDataSource.getRepository(Conversation);
    const actualSessionId = sessionId || `wp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let conversation = await conversationRepository.findOne({
      where: {
        botId: botId,
        sessionId: actualSessionId
      }
    });

    if (!conversation) {
      // Generate guest ID and name for new conversations
      const guestNumber = Math.floor(1000 + Math.random() * 9000);
      const guestIdSuffix = actualSessionId.slice(-4);

      conversation = conversationRepository.create({
        botId: botId,
        userId: userId,
        sessionId: actualSessionId,
        guestName: `Guest #${guestNumber}`,
        guestId: `LC-${guestIdSuffix}`,
        mode: 'AI', // Start in AI mode
        status: 'active',
        messages: [],
        startedAt: new Date(),
        lastMessageAt: new Date(),
        metadata: {
          ...metadata,
          source: 'wordpress',
          userIp: metadata?.userIp,
          userAgent: metadata?.userAgent,
          pageUrl: metadata?.pageUrl
        }
      });
      await conversationRepository.save(conversation);
    }

    // Check if bot is trained with n8n (preferred method)
    let aiResponse = 'I apologize, but I am currently unable to process your request.';

    // Priority 1: Use n8n trained bot (RAG with vector embeddings)
    if (bot.trainingStatus === 'trained' && process.env.N8N_WEBHOOK_URL) {
      try {
        const n8nResult = await N8nService.sendChatMessage({
          botId: bot.id,
          chatId: sessionId || `wp_${Date.now()}`,
          message: message,
          userId: userId
        });

        if (n8nResult.success && n8nResult.response) {
          aiResponse = n8nResult.response;

          // Save messages and return early
          const messages = conversation.messages || [];
          messages.push(
            {
              id: `${Date.now()}-visitor`,
              sender: 'visitor',
              text: message,
              timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            },
            {
              id: `${Date.now()}-bot`,
              sender: 'bot',
              text: aiResponse,
              timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            }
          );

          conversation.messages = messages;
          conversation.lastMessageAt = new Date();
          await conversationRepository.save(conversation);

          return NextResponse.json({
            success: true,
            response: aiResponse,
            sessionId: conversation.sessionId,
            source: 'n8n_rag'
          }, { headers: corsHeaders });
        }
      } catch (error) {
        console.error('n8n trained bot error:', error);
        // Fall through to OpenAI fallback
      }
    }

    // Priority 2: Use OpenAI directly (if bot not trained)
    const systemPrompt = `You are ${bot.name}, a helpful AI assistant.
    Your personality is ${bot.tone || 'professional'}.
    ${bot.customInstructions || ''}
    ${bot.trainingContext || ''}
    Always be helpful, accurate, and concise.`;

    if (OPENAI_API_KEY) {
      try {
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
              // TODO: Include conversation history for context
              { role: 'user', content: message }
            ],
            max_tokens: bot.maxTokens || 500,
            temperature: bot.temperature || 0.7,
          })
        });

        if (openAIResponse.ok) {
          const data = await openAIResponse.json();
          aiResponse = data.choices[0].message.content;
        } else {
          console.error('OpenAI API error:', await openAIResponse.text());
          // Fallback to n8n webhook if configured
          if (process.env.N8N_WEBHOOK_URL) {
            const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                botId,
                message,
                sessionId,
                metadata
              })
            });

            if (n8nResponse.ok) {
              const n8nData = await n8nResponse.json();
              aiResponse = n8nData.response || aiResponse;
            }
          }
        }
      } catch (error) {
        console.error('AI processing error:', error);
        aiResponse = bot.fallbackMessage ||
                    'I apologize for the inconvenience. Please try again later.';
      }
    } else {
      // Use n8n webhook if no OpenAI key
      if (process.env.N8N_WEBHOOK_URL) {
        try {
          const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              botId,
              message,
              sessionId,
              metadata
            })
          });

          if (n8nResponse.ok) {
            const n8nData = await n8nResponse.json();
            aiResponse = n8nData.response || aiResponse;
          }
        } catch (error) {
          console.error('n8n webhook error:', error);
        }
      }
    }

    // Save messages to conversation
    const messages = conversation.messages || [];
    messages.push(
      {
        id: `${Date.now()}-visitor`,
        sender: 'visitor',
        text: message,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: `${Date.now()}-bot`,
        sender: 'bot',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }
    );

    conversation.messages = messages;
    conversation.lastMessageAt = new Date();
    await conversationRepository.save(conversation);

    // Increment message usage counter
    botOwner.messagesUsedThisMonth = (botOwner.messagesUsedThisMonth || 0) + 1;
    await userRepository.save(botOwner);

    // Return response
    return NextResponse.json({
      success: true,
      response: aiResponse,
      sessionId: conversation.sessionId,
      source: bot.trainingStatus === 'trained' ? 'openai_fallback' : 'openai_direct',
      // TODO: Add for real-time features
      // typing: false,
      // suggestedActions: bot.suggestedActions || []
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Message processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * TODO: Non-WordPress Support Features
 *
 * 1. WebSocket endpoint for real-time chat
 *    - /api/widget/ws for WebSocket connections
 *    - Support typing indicators
 *    - Live agent handoff
 *
 * 2. Streaming responses
 *    - Use Server-Sent Events (SSE)
 *    - Stream OpenAI responses token by token
 *
 * 3. File upload support
 *    - /api/widget/upload endpoint
 *    - Process documents, images, PDFs
 *
 * 4. Voice messages
 *    - Accept audio input
 *    - Transcribe using Whisper API
 *    - Return audio responses
 */