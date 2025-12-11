import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { BotAssignment } from '@/entities/BotAssignment';
import { Conversation } from '@/entities/Conversation';
import { Bot } from '@/entities/Bot';

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

    // Get user from database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get bot assignments for this user
    const assignmentRepository = AppDataSource.getRepository(BotAssignment);
    const assignments = await assignmentRepository.find({
      where: {
        userId: user.id,
        status: 'active'
      },
      relations: ['bot']
    });

    const assignedBotIds = assignments.map(assignment => assignment.bot?.id).filter(Boolean);

    if (assignedBotIds.length === 0) {
      return NextResponse.json({ 
        conversations: [],
        stats: {
          total: 0,
          active: 0,
          completed: 0,
          avgRating: 0
        }
      });
    }

    // Get conversations for assigned bots
    const conversationRepository = AppDataSource.getRepository(Conversation);
    const conversations = await conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.bot', 'bot')
      .leftJoinAndSelect('conversation.user', 'user')
      .where('conversation.botId IN (:...assignedBotIds)', { assignedBotIds })
      .orderBy('conversation.createdAt', 'DESC')
      .getMany();

    // Format conversations - use actual conversation IDs so clicking works
    const formattedSessions = conversations.map(conv => {
      // Calculate message count from messages array
      const messageCount = conv.messages && Array.isArray(conv.messages) ? conv.messages.length : 1;

      // Calculate duration
      const startTime = conv.createdAt;
      const endTime = conv.lastMessageAt || conv.createdAt;
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Auto-complete: If no message for 30 minutes, mark as completed
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const isActive = endTime > thirtyMinutesAgo && conv.status !== 'completed';

      // Determine user name and email
      let userName = 'Unknown User';
      let userEmail = '';

      if (conv.guestName) {
        userName = conv.guestName;
        userEmail = conv.visitorEmail || '';
      } else if (user) {
        userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0];
        userEmail = user.email;
      }

      return {
        id: conv.id, // Use actual conversation ID
        botId: conv.botId,
        botName: conv.bot?.name || 'Unknown Bot',
        userId: conv.userId,
        userName: userName,
        userEmail: userEmail,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        lastMessageTime: endTime.toISOString(),
        status: isActive ? 'active' : (conv.status || 'completed'),
        messageCount: messageCount,
        duration: `${duration} min`,
        satisfaction: Math.floor(Math.random() * 2) + 4, // Mock rating between 4-5
        source: conv.guestId ? 'wordpress' : 'playground',
        guestId: conv.guestId,
        mode: conv.mode || 'AI'
      };
    });

    // Calculate stats
    const total = formattedSessions.length;
    const active = formattedSessions.filter(s => s.status === 'active').length;
    const completed = formattedSessions.filter(s => s.status === 'completed').length;
    const avgRating = formattedSessions.length > 0 
      ? formattedSessions.reduce((sum, s) => sum + s.satisfaction, 0) / formattedSessions.length 
      : 0;

    return NextResponse.json({
      conversations: formattedSessions,
      stats: {
        total,
        active,
        completed,
        avgResponseTime: '< 1 min'
      },
      filters: {
        bots: Array.from(new Set(formattedSessions.map(s => s.botId))).map(botId => {
          const session = formattedSessions.find(s => s.botId === botId);
          return { id: botId, name: session?.botName || 'Unknown' };
        }),
        users: Array.from(new Set(formattedSessions.map(s => s.userId))).map(userId => {
          const session = formattedSessions.find(s => s.userId === userId);
          return { id: userId, name: session?.userName || 'Unknown', email: session?.userEmail || '' };
        })
      }
    });

  } catch (error) {
    console.error('Error fetching user conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
