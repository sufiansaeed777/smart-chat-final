import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { BotAssignment } from '@/entities/BotAssignment';
import { User } from '@/entities/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const assignmentRepository = AppDataSource.getRepository("bot_assignments");
    const userRepository = AppDataSource.getRepository("users");

    // First, get the current user to verify they're a manager
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser || currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // Fetch assignments for the specific bot
    const assignments = await assignmentRepository.find({
      where: {
        bot: { id: botId }
      },
      relations: ['user', 'bot'],
      select: {
        id: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          password: true
        },
        bot: {
          id: true,
          name: true
        },
        assignedAt: true
      }
    });

    // Transform the data
    const assignmentsWithStatus = assignments.map(assignment => {
      let fullName = '';
      if (assignment.user) {
        // Properly handle undefined/null values
        const firstName = assignment.user.firstName || '';
        const lastName = assignment.user.lastName || '';
        fullName = `${firstName} ${lastName}`.trim();
      }
      return {
        id: assignment.id,
        userId: assignment.user?.id || '',
        userName: fullName || assignment.user?.email?.split('@')[0] || 'Unknown User', // Fallback to email username or 'Unknown User'
        userEmail: assignment.user?.email || '',
        userRole: assignment.user?.role || '',
        userStatus: assignment.user?.password ? 'active' : 'pending',
        botId: assignment.bot?.id || '',
        botName: assignment.bot?.name || '',
        assignedAt: assignment.assignedAt
      };
    });

    return NextResponse.json({ assignments: assignmentsWithStatus });

  } catch (error) {
    console.error('Error fetching bot assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bot assignments' },
      { status: 500 }
    );
  }
}
