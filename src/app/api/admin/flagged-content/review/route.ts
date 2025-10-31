import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository('users');
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { conversationId, action, notes } = body;

    if (!conversationId || !action) {
      return NextResponse.json(
        { error: 'Conversation ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected', 'resolved'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: approved, rejected, or resolved' },
        { status: 400 }
      );
    }

    const conversationRepository = AppDataSource.getRepository('conversations');
    const conversation = await conversationRepository.findOne({
      where: { id: conversationId }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (!conversation.isFlagged) {
      return NextResponse.json(
        { error: 'This conversation is not flagged' },
        { status: 400 }
      );
    }

    // Update conversation with review information
    await conversationRepository.update(
      { id: conversationId },
      {
        reviewStatus: action as 'approved' | 'rejected' | 'resolved',
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewNotes: notes || null
      }
    );

    return NextResponse.json({
      success: true,
      message: `Content ${action} successfully`,
      conversationId,
      action
    });

  } catch (error) {
    console.error('Error reviewing flagged content:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
