/**
 * PHASE 4: Streaming Chat Response with Server-Sent Events (SSE)
 *
 * Provides real-time streaming responses for WordPress chatbot
 * Uses OpenAI streaming API for progressive response delivery
 */

import { NextRequest } from 'next/server';
import pool from '@/utils/db';
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
    const { token, message, sessionId } = body;

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

    // Get bot configuration from database
    const botResult = await pool.query(
      'SELECT * FROM bots WHERE id = $1 AND "createdBy" = $2 AND status = $3',
      [botId, userId, 'active']
    );

    if (botResult.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Bot not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bot = botResult.rows[0];

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

            // Provide demo responses based on keywords
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
            const words = `[DEMO MODE] ${demoResponse}`.split(' ');
            for (const word of words) {
              sendSSE(JSON.stringify({ chunk: word + ' ' }));
              await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
            }

            sendSSE(JSON.stringify({ done: true, sessionId }));
            controller.close();
            return;
          }

          // Call OpenAI API with streaming enabled
          const openAIResponse = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: bot.model || 'gpt-3.5-turbo',
              messages: [
                {
                  role: 'system',
                  content: bot.systemPrompt || bot["systemPrompt"] || 'You are a helpful assistant.'
                },
                {
                  role: 'user',
                  content: message
                }
              ],
              temperature: parseFloat(bot.temperature) || 0.7,
              max_tokens: parseInt(bot.maxTokens || bot["maxTokens"]) || 500,
              stream: true // Enable streaming
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
              // Send completion message
              sendSSE(JSON.stringify({ done: true, sessionId, fullResponse }));
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

          // Store conversation in database (async, don't wait)
          try {
            const tableCheck = await pool.query(`
              SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'conversations'
              );
            `);

            if (tableCheck.rows[0].exists) {
              await pool.query(
                `INSERT INTO conversations ("botId", "userId", message, response, "createdAt", "isTestMessage", metadata)
                 VALUES ($1, $2, $3, $4, NOW(), $5, $6)`,
                [botId, userId, message, fullResponse, false, { sessionId, stream: true }]
              );
            }
          } catch (dbError) {
            console.error('Error storing conversation:', dbError);
            // Don't fail the stream if DB storage fails
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
