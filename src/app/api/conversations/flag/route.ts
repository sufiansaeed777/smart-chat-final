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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { conversationId, reason } = body;

    if (!conversationId || !reason) {
      return NextResponse.json(
        { error: 'Conversation ID and reason are required' },
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

    // Update conversation with flag information
    await conversationRepository.update(
      { id: conversationId },
      {
        isFlagged: true,
        flagReason: reason,
        flaggedBy: user.id,
        flaggedAt: new Date(),
        reviewStatus: 'pending'
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Content flagged successfully',
      conversationId
    });

  } catch (error) {
    console.error('Error flagging content:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
