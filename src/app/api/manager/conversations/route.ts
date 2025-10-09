import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { BotAssignment } from '@/entities/BotAssignment';
import { Conversation } from '@/entities/Conversation';
import { Bot } from '@/entities/Bot';
import { In } from 'typeorm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get manager from database
    const userRepository = AppDataSource.getRepository("users");
    const manager = await userRepository.findOne({ 
      where: { email: session.user.email } 
    });

    if (!manager || manager.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // Get query parameters for filtering and sorting
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'lastMessage';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status') || 'all';
    const botId = searchParams.get('botId') || 'all';
    const userId = searchParams.get('userId') || 'all';
    const dateRange = searchParams.get('dateRange') || 'all';

    // Get all users invited by this manager
    const invitedUsers = await userRepository.find({
      where: { invitedBy: manager.id },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt', 'password', 'lastLoginAt']
    });

    // Include the manager themselves in the user list for their own conversations
    const allRelevantUsers = [...invitedUsers, manager];
    const relevantUserIds = allRelevantUsers.map(u => u.id);

    if (relevantUserIds.length === 0) {
      return NextResponse.json({
        conversations: [],
        stats: {
          total: 0,
          active: 0,
          completed: 0,
          avgResponseTime: '0 min'
        }
      });
    }

    // Get bot assignments for these users
    const assignmentRepository = AppDataSource.getRepository("bot_assignments");
    const assignments = await assignmentRepository.find({
      where: { 
        userId: In(relevantUserIds),
        status: 'active'
      },
      relations: ['bot']
    });

    // Also get bots created by the manager (for manager's own conversations)
    const botRepository = AppDataSource.getRepository("bots");
    const managerBots = await botRepository.find({
      where: { createdBy: manager.id }
    });

    const assignedBotIds = assignments.map(a => a.botId).filter(Boolean);
    const managerBotIds = managerBots.map(b => b.id);
    const allBotIds = [...new Set([...assignedBotIds, ...managerBotIds])]; // Remove duplicates

    if (allBotIds.length === 0) {
      return NextResponse.json({
        conversations: [],
        stats: {
          total: 0,
          active: 0,
          completed: 0,
          avgResponseTime: '0 min'
        },
        filters: {
          bots: [],
          users: allRelevantUsers.map(u => ({ 
            id: u.id, 
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email.split('@')[0],
            email: u.email 
          }))
        }
      });
    }

    // Build query for conversations
    let query = AppDataSource.getRepository("conversations")
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.bot', 'bot')
      .leftJoinAndSelect('conversation.user', 'user')
      .where('conversation.botId IN (:...allBotIds)', { allBotIds })
      .andWhere('conversation.userId IN (:...relevantUserIds)', { relevantUserIds });

    // Apply filters
    if (botId !== 'all') {
      query = query.andWhere('conversation.botId = :botId', { botId });
    }

    if (userId !== 'all') {
      query = query.andWhere('conversation.userId = :userId', { userId });
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      query = query.andWhere('conversation.createdAt >= :startDate', { startDate });
    }

    // Apply sorting
    switch (sortBy) {
      case 'lastMessage':
        query = query.orderBy('conversation.createdAt', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'user':
        query = query.orderBy('user.email', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'bot':
        query = query.orderBy('bot.name', sortOrder.toUpperCase() as 'ASC' | 'DESC');
        break;
      default:
        query = query.orderBy('conversation.createdAt', 'DESC');
    }

    const conversations = await query.getMany();

    // Group conversations by user and bot (all messages between same user and bot = one conversation)
    const conversationSessions = new Map<string, { 
      id: string; 
      botId: string; 
      botName: string; 
      userId: string; 
      userName: string; 
      userEmail: string; 
      startTime: Date; 
      endTime: Date;
      lastMessageAt: Date; 
      messageCount: number; 
      conversations: Conversation[];
      status: string; 
      messages: { id: string; content: string; timestamp: Date }[] 
    }>();
    
    conversations.forEach(conv => {
      // Create session key based only on user and bot (no time window)
      const sessionKey = `${conv.botId}-${conv.userId}`;
      
      if (!conversationSessions.has(sessionKey)) {
        const user = allRelevantUsers.find(u => u.id === conv.userId);
        // Filter out undefined bots before searching
        const bot = [...assignments.map(a => a.bot).filter(Boolean), ...managerBots].find(b => b?.id === conv.botId);
        
        conversationSessions.set(sessionKey, {
          id: sessionKey,
          botId: conv.botId,
          botName: bot?.name || 'Unknown Bot',
          userId: conv.userId,
          userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0] : 'Unknown User',
          userEmail: user?.email || 'Unknown',
          startTime: conv.createdAt,
          endTime: conv.createdAt,
          lastMessageAt: conv.createdAt,
          messageCount: 0,
          conversations: [],
          status: 'active', // Will be determined based on time
          messages: []
        });
      }
      
      const session = conversationSessions.get(sessionKey);
      if (session) {
        session.conversations.push(conv);
        session.messageCount++;
        
        // Update start and end times
        if (conv.createdAt < session.startTime) {
          session.startTime = conv.createdAt;
        }
        if (conv.createdAt > session.endTime) {
          session.endTime = conv.createdAt;
        }
      }
    });

    // Convert to array and format
    const formattedSessions = Array.from(conversationSessions.values()).map(session => {
      const isActive = session.endTime > new Date(Date.now() - 24 * 60 * 60 * 1000);
      const duration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60));
      
      return {
        id: session.id,
        botId: session.botId,
        botName: session.botName,
        userId: session.userId,
        userName: session.userName,
        userEmail: session.userEmail,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString(),
        lastMessageTime: session.endTime.toISOString(),
        status: isActive ? 'active' : 'completed',
        messageCount: session.messageCount,
        duration: `${duration} min`,
        satisfaction: Math.floor(Math.random() * 2) + 4 // Mock rating between 4-5
      };
    });

    // Apply status filter after formatting
    let filteredSessions = formattedSessions;
    if (status !== 'all') {
      filteredSessions = formattedSessions.filter(session => session.status === status);
    }

    // Calculate stats
    const total = formattedSessions.length;
    const active = formattedSessions.filter(s => s.status === 'active').length;
    const completed = formattedSessions.filter(s => s.status === 'completed').length;
    const avgResponseTime = formattedSessions.length > 0 
      ? `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 9)} min`
      : '0 min';

    return NextResponse.json({
      conversations: filteredSessions,
      stats: {
        total,
        active,
        completed,
        avgResponseTime
      },
      filters: {
        bots: [...assignments.map(a => ({ id: a.botId, name: a.bot?.name || 'Unknown' })), ...managerBots.map(b => ({ id: b.id, name: b.name }))]
          .filter((bot, index, self) => self.findIndex(b => b.id === bot.id) === index), // Remove duplicate bots
        users: allRelevantUsers.map(u => ({ 
          id: u.id, 
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email.split('@')[0],
          email: u.email 
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching manager conversations:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      }, 
      { status: 500 }
    );
  }
}
