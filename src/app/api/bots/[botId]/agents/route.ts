import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { BotAssignment } from '@/entities/BotAssignment';

/**
 * GET /api/bots/[botId]/agents
 * Fetch all agents assigned to a specific bot
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botId } = await params;

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const assignmentRepository = AppDataSource.getRepository(BotAssignment);

    // Get all active assignments for this bot with user details
    const assignments = await assignmentRepository.find({
      where: {
        botId: botId,
        status: 'active'
      },
      relations: ['user']
    });

    // Format the response to return agent details
    const agents = assignments
      .filter(assignment => assignment.user)
      .map(assignment => ({
        id: assignment.user!.id,
        email: assignment.user!.email,
        firstName: assignment.user!.firstName,
        lastName: assignment.user!.lastName,
        name: assignment.user!.firstName && assignment.user!.lastName
          ? `${assignment.user!.firstName} ${assignment.user!.lastName}`
          : assignment.user!.email.split('@')[0],
        role: assignment.user!.role,
        assignedAt: assignment.assignedAt
      }));

    return NextResponse.json({
      success: true,
      botId,
      agents,
      total: agents.length
    });

  } catch (error) {
    console.error('Error fetching bot agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
