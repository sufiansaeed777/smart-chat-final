import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { ChatbotIssue } from '@/entities/ChatbotIssue';
import { User } from '@/entities/User';

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

    // Get user's issues
    const issueRepository = AppDataSource.getRepository("chatbot_issues");
    const issues = await issueRepository.find({
      where: { 
        userId: user.id,
        type: 'issue_report'
      },
      order: { createdAt: 'DESC' }
    });

    // Format issues for frontend
    const formattedIssues = issues.map(issue => ({
      id: issue.id,
      type: issue.type === 'issue_report' ? 'Issue Report' : issue.type,
      description: issue.message,
      status: issue.status,
      createdAt: issue.createdAt.toISOString(),
      priority: issue.priority,
      assignedTo: issue.assignedTo,
      notes: issue.notes,
      response: issue.response
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
