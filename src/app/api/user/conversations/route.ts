import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    // Group conversations by session (assuming conversations with same bot and user within 30 minutes are same session)
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
      const sessionKey = `${conv.botId}-${conv.userId}-${Math.floor(conv.createdAt.getTime() / (30 * 60 * 1000))}`;
      
      if (!conversationSessions.has(sessionKey)) {
        conversationSessions.set(sessionKey, {
          id: sessionKey,
          botId: conv.botId,
          botName: conv.bot?.name || 'Unknown Bot',
          userId: conv.userId,
          userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0] : 'Unknown User',
          userEmail: user?.email || 'Unknown',
          startTime: conv.createdAt,
          endTime: conv.createdAt,
          lastMessageAt: conv.createdAt,
          messageCount: 0,
          conversations: [],
          status: 'active',
          messages: []
        });
      }
      
      const session = conversationSessions.get(sessionKey);
      if (session) {
        session.conversations.push(conv);
        session.messageCount++;
        
        // Update end time if this conversation is later
        if (conv.createdAt > session.endTime) {
          session.endTime = conv.createdAt;
        }
      }
    });

    // Convert to array and format
    const formattedSessions = Array.from(conversationSessions.values()).map(session => {
      const isActive = session.endTime > new Date(Date.now() - 24 * 60 * 60 * 1000); // Active if within last 24 hours
      const duration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60)); // Duration in minutes

      // Calculate satisfaction based on response time (faster = higher satisfaction)
      let satisfaction = 4;
      if (duration < 2) satisfaction = 5;
      else if (duration < 5) satisfaction = 5;
      else if (duration < 10) satisfaction = 4;
      else if (duration < 30) satisfaction = 4;

      return {
        id: session.id,
        customerName: session.userEmail.split('@')[0] || 'Unknown User',
        customerEmail: session.userEmail,
        botName: session.botName,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString(),
        status: isActive ? 'active' : 'completed',
        messageCount: session.messageCount,
        duration: `${duration} min`,
        satisfaction: satisfaction
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
        avgRating: Math.round(avgRating * 10) / 10
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
