import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { BotAssignment } from '@/entities/BotAssignment';
import { Bot } from '@/entities/Bot';

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

    const botId = (await params).id;

    // Get user from database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to this bot
    const assignmentRepository = AppDataSource.getRepository(BotAssignment);
    const assignment = await assignmentRepository.findOne({
      where: {
        userId: user.id,
        botId: botId,
        status: 'active'
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Bot not assigned to user' }, { status: 403 });
    }

    // Get bot details
    const botRepository = AppDataSource.getRepository(Bot);
    const bot = await botRepository.findOne({
      where: { id: botId }
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: bot.id,
      name: bot.name,
      description: bot.description || 'No description available',
      domain: bot.domain || 'unknown.com',
      status: bot.status || 'inactive'
    });

  } catch (error) {
    console.error('Error fetching bot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
