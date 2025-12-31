import { NextRequest, NextResponse } from 'next/server';
// import { AppDataSource } from '@/config/database';
// import { Conversation } from '@/entities/Conversation';
// import { MoreThanOrEqual, In } from 'typeorm';

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
  // Analytics temporarily disabled
  return NextResponse.json({
    message: 'Analytics temporarily disabled',
    totalConversations: 0,
    conversationsToday: 0,
    messagesToday: 0,
    activeSessions: 0,
    avgResponseTime: 'N/A',
    totalMessages: 0,
    humanHandoffs: 0,
    botName: 'N/A',
    lastUpdated: new Date().toISOString()
  }, { headers: corsHeaders });

  /*
  // COMMENTED OUT - Analytics functionality
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

    // Use 30 minutes to match the auto-complete threshold
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    allConversations.forEach((conv) => {
      // Count total messages
      if (conv.messages && Array.isArray(conv.messages)) {
        totalMessages += conv.messages.length;

        // Count messages from today - check multiple timestamp formats
        conv.messages.forEach((msg: any) => {
          const timestamp = msg.timestamp || msg.createdAt || msg.created_at;
          if (timestamp) {
            try {
              const msgDate = new Date(timestamp);
              if (!isNaN(msgDate.getTime()) && msgDate >= today) {
                messagesToday++;
              }
            } catch (e) {
              // Skip invalid timestamps
            }
          }
        });
      }

      // Count active sessions - use 30 minutes to match auto-complete threshold
      const lastActivity = conv.lastMessageAt || conv.updatedAt;

      // A session is active if:
      // 1. Status is 'active' or 'waiting' AND has recent activity (last 30 min)
      // 2. OR has activity within the last 30 minutes regardless of status
      if (conv.status === 'active' || conv.status === 'waiting') {
        if (lastActivity && new Date(lastActivity) >= thirtyMinutesAgo) {
          activeSessions++;
        }
      } else if (lastActivity && new Date(lastActivity) >= thirtyMinutesAgo && conv.status !== 'completed') {
        // Count as active if recent activity and not explicitly completed
        activeSessions++;
      }

      // Count human handoffs - conversations that are currently in Human mode
      // and are active (waiting for agent or being handled)
      if (conv.mode === 'Human' && (conv.status === 'active' || conv.status === 'waiting')) {
        humanHandoffs++;
      }
    });

    // Also count conversations updated today for a more meaningful "today" metric
    const conversationsToday = allConversations.filter((conv) => {
      const convDate = conv.updatedAt || conv.lastMessageAt;
      if (convDate) {
        try {
          return new Date(convDate) >= today;
        } catch {
          return false;
        }
      }
      return false;
    }).length;

    // If no messages found today but conversations were updated, use that count
    if (messagesToday === 0 && conversationsToday > 0) {
      messagesToday = conversationsToday;
    }

    // Average response time placeholder
    const avgResponseTime = totalConversations > 0 ? '< 3s' : 'N/A';

    // Log for debugging
    console.log(`WordPress Analytics for bot ${botId}:`, {
      totalConversations,
      conversationsToday,
      messagesToday,
      activeSessions,
      totalMessages,
      humanHandoffs
    });

    return NextResponse.json({
      totalConversations,
      conversationsToday,
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
  */
}
