import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { BotAssignment } from '@/entities/BotAssignment';
import { Bot } from '@/entities/Bot';

export async function GET(request: NextRequest) {
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

    // Get bot assignments for this user
    const assignmentRepository = AppDataSource.getRepository(BotAssignment);
    const assignments = await assignmentRepository.find({
      where: { 
        userId: user.id,
        status: 'active'
      },
      relations: ['bot', 'assignedByUser']
    });

    // Transform the data to match the expected format
    const assignedBots = assignments.map(assignment => ({
      id: assignment.bot?.id || '',
      name: assignment.bot?.name || 'Unknown Bot',
      description: assignment.bot?.description || 'No description available',
      domain: assignment.bot?.domain || 'unknown.com',
      status: assignment.bot?.status || 'inactive',
      conversations: assignment.bot?.totalConversations || 0,
      lastActive: assignment.bot?.lastActive 
        ? new Date(assignment.bot.lastActive).toLocaleString()
        : 'Never',
      assignedBy: assignment.assignedByUser?.fullName || 'Unknown Manager',
      assignedAt: assignment.assignedAt.toISOString().split('T')[0]
    }));

    return NextResponse.json({ 
      bots: assignedBots,
      totalCount: assignedBots.length 
    });

  } catch (error) {
    console.error('Error fetching assigned bots:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
