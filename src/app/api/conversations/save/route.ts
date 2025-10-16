import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { Conversation } from '@/entities/Conversation';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';

export async function POST(request: NextRequest) {
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

    const { botId, message, sender, isTestMessage = false, metadata } = await request.json();

    if (!botId || !message || !sender) {
      return NextResponse.json({
        error: 'Missing required fields: botId, message, sender'
      }, { status: 400 });
    }

    if (!['user', 'bot'].includes(sender)) {
      return NextResponse.json({
        error: 'Invalid sender. Must be "user" or "bot"'
      }, { status: 400 });
    }

    // Get user and bot
    const userRepository = AppDataSource.getRepository(User);
    const botRepository = AppDataSource.getRepository(Bot);
    const conversationRepository = AppDataSource.getRepository(Conversation);

    const user = await userRepository.findOne({ 
      where: { email: session.user.email } 
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const bot = await botRepository.findOne({ 
      where: { id: botId } 
    });
    
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Create conversation record
    const conversation = new Conversation();
    conversation.botId = botId;
    conversation.userId = user.id;
    conversation.message = message;
    conversation.sender = sender;
    conversation.isTestMessage = isTestMessage;
    conversation.metadata = metadata || undefined;

    await conversationRepository.save(conversation);

    return NextResponse.json({ 
      success: true, 
      conversationId: conversation.id 
    });

  } catch (error) {
    console.error('Error saving conversation:', error);
    return NextResponse.json({ 
      error: 'Failed to save conversation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
