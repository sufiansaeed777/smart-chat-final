import { NextRequest, NextResponse } from 'next/server';
import pool from '@/utils/db';

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
    const { token, message, sessionId } = body;

    if (!token || !message) {
      return NextResponse.json(
        { error: 'Token and message are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse token
    const [userId, botId] = token.split(':');

    if (!userId || !botId) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get bot configuration from database
    const botResult = await pool.query(
      'SELECT * FROM bots WHERE id = $1 AND "createdBy" = $2 AND status = $3',
      [botId, userId, 'active']
    );

    if (botResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bot not found or inactive' },
        { status: 404, headers: corsHeaders }
      );
    }

    const bot = botResult.rows[0];

    // Prepare AI response
    let aiResponse = 'I apologize, but I am currently unable to process your request.';

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

      return NextResponse.json({
        success: true,
        response: `[DEMO MODE] ${demoResponse}`,
        sessionId: sessionId
      }, { headers: corsHeaders });
    }

    try {
      // Call OpenAI API
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
          max_tokens: parseInt(bot.maxTokens || bot["maxTokens"]) || 500
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

        // Handle specific OpenAI errors
        if (openAIResponse.status === 401) {
          aiResponse = 'Authentication error with AI service. Please check the API configuration.';
        } else if (openAIResponse.status === 429) {
          aiResponse = 'AI service rate limit reached. Please try again later.';
        } else if (errorData.error?.message) {
          console.error('OpenAI error message:', errorData.error.message);
          aiResponse = 'I encountered an error processing your request. Please try again.';
        }
      }
    } catch (openAIError) {
      console.error('Error calling OpenAI:', openAIError);
      aiResponse = 'I apologize, but I encountered an error connecting to the AI service.';
    }

    // Store conversation in database (optional, can be skipped for now)
    try {
      // Check if conversations table exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'conversations'
        );
      `);

      if (tableCheck.rows[0].exists) {
        // Store the conversation
        await pool.query(
          `INSERT INTO conversations
           ("sessionId", "botId", "userId", message, response, "createdAt")
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [sessionId || `session-${Date.now()}`, botId, userId, message, aiResponse]
        );
      }
    } catch (dbError) {
      // Ignore database errors for conversation storage
      console.log('Could not store conversation:', dbError.message);
    }

    // Return response
    return NextResponse.json({
      success: true,
      response: aiResponse,
      sessionId: sessionId
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Message processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process message: ' + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}