import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';

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
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository("users");
    const conversationRepository = AppDataSource.getRepository("conversations");

    // Get current user
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser || currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const conversationId = params.id;

    // Get conversation details with all messages
    const conversations = await conversationRepository.find({
      where: { botId: conversationId.split('-')[0] }, // Adjust based on actual session tracking
      order: { createdAt: 'ASC' }
    });

    if (conversations.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get bot and user details for the export
    const botRepository = AppDataSource.getRepository("bots");

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
        name: user?.name,
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
