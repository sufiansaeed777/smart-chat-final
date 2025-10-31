import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';

export async function GET() {
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

    const botRepository = AppDataSource.getRepository('bots');
    const conversationRepository = AppDataSource.getRepository('conversations');

    const totalUsers = await userRepository.count();
    const totalBots = await botRepository.count();
    const totalConversations = await conversationRepository.count();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await userRepository
      .createQueryBuilder('user')
      .where('user.updatedAt > :date', { date: thirtyDaysAgo })
      .getCount();

    const usersByRole = await userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const recentUsers = await userRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt']
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalBots,
        totalConversations,
        activeUsers,
        systemHealth: 'healthy',
        databaseStatus: 'connected',
        usersByRole,
        recentUsers
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
