import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { Bot } from '@/entities/Bot';
import { Conversation } from '@/entities/Conversation';
import { User } from '@/entities/User';
import { Subscription } from '@/entities/Subscription';
import { buildRAGContext } from '@/services/documentProcessing';
import { checkRateLimit, getClientIdentifier, addRateLimitHeaders, RateLimits } from '@/middleware/rateLimit';

/**
 * WordPress Plugin Message Handler
 *
 * Processes messages from WordPress sites and returns AI responses
 *
 * Features:
 * - Rate limiting per IP/session
 * - RAG-powered responses
 * - Quota enforcement
 * - Conversation history tracking
 */

// Set SSL for Supabase connection
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

    // Rate limiting - use session ID or IP as identifier
    const identifier = sessionId || getClientIdentifier(request);
    const rateLimitResponse = checkRateLimit(identifier, RateLimits.CHAT);
    if (rateLimitResponse) {
      return rateLimitResponse;
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
    const botRepository = AppDataSource.getRepository(Bot);
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

    // Domain binding validation
    if (bot.domain) {
      const origin = request.headers.get('origin') || request.headers.get('referer') || '';
      const requestDomain = origin.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];

      // Normalize domains for comparison (remove www)
      const botDomain = bot.domain.replace(/^www\./, '').toLowerCase();
      const normalizedRequestDomain = requestDomain.replace(/^www\./, '').toLowerCase();

      // Check if domains match (exact or subdomain)
      const isValidDomain = normalizedRequestDomain === botDomain ||
                           normalizedRequestDomain.endsWith(`.${botDomain}`) ||
                           botDomain === 'localhost' || // Allow localhost for development
                           normalizedRequestDomain.includes('localhost'); // Allow localhost with port

      if (!isValidDomain && origin !== '') {
        console.warn(`Domain mismatch: Expected ${bot.domain}, got ${requestDomain}`);
        return NextResponse.json(
          {
            error: 'Domain not authorized',
            message: `This bot is only authorized for domain: ${bot.domain}`
          },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    // Check user's message quota
    const subscriptionRepository = AppDataSource.getRepository(Subscription);
    const subscription = await subscriptionRepository.findOne({
      where: {
        managerId: userId,
        status: 'active'
      }
    });

    if (subscription) {
      if (!subscription.hasMessagesRemaining()) {
        return NextResponse.json({
          error: 'Message quota exceeded',
          quota: {
            used: subscription.messagesUsed,
            limit: subscription.messageLimit,
            remaining: 0
          }
        }, { status: 429, headers: corsHeaders });
      }
    } else {
      // No active subscription found - apply free plan limits (100 messages)
      // Count user's total messages this month
      const conversationRepo = AppDataSource.getRepository(Conversation);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const conversations = await conversationRepo.find({
        where: {
          userId: userId
        }
      });

      let totalMessages = 0;
      conversations.forEach((conv: any) => {
        const messages = conv.messages || [];
        const monthMessages = messages.filter((msg: any) => {
          return new Date(msg.timestamp) >= startOfMonth;
        });
        totalMessages += monthMessages.filter((msg: any) => msg.role === 'user').length;
      });

      const FREE_PLAN_LIMIT = 100;
      if (totalMessages >= FREE_PLAN_LIMIT) {
        return NextResponse.json({
          error: 'Free plan message quota exceeded. Please upgrade to continue.',
          quota: {
            used: totalMessages,
            limit: FREE_PLAN_LIMIT,
            remaining: 0
          }
        }, { status: 429, headers: corsHeaders });
      }
    }

    // Create or get conversation
    const conversationRepository = AppDataSource.getRepository(Conversation);
    let conversation = await conversationRepository.findOne({
      where: {
        botId: botId,
        sessionId: sessionId || `wp_${Date.now()}`
      }
    });

    if (!conversation) {
      conversation = conversationRepository.create({
        botId: botId,
        userId: userId,
        sessionId: sessionId || `wp_${Date.now()}`,
        startedAt: new Date(),
        metadata: metadata || {},
        messages: []
      });
      await conversationRepository.save(conversation);
    }

    // Prepare context from bot training data with RAG
    let ragContext = '';
    try {
      // Fetch relevant document chunks using vector similarity search
      ragContext = await buildRAGContext(botId, message);
    } catch (error) {
      console.error('Error building RAG context:', error);
      // Continue without RAG if it fails
    }

    const systemPrompt = `You are ${bot.name}, a helpful AI assistant.
    Your personality is ${bot.tone || 'professional'}.
    ${bot.customInstructions || ''}
    ${bot.trainingContext || ''}
    ${ragContext ? '\n\n' + ragContext : ''}
    Always be helpful, accurate, and concise.`;

    // Build conversation history for context (last 10 messages)
    const conversationHistory = (conversation.messages || [])
      .slice(-10)
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));

    // Call OpenAI API
    let aiResponse = 'I apologize, but I am currently unable to process your request.';

    if (OPENAI_API_KEY) {
      try {
        const openAIResponse = await fetch(OPENAI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: bot.aiModel || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...conversationHistory,
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
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      }
    );

    conversation.messages = messages;
    conversation.lastMessageAt = new Date();
    await conversationRepository.save(conversation);

    // Increment message usage counter
    if (subscription) {
      subscription.messagesUsed += 1;
      await subscriptionRepository.save(subscription);
    }

    // Return response with quota information
    const quotaInfo = subscription ? {
      used: subscription.messagesUsed,
      limit: subscription.messageLimit,
      remaining: subscription.getMessagesRemaining(),
      percentUsed: Math.round((subscription.messagesUsed / subscription.messageLimit) * 100)
    } : null;

    return NextResponse.json({
      success: true,
      response: aiResponse,
      sessionId: conversation.sessionId,
      quota: quotaInfo,
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