import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { Conversation } from '@/entities/Conversation';
import { MoreThanOrEqual, In } from 'typeorm';

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

    // Initialize database if needed
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Find the bot associated with this WordPress token
    let botId: string | null = null;
    let botName: string = 'Unknown Bot';

    try {
      const tokenResult = await AppDataSource.query(
        `SELECT wt.bot_id, b.name as bot_name
         FROM wordpress_tokens wt
         JOIN bots b ON wt.bot_id = b.id
         WHERE wt.token = $1 AND wt.is_active = true`,
        [token]
      );

      if (tokenResult && tokenResult.length > 0) {
        botId = tokenResult[0].bot_id;
        botName = tokenResult[0].bot_name;
      }
    } catch (tableError) {
      console.log('WordPress tokens table error:', tableError);
    }

    if (!botId) {
      return NextResponse.json(
        { error: 'Invalid token or bot not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const conversationRepository = AppDataSource.getRepository(Conversation);

    // Total conversations for this bot
    const totalConversations = await conversationRepository.count({
      where: { botId }
    });

    // Get today's date range (use local timezone)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all conversations for this bot to count messages
    const allConversations = await conversationRepository.find({
      where: { botId },
      select: ['id', 'messages', 'status', 'mode', 'updatedAt', 'lastMessageAt']
    });

    // Count messages
    let totalMessages = 0;
    let messagesToday = 0;
    let activeSessions = 0;
    let humanHandoffs = 0;

    allConversations.forEach((conv) => {
      // Count total messages
      if (conv.messages && Array.isArray(conv.messages)) {
        totalMessages += conv.messages.length;

        // Count messages from today
        conv.messages.forEach((msg) => {
          if (msg.timestamp) {
            const msgDate = new Date(msg.timestamp);
            if (msgDate >= today) {
              messagesToday++;
            }
          }
        });
      }

      // Count active sessions
      if (conv.status === 'active' || conv.status === 'waiting') {
        activeSessions++;
      }

      // Count human handoffs
      if (conv.mode === 'Human') {
        humanHandoffs++;
      }
    });

    // Average response time placeholder
    const avgResponseTime = totalConversations > 0 ? '< 3s' : 'N/A';

    // Log for debugging
    console.log(`WordPress Analytics for bot ${botId}:`, {
      totalConversations,
      messagesToday,
      activeSessions,
      totalMessages,
      humanHandoffs
    });

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
