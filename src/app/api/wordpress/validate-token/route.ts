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
    let tokenCheck = { rows: [] as any[] };
    try {
      tokenCheck = await pool.query(
        `SELECT wt.*, b.*, u.email, u."isActive" as user_active,
                wt.expires_at,
                CASE WHEN wt.expires_at IS NOT NULL AND wt.expires_at < NOW() THEN true ELSE false END as is_expired
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

    // FIX: Only accept tokens that exist in database and are active
    // This ensures old/deleted tokens are immediately invalidated
    if (tokenCheck.rows.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired token' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if token is expired
    const tokenData = tokenCheck.rows[0];
    if (tokenData.is_expired) {
      // Deactivate the expired token
      await pool.query(
        'UPDATE wordpress_tokens SET is_active = false WHERE token = $1',
        [token]
      );

      return NextResponse.json(
        {
          valid: false,
          error: 'Token has expired',
          expired: true,
          expiredAt: tokenData.expires_at
        },
        { status: 401, headers: corsHeaders }
      );
    }

    // Token found in database - use tokenData already declared above
    const userId = tokenData.user_id;
    const botId = tokenData.bot_id;
    const bot = tokenData;
    const user = { email: tokenData.email, isActive: tokenData.user_active };

    // Update last_used timestamp
    await pool.query(
      'UPDATE wordpress_tokens SET last_used = CURRENT_TIMESTAMP WHERE token = $1',
      [token]
    );

    // Domain validation - Allow if:
    // 1. Development mode
    // 2. Bot has no domain set (NULL, empty string, or '*' for all domains)
    // 3. Bot domain includes the requesting domain
    const isDomainValid = process.env.NODE_ENV === 'development' ||
                          !bot.domain ||
                          bot.domain === '' ||
                          bot.domain === '*' ||
                          bot.domain.includes(domain);

    if (!isDomainValid) {
      return NextResponse.json(
        { valid: false, error: 'Domain not authorized for this bot' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Return bot configuration (using 'config' key for WordPress plugin compatibility)
    const botConfig = {
      id: bot.id,
      bot_id: bot.id, // WordPress plugin expects snake_case
      name: bot.name,
      avatar: bot.avatar,
      welcomeMessage: bot.welcomeMessage || bot["welcomeMessage"] || 'Hello! How can I help you today?',
      welcome_message: bot.welcomeMessage || bot["welcomeMessage"] || 'Hello! How can I help you today?', // WordPress expects snake_case
      placeholder: bot.placeholder || 'Type your message...',
      tone: bot.tone || 'professional',
      language: bot.language || 'en',
      primaryColor: bot.primaryColor || '#0066FF',
      primary_color: bot.primaryColor || '#0066FF', // WordPress expects snake_case
      position: bot.widgetPosition || 'bottom-right',
      // Model settings
      model: bot.model || 'gpt-3.5-turbo',
      systemPrompt: bot.systemPrompt || bot["systemPrompt"],
      temperature: Number(bot.temperature) || 0.7,
      maxTokens: Number(bot.maxTokens) || Number(bot["maxTokens"]) || 500,
      // Features
      features: {
        fileUpload: bot.enableFileUpload || false,
        voiceInput: bot.enableVoiceInput || false,
        emailCapture: bot.requireEmail || false,
        typing: true,
        soundNotifications: true
      }
    };

    return NextResponse.json({
      valid: true,
      config: botConfig, // WordPress plugin expects this key
      bot: botConfig, // Keep for backwards compatibility
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