import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppDataSource } from '@/config/database';
import { Bot } from '@/entities/Bot';
import { User } from '@/entities/User';
import { BotAssignment } from '@/entities/BotAssignment';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botId, userId, action } = await request.json();

    if (!botId || !userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const botRepository = AppDataSource.getRepository(Bot);
    const userRepository = AppDataSource.getRepository(User);
    const assignmentRepository = AppDataSource.getRepository(BotAssignment);

    // First, get the current user to find their ID
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser || currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // Verify bot belongs to this manager
    const bot = await botRepository.findOne({
      where: {
        id: botId,
        createdBy: currentUser.id
      }
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found or access denied' }, { status: 404 });
    }

    // Verify user was invited by this manager
    const user = await userRepository.findOne({
      where: {
        id: userId,
        invitedBy: currentUser.id
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found or access denied' }, { status: 404 });
    }

    if (action === 'assign') {
      // Check if assignment already exists
      const existingAssignment = await assignmentRepository.findOne({
        where: {
          bot: { id: botId },
          user: { id: userId }
        }
      });

      if (existingAssignment) {
        return NextResponse.json({ error: 'User is already assigned to this bot' }, { status: 400 });
      }

      // Create new assignment
      const assignment = assignmentRepository.create({
        bot: { id: botId },
        user: { id: userId },
        assignedBy: currentUser.id
      });

      await assignmentRepository.save(assignment);

      return NextResponse.json({ message: 'User assigned successfully' });

    } else if (action === 'unassign') {
      // Remove assignment
      const assignment = await assignmentRepository.findOne({
        where: {
          bot: { id: botId },
          user: { id: userId }
        }
      });

      if (assignment) {
        await assignmentRepository.remove(assignment);
      }

      return NextResponse.json({ message: 'User unassigned successfully' });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error managing user assignment:', error);
    return NextResponse.json(
      { error: 'Failed to manage user assignment' },
      { status: 500 }
    );
  }
}
