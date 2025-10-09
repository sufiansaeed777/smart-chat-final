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

    // Parse the session ID (format: botId-userId)
    // Split by the last dash to separate botId and userId (UUIDs contain dashes)
    const parts = conversationId.split('-');
    const userId = parts.slice(-5).join('-'); // Last 5 parts = userId UUID
    const botId = parts.slice(0, -5).join('-'); // First parts = botId UUID

    // Get conversation details with messages
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

    // Group messages by session (assuming they have the same bot and user)
    const conversation = {
      id: conversationId,
      messages: conversations.map(conv => ({
        id: conv.id,
        message: conv.message,
        sender: conv.sender,
        timestamp: conv.createdAt,
        isTestMessage: conv.isTestMessage || false
      }))
    };

    return NextResponse.json({ success: true, conversation });

  } catch (error) {
    console.error('Error fetching conversation details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation details' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Parse the session ID (format: botId-userId)
    const parts = conversationId.split('-');
    const userId = parts.slice(-5).join('-'); // Last 5 parts = userId UUID
    const botId = parts.slice(0, -5).join('-'); // First parts = botId UUID

    // Delete all messages in this conversation session
    const conversations = await conversationRepository.find({
      where: {
        botId: botId,
        userId: userId
      }
    });

    if (conversations.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Delete all messages
    await conversationRepository.remove(conversations);

    return NextResponse.json({ success: true, message: 'Conversation deleted successfully' });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
