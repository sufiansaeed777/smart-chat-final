import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/utils/db';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botId, token, deactivateOld, expiresInDays } = await request.json();

    if (!botId || !token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // First check if the bot belongs to the user
    const botCheck = await pool.query(
      'SELECT id FROM bots WHERE id = $1 AND "createdBy" = $2',
      [botId, session.user.id]
    );

    if (botCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Bot not found or access denied' }, { status: 403 });
    }

    // Check if wordpress_tokens table exists, if not create it
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wordpress_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        last_used TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    // Add expires_at column if it doesn't exist (for existing tables)
    await pool.query(`
      ALTER TABLE wordpress_tokens
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP
    `).catch(() => {/* Column might already exist */});

    // 1 bot = 1 site = 1 token model
    // DELETE all existing tokens for this bot if requested
    if (deactivateOld) {
      await pool.query(
        `DELETE FROM wordpress_tokens
         WHERE bot_id = $1 AND user_id = $2`,
        [botId, session.user.id]
      );
    }

    // Calculate expiration date (default 30 days, max 365 days)
    const days = Math.min(Math.max(expiresInDays || 30, 1), 365);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Save the token to database
    const result = await pool.query(
      `INSERT INTO wordpress_tokens (bot_id, user_id, token, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at, expires_at`,
      [botId, session.user.id, token, expiresAt.toISOString()]
    );

    return NextResponse.json({
      success: true,
      tokenId: result.rows[0].id,
      createdAt: result.rows[0].created_at,
      expiresAt: result.rows[0].expires_at
    });

  } catch (error) {
    console.error('Error saving WordPress token:', error);
    return NextResponse.json(
      { error: 'Failed to save token' },
      { status: 500 }
    );
  }
}

// Get token for a bot (1 bot = 1 site = 1 token)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID required' }, { status: 400 });
    }

    // Get the single active token for this bot (latest one)
    const result = await pool.query(
      `SELECT token, created_at, expires_at, last_used,
              CASE WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN true ELSE false END as is_expired
       FROM wordpress_tokens
       WHERE bot_id = $1 AND user_id = $2 AND is_active = true
       ORDER BY created_at DESC
       LIMIT 1`,
      [botId, session.user.id]
    );

    return NextResponse.json({
      tokens: result.rows // Returns array with 0 or 1 token
    });

  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}

// Deactivate a token
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Deactivate the token
    const result = await pool.query(
      `UPDATE wordpress_tokens
       SET is_active = false
       WHERE token = $1 AND user_id = $2
       RETURNING id`,
      [token, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Token deactivated'
    });

  } catch (error) {
    console.error('Error deactivating token:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate token' },
      { status: 500 }
    );
  }
}