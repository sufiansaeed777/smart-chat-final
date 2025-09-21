import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';
import { BotAssignment } from '@/entities/BotAssignment';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get user from database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ 
      where: { email: session.user.email } 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a manager
    if (user.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can delete bots' }, { status: 403 });
    }

    const body = await request.json();
    const { botId } = body;

    if (!botId) {
      return NextResponse.json({ 
        error: 'Bot ID is required' 
      }, { status: 400 });
    }

    // Get the bot from database
    const botRepository = AppDataSource.getRepository(Bot);
    const bot = await botRepository.findOne({
      where: { 
        id: botId,
        createdBy: user.id // Ensure the manager owns this bot
      }
    });

    if (!bot) {
      return NextResponse.json({ 
        error: 'Bot not found or you do not have permission to delete it' 
      }, { status: 404 });
    }

    // Delete all bot assignments first
    const assignmentRepository = AppDataSource.getRepository(BotAssignment);
    await assignmentRepository.delete({ botId: botId });

    // Delete the bot
    await botRepository.delete({ id: botId });

    return NextResponse.json({
      message: 'Bot deleted successfully',
      botId: botId
    });

  } catch (error) {
    console.error('Error deleting bot:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}