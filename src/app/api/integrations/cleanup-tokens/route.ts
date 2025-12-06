import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/utils/db';

/**
 * Cleanup old and expired tokens
 * 1. Deactivates all expired tokens
 * 2. Keeps only 5 most recent active tokens per bot
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow managers to cleanup tokens
    if (session.user.role !== 'manager' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Only managers can cleanup tokens' }, { status: 403 });
    }

    // Get botId from request (optional - if not provided, cleanup all user's bots)
    const body = await request.json().catch(() => ({}));
    const { botId } = body;

    // First, deactivate ALL expired tokens for this user
    const expiredResult = await pool.query(
      `UPDATE wordpress_tokens
       SET is_active = false
       WHERE user_id = $1
         AND is_active = true
         AND expires_at IS NOT NULL
         AND expires_at < NOW()
       RETURNING id`,
      [session.user.id]
    );
    const expiredCount = expiredResult.rowCount || 0;

    let query;
    let params;

    if (botId) {
      // Cleanup tokens for specific bot
      query = `
        UPDATE wordpress_tokens
        SET is_active = false
        WHERE user_id = $1
          AND bot_id = $2
          AND is_active = true
          AND id NOT IN (
            SELECT id
            FROM (
              SELECT id,
                     ROW_NUMBER() OVER (PARTITION BY bot_id ORDER BY created_at DESC) as row_num
              FROM wordpress_tokens
              WHERE bot_id = $2 AND user_id = $1 AND is_active = true
            ) ranked
            WHERE row_num <= 5
          )
        RETURNING bot_id, token
      `;
      params = [session.user.id, botId];
    } else {
      // Cleanup tokens for all user's bots
      query = `
        UPDATE wordpress_tokens
        SET is_active = false
        WHERE user_id = $1
          AND is_active = true
          AND id NOT IN (
            SELECT id
            FROM (
              SELECT id,
                     ROW_NUMBER() OVER (PARTITION BY bot_id ORDER BY created_at DESC) as row_num
              FROM wordpress_tokens
              WHERE user_id = $1 AND is_active = true
            ) ranked
            WHERE row_num <= 5
          )
        RETURNING bot_id, token
      `;
      params = [session.user.id];
    }

    const result = await pool.query(query, params);

    // Get summary of tokens per bot after cleanup
    const summaryQuery = `
      SELECT
        bot_id,
        COUNT(*) as active_tokens
      FROM wordpress_tokens
      WHERE user_id = $1 AND is_active = true
      ${botId ? 'AND bot_id = $2' : ''}
      GROUP BY bot_id
      ORDER BY active_tokens DESC
    `;
    const summaryParams = botId ? [session.user.id, botId] : [session.user.id];
    const summary = await pool.query(summaryQuery, summaryParams);

    const oldTokensCount = result.rowCount || 0;
    return NextResponse.json({
      success: true,
      deactivatedExpired: expiredCount,
      deactivatedOld: oldTokensCount,
      deactivated: expiredCount + oldTokensCount,
      message: `Deactivated ${expiredCount} expired tokens and ${oldTokensCount} old tokens. Maximum 5 tokens per bot enforced.`,
      tokenCounts: summary.rows
    });

  } catch (error) {
    console.error('Error cleaning up tokens:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup tokens' },
      { status: 500 }
    );
  }
}

/**
 * Get cleanup summary without making changes
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get token counts per bot
    const summary = await pool.query(
      `SELECT
        bot_id,
        COUNT(*) as active_tokens,
        MIN(created_at) as oldest_token,
        MAX(created_at) as newest_token
      FROM wordpress_tokens
      WHERE user_id = $1 AND is_active = true
      GROUP BY bot_id
      ORDER BY active_tokens DESC`,
      [session.user.id]
    );

    // Count how many tokens would be deactivated (excess tokens)
    const excess = await pool.query(
      `SELECT COUNT(*) as excess_tokens
       FROM (
         SELECT id,
                ROW_NUMBER() OVER (PARTITION BY bot_id ORDER BY created_at DESC) as row_num
         FROM wordpress_tokens
         WHERE user_id = $1 AND is_active = true
       ) ranked
       WHERE row_num > 5`,
      [session.user.id]
    );

    // Count expired tokens that are still active
    const expired = await pool.query(
      `SELECT COUNT(*) as expired_tokens
       FROM wordpress_tokens
       WHERE user_id = $1
         AND is_active = true
         AND expires_at IS NOT NULL
         AND expires_at < NOW()`,
      [session.user.id]
    );

    const excessCount = parseInt(excess.rows[0].excess_tokens || '0');
    const expiredCount = parseInt(expired.rows[0].expired_tokens || '0');

    return NextResponse.json({
      tokenCounts: summary.rows,
      excessTokens: excessCount,
      expiredTokens: expiredCount,
      needsCleanup: excessCount > 0 || expiredCount > 0
    });

  } catch (error) {
    console.error('Error getting cleanup summary:', error);
    return NextResponse.json(
      { error: 'Failed to get cleanup summary' },
      { status: 500 }
    );
  }
}
