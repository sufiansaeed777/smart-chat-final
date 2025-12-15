/**
 * PHASE 4: Streaming Chat Response with Server-Sent Events (SSE)
 *
 * Provides real-time streaming responses for WordPress chatbot
 * Uses OpenAI streaming API for progressive response delivery
 */

import { NextRequest } from 'next/server';
import { AppDataSource } from '@/config/database';
import { Bot } from '@/entities/Bot';
import { Conversation } from '@/entities/Conversation';
import { User } from '@/entities/User';
import rateLimiter, { getClientIdentifier, RATE_LIMITS } from '@/middleware/rateLimit';
import abuseDetector from '@/middleware/abuseDetection';

// Set SSL for Supabase connection - ONLY in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// CORS headers for SSE
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
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body = await request.json();
    const { token, message, sessionId, metadata } = body;

    if (!token || !message) {
      return new Response(
        JSON.stringify({ error: 'Token and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await rateLimiter.check(
      clientId,
      RATE_LIMITS.CHAT_MESSAGE.limit,
      RATE_LIMITS.CHAT_MESSAGE.windowMs
    );

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Abuse detection check
    const abuseResult = await abuseDetector.checkMessage(clientId, message);
    if (!abuseResult.allowed) {
      return new Response(
        JSON.stringify({
          error: abuseResult.reason || 'Message blocked due to abuse detection',
          score: abuseResult.score
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse token
    const [userId, botId] = token.split(':');

    if (!userId || !botId) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize database
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (error) {
        console.error('Database initialization failed:', error);
        return new Response(
          JSON.stringify({ error: 'Database connection failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get bot configuration from database using TypeORM
    const botRepository = AppDataSource.getRepository(Bot);
    const bot = await botRepository.findOne({
      where: {
        id: botId,
        createdBy: userId,
        status: 'active'
      }
    });

    if (!bot) {
      return new Response(
        JSON.stringify({ error: 'Bot not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get bot owner for message counting
    const userRepository = AppDataSource.getRepository(User);
    const botOwner = await userRepository.findOne({
      where: { id: userId }
    });

    // Prepare conversation data
    const conversationRepository = AppDataSource.getRepository(Conversation);
    const actualSessionId = sessionId || `wp_stream_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

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

    // Find or create conversation
    let conversation = await conversationRepository.findOne({
      where: {
        botId: botId,
        sessionId: actualSessionId
      }
    });

    if (!conversation) {
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
          endpoint: 'stream',
          userIp: visitorIp,
          userAgent: metadata?.user_agent || request.headers.get('user-agent') || '',
          pageUrl: pageUrl,
          country: country
        }
      });
      await conversationRepository.save(conversation);
    }

    // Create readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        // Helper function to send SSE data
        const sendSSE = (data: string) => {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        try {
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

            // Simulate streaming by sending word by word
            const fullDemoResponse = `[DEMO MODE] ${demoResponse}`;
            const words = fullDemoResponse.split(' ');
            for (const word of words) {
              sendSSE(JSON.stringify({ chunk: word + ' ' }));
              await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Save conversation with demo response
            const messages = conversation!.messages || [];
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
                text: fullDemoResponse,
                timestamp: new Date().toISOString()
              }
            );
            conversation!.messages = messages;
            conversation!.lastMessageAt = new Date();
            await conversationRepository.save(conversation!);

            sendSSE(JSON.stringify({ done: true, sessionId: actualSessionId, conversationId: conversation!.id }));
            controller.close();
            return;
          }

          // Call OpenAI API with streaming enabled
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
              max_tokens: Number(bot.maxTokens) || 500,
              stream: true
            })
          });

          if (!openAIResponse.ok) {
            const errorData = await openAIResponse.json();
            console.error('OpenAI API error:', errorData);

            let errorMessage = 'I encountered an error processing your request.';
            if (openAIResponse.status === 401) {
              errorMessage = 'Authentication error with AI service.';
            } else if (openAIResponse.status === 429) {
              errorMessage = 'AI service rate limit reached. Please try again later.';
            }

            sendSSE(JSON.stringify({ error: errorMessage }));
            controller.close();
            return;
          }

          // Read the stream from OpenAI
          const reader = openAIResponse.body?.getReader();
          const decoder = new TextDecoder();
          let fullResponse = '';

          if (!reader) {
            sendSSE(JSON.stringify({ error: 'Failed to read stream' }));
            controller.close();
            return;
          }

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Save conversation with full response
              const messages = conversation!.messages || [];
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
                  text: fullResponse,
                  timestamp: new Date().toISOString()
                }
              );
              conversation!.messages = messages;
              conversation!.lastMessageAt = new Date();
              await conversationRepository.save(conversation!);

              // Increment message usage counter
              if (botOwner) {
                botOwner.messagesUsedThisMonth = (botOwner.messagesUsedThisMonth || 0) + 1;
                await userRepository.save(botOwner);
              }

              // Send completion message
              sendSSE(JSON.stringify({
                done: true,
                sessionId: actualSessionId,
                conversationId: conversation!.id,
                fullResponse
              }));
              controller.close();
              break;
            }

            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6);

                if (data === '[DONE]') {
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;

                  if (content) {
                    fullResponse += content;
                    // Send each chunk to the client
                    sendSSE(JSON.stringify({ chunk: content }));
                  }
                } catch (parseError) {
                  console.error('Error parsing SSE chunk:', parseError);
                }
              }
            }
          }

        } catch (error) {
          console.error('Streaming error:', error);
          sendSSE(JSON.stringify({
            error: 'An error occurred while processing your request.'
          }));
          controller.close();
        }
      },

      cancel() {
        console.log('Stream cancelled by client');
      }
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Error in chat-stream:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
