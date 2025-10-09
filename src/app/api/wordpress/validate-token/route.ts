import { NextRequest, NextResponse } from 'next/server';
import pool from '@/utils/db';

/**
 * WordPress Plugin Token Validation Endpoint
 *
 * This endpoint validates the auth token from WordPress plugin
 * and checks if the domain is authorized for this bot
 */

// Set SSL for Supabase connection - ONLY in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

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
    const { token, domain } = body;

    if (!token || !domain) {
      return NextResponse.json(
        { valid: false, error: 'Token and domain are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // First check if this is a saved token in the database
    let tokenCheck = { rows: [] };
    try {
      tokenCheck = await pool.query(
        `SELECT wt.*, b.*, u.email, u."isActive" as user_active
         FROM wordpress_tokens wt
         JOIN bots b ON wt.bot_id = b.id
         JOIN users u ON wt.user_id = u.id
         WHERE wt.token = $1 AND wt.is_active = true`,
        [token]
      );
    } catch (tableError) {
      // Table might not exist yet, continue with token parsing
      console.log('WordPress tokens table not found, using token parsing fallback');
    }

    let userId, botId;
    let bot, user;

    if (tokenCheck.rows.length > 0) {
      // Token found in database
      const tokenData = tokenCheck.rows[0];
      userId = tokenData.user_id;
      botId = tokenData.bot_id;
      bot = tokenData;
      user = { email: tokenData.email, isActive: tokenData.user_active };

      // Update last_used timestamp
      await pool.query(
        'UPDATE wordpress_tokens SET last_used = CURRENT_TIMESTAMP WHERE token = $1',
        [token]
      );
    } else {
      // Fall back to parsing token format: "user_id:bot_id:secret_token"
      const parts = token.split(':');
      if (parts.length !== 3) {
        return NextResponse.json(
          { valid: false, error: 'Invalid token format' },
          { status: 401, headers: corsHeaders }
        );
      }

      [userId, botId] = parts;

      // Verify user and bot
      const userResult = await pool.query(
        'SELECT email, "isActive" FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].isActive) {
        return NextResponse.json(
          { valid: false, error: 'Invalid user or inactive account' },
          { status: 401, headers: corsHeaders }
        );
      }
      user = userResult.rows[0];

      // Get bot details
      const botResult = await pool.query(
        'SELECT * FROM bots WHERE id = $1 AND "createdBy" = $2 AND status = $3',
        [botId, userId, 'active']
      );

      if (botResult.rows.length === 0) {
        return NextResponse.json(
          { valid: false, error: 'Bot not found or inactive' },
          { status: 404, headers: corsHeaders }
        );
      }
      bot = botResult.rows[0];
    }

    // TODO: Validate domain binding
    // For now, we'll allow any domain in development
    const isDomainValid = process.env.NODE_ENV === 'development' ||
                          (bot.domain && bot.domain.includes(domain));

    if (!isDomainValid && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { valid: false, error: 'Domain not authorized for this bot' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Return bot configuration
    return NextResponse.json({
      valid: true,
      bot: {
        id: bot.id,
        name: bot.name,
        avatar: bot.avatar,
        welcomeMessage: bot.welcomeMessage || bot["welcomeMessage"] || 'Hello! How can I help you today?',
        placeholder: bot.placeholder || 'Type your message...',
        tone: bot.tone || 'professional',
        language: bot.language || 'en',
        primaryColor: bot.primaryColor || '#0066FF',
        position: bot.widgetPosition || 'bottom-right',
        // Model settings
        model: bot.model || 'gpt-3.5-turbo',
        systemPrompt: bot.systemPrompt || bot["systemPrompt"],
        temperature: bot.temperature || 0.7,
        maxTokens: bot.maxTokens || bot["maxTokens"] || 500,
        // Features
        features: {
          fileUpload: bot.enableFileUpload || false,
          voiceInput: bot.enableVoiceInput || false,
          emailCapture: bot.requireEmail || false,
          typing: true,
          soundNotifications: true
        }
      },
      user: {
        plan: 'pro', // TODO: Get from user subscription
        messagesRemaining: 1000, // TODO: Calculate from subscription
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Server error during validation' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * TODO: Non-WordPress Support
 *
 * For JavaScript widget (non-WordPress sites):
 * 1. Create /api/widget/validate endpoint
 * 2. Add CORS headers for allowed origins
 * 3. Support both token and API key authentication
 * 4. Return minified widget configuration
 */