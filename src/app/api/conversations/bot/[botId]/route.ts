import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { Conversation } from '@/entities/Conversation';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    // Initialize database
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (error) {
        console.error('Database initialization failed:', error);
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        );
      }
    }

    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botId } = await params;

    // Get user
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ 
      where: { email: session.user.email } 
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to this bot
    // For managers: check if they created the bot
    // For users: check if they are assigned to the bot
    if (user.role === 'manager') {
      // Managers can access conversations for bots they created
      const botRepository = AppDataSource.getRepository(Bot);
      const bot = await botRepository.findOne({
        where: {
          id: botId,
          createdBy: user.id
        }
      });

      if (!bot) {
        return NextResponse.json({ error: 'Access denied. You can only access conversations for bots you created.' }, { status: 403 });
      }
    } else {
      // Regular users need to be assigned to the bot
      const { BotAssignment } = await import('@/entities/BotAssignment');
      const assignmentRepository = AppDataSource.getRepository(BotAssignment);
      const assignment = await assignmentRepository.findOne({
        where: {
          userId: user.id,
          botId: botId,
          status: 'active'
        }
      });

      if (!assignment) {
        return NextResponse.json({ error: 'Access denied. You are not assigned to this bot.' }, { status: 403 });
      }
    }

    // Get conversations for the bot
    const conversationRepository = AppDataSource.getRepository(Conversation);
    let conversations;
    
    if (user.role === 'manager') {
      // Managers can see all conversations for their bots
      conversations = await conversationRepository.find({
        where: { 
          botId: botId
        },
        order: { createdAt: 'ASC' },
        relations: ['bot', 'user']
      });
    } else {
      // Regular users can only see their own conversations
      conversations = await conversationRepository.find({
        where: { 
          botId: botId,
          userId: user.id
        },
        order: { createdAt: 'ASC' },
        relations: ['bot', 'user']
      });
    }

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      message: conv.message,
      sender: conv.sender,
      timestamp: conv.createdAt.toISOString(),
      isTestMessage: conv.isTestMessage,
      metadata: conv.metadata || null
    }));

    return NextResponse.json({ 
      success: true, 
      conversations: formattedConversations 
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch conversations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
