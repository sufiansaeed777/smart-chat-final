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

    // Get user from database and check if they're a manager
    const userRepository = AppDataSource.getRepository("users");
    const user = await userRepository.findOne({ 
      where: { email: session.user.email } 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has manager role
    if (user.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // Get all issues
    const issueRepository = AppDataSource.getRepository("chatbot_issues");
    const issues = await issueRepository.find({
      order: { createdAt: 'DESC' }
    });

    // Format issues for frontend
    const formattedIssues = issues.map(issue => ({
      id: issue.id,
      type: issue.type,
      userId: issue.userId,
      userEmail: issue.userEmail,
      userName: issue.userName,
      message: issue.message,
      status: issue.status,
      priority: issue.priority,
      assignedTo: issue.assignedTo,
      notes: issue.notes,
      response: issue.response,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString()
    }));

    return NextResponse.json({ 
      success: true,
      issues: formattedIssues 
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching manager issues:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
