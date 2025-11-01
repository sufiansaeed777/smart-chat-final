import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';

export async function GET(request: NextRequest) {
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

    const conversationRepository = AppDataSource.getRepository('conversations');

    // Count conversations in Human mode (human handoff)
    const totalHandoffs = await conversationRepository.count({
      where: { userId: user.id, mode: 'Human' }
    });

    const pendingHandoffs = await conversationRepository.count({
      where: { userId: user.id, mode: 'Human', status: 'waiting' }
    });

    const inProgressHandoffs = await conversationRepository.count({
      where: { userId: user.id, mode: 'Human', status: 'active' }
    });

    const resolvedHandoffs = await conversationRepository.count({
      where: { userId: user.id, mode: 'Human', status: 'completed' }
    });

    return NextResponse.json({
      total: totalHandoffs,
      pending: pendingHandoffs,
      inProgress: inProgressHandoffs,
      resolved: resolvedHandoffs
    });

  } catch (error) {
    console.error('Error fetching handoff stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
