import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { ChatbotIssue } from '@/entities/ChatbotIssue';
import { User } from '@/entities/User';
import { In } from 'typeorm';

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
    const userRepository = AppDataSource.getRepository("users");
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's assigned bots
    const assignmentRepository = AppDataSource.getRepository("bot_assignments");
    const assignments = await assignmentRepository.find({
      where: {
        userId: user.id,
        status: 'active'
      },
      relations: ['bot']
    });

    const assignedBotIds = assignments
      .map(assignment => assignment.bot?.id)
      .filter(Boolean);

    // Get issues related to assigned bots (or created by the user)
    const issueRepository = AppDataSource.getRepository("chatbot_issues");

    let issues: any[] = [];

    if (assignedBotIds.length > 0) {
      // Get issues for assigned bots
      issues = await issueRepository.find({
        where: [
          { botId: In(assignedBotIds) },
          { userId: user.id }
        ],
        order: { createdAt: 'DESC' }
      });
    } else {
      // Fallback: get user's own issues
      issues = await issueRepository.find({
        where: { userId: user.id },
        order: { createdAt: 'DESC' }
      });
    }

    // Format issues for frontend
    const formattedIssues = issues.map(issue => ({
      id: issue.id,
      type: issue.type,
      userId: issue.userId || user.id,
      userEmail: issue.userEmail || user.email,
      userName: issue.userName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
      message: issue.message,
      status: issue.status,
      priority: issue.priority,
      assignedTo: issue.assignedTo,
      notes: issue.notes,
      response: issue.response,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt ? issue.updatedAt.toISOString() : issue.createdAt.toISOString()
    }));

    return NextResponse.json({ 
      issues: formattedIssues,
      stats: {
        total: issues.length,
        pending: issues.filter(i => i.status === 'pending').length,
        inProgress: issues.filter(i => i.status === 'in_progress').length,
        resolved: issues.filter(i => i.status === 'resolved').length,
        closed: issues.filter(i => i.status === 'closed').length
      }
    });

  } catch (error) {
    console.error('Error fetching user issues:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
