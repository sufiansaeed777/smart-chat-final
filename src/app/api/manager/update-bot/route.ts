import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';

export async function PUT(request: NextRequest) {
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
    const userRepository = AppDataSource.getRepository("users");
    const user = await userRepository.findOne({ 
      where: { email: session.user.email } 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a manager
    if (user.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can update bots' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, domain, status } = body;

    if (!id || !name || !description || !domain || !status) {
      return NextResponse.json({ 
        error: 'All fields are required' 
      }, { status: 400 });
    }

    // Get the bot from database
    const botRepository = AppDataSource.getRepository("bots");
    const bot = await botRepository.findOne({
      where: { 
        id: id,
        createdBy: user.id // Ensure the manager owns this bot
      }
    });

    if (!bot) {
      return NextResponse.json({ 
        error: 'Bot not found or you do not have permission to update it' 
      }, { status: 404 });
    }

    // Update the bot
    bot.name = name;
    bot.description = description;
    bot.domain = domain;
    bot.status = status;
    bot.updatedAt = new Date();

    await botRepository.save(bot);

    return NextResponse.json({
      message: 'Bot updated successfully',
      bot: {
        id: bot.id,
        name: bot.name,
        description: bot.description,
        domain: bot.domain,
        status: bot.status,
        createdAt: bot.createdAt,
        updatedAt: bot.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating bot:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
