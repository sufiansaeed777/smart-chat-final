import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';
import { Conversation } from '@/entities/Conversation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
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

    const userRepository = AppDataSource.getRepository(User);
    const conversationRepository = AppDataSource.getRepository(Conversation);

    // Get current user
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser || currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const conversationId = params.id;

    // Parse the session ID (format: botId-userId)
    const parts = conversationId.split('-');
    const userId = parts.slice(-5).join('-'); // Last 5 parts = userId UUID
    const botId = parts.slice(0, -5).join('-'); // First parts = botId UUID

    // Get conversation details with all messages
    const conversations = await conversationRepository.find({
      where: {
        botId: botId,
        userId: userId
      },
      order: { createdAt: 'ASC' }
    });

    if (conversations.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get bot and user details for the export
    const botRepository = AppDataSource.getRepository(Bot);

    const firstConv = conversations[0];
    const bot = await botRepository.findOne({ where: { id: firstConv.botId } });
    const user = await userRepository.findOne({ where: { id: firstConv.userId } });

    // Format export data
    const exportData = {
      conversationId: conversationId,
      bot: {
        id: bot?.id,
        name: bot?.name
      },
      user: {
        id: user?.id,
        name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'Unknown User' : 'Unknown User',
        email: user?.email
      },
      exportedAt: new Date().toISOString(),
      messageCount: conversations.length,
      messages: conversations.map(conv => ({
        id: conv.id,
        sender: conv.sender,
        message: conv.message,
        timestamp: conv.createdAt,
        isTestMessage: conv.isTestMessage || false
      }))
    };

    return NextResponse.json(exportData);

  } catch (error) {
    console.error('Error exporting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to export conversation' },
      { status: 500 }
    );
  }
}
