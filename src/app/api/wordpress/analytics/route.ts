import { NextRequest, NextResponse } from 'next/server';
import pool from '@/utils/db';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Find the bot associated with this WordPress token
    const tokenCheck = await pool.query(
      `SELECT wt.bot_id, b.name as bot_name
       FROM wordpress_tokens wt
       JOIN bots b ON wt.bot_id = b.id
       WHERE wt.token = $1 AND wt.is_active = true`,
      [token]
    );

    if (tokenCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid token or bot not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const botId = tokenCheck.rows[0].bot_id;
    const botName = tokenCheck.rows[0].bot_name;

    // Total conversations for this bot
    const totalConvResult = await pool.query(
      'SELECT COUNT(*) as count FROM conversations WHERE "botId" = $1',
      [botId]
    );
    const totalConversations = parseInt(totalConvResult.rows[0]?.count || '0');

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Messages today - count conversations updated today
    const todayConvResult = await pool.query(
      `SELECT messages FROM conversations
       WHERE "botId" = $1 AND "updatedAt" >= $2`,
      [botId, today.toISOString()]
    );

    let messagesToday = 0;
    todayConvResult.rows.forEach((row: { messages: unknown[] | null }) => {
      if (row.messages && Array.isArray(row.messages)) {
        messagesToday += row.messages.length;
      }
    });

    // Active sessions (conversations with status 'active' or 'waiting')
    const activeResult = await pool.query(
      `SELECT COUNT(*) as count FROM conversations
       WHERE "botId" = $1 AND (status = 'active' OR status = 'waiting')`,
      [botId]
    );
    const activeSessions = parseInt(activeResult.rows[0]?.count || '0');

    // Total messages across all conversations
    const allConvResult = await pool.query(
      'SELECT messages FROM conversations WHERE "botId" = $1',
      [botId]
    );

    let totalMessages = 0;
    allConvResult.rows.forEach((row: { messages: unknown[] | null }) => {
      if (row.messages && Array.isArray(row.messages)) {
        totalMessages += row.messages.length;
      }
    });

    // Human handoffs (conversations with mode = 'Human')
    const handoffResult = await pool.query(
      `SELECT COUNT(*) as count FROM conversations
       WHERE "botId" = $1 AND mode = 'Human'`,
      [botId]
    );
    const humanHandoffs = parseInt(handoffResult.rows[0]?.count || '0');

    // Average response time (simplified)
    const avgResponseTime = totalConversations > 0 ? '< 3s' : 'N/A';

    return NextResponse.json({
      totalConversations,
      messagesToday,
      activeSessions,
      avgResponseTime,
      totalMessages,
      humanHandoffs,
      botName,
      lastUpdated: new Date().toISOString()
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('WordPress analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500, headers: corsHeaders }
    );
  }
}
