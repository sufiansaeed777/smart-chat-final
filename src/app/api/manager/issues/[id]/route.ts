import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { ChatbotIssue } from '@/entities/ChatbotIssue';
import { User } from '@/entities/User';

export async function PATCH(
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

    const body = await request.json();
    const { status, notes, response, assignedTo } = body;

    // Get the issue
    const issueRepository = AppDataSource.getRepository("chatbot_issues");
    const issue = await issueRepository.findOne({
      where: { id: params.id }
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Update the issue
    if (status) issue.status = status;
    if (notes !== undefined) issue.notes = notes;
    if (response !== undefined) issue.response = response;
    if (assignedTo !== undefined) issue.assignedTo = assignedTo;

    const updatedIssue = await issueRepository.save(issue);

    return NextResponse.json({ 
      success: true,
      issue: {
        id: updatedIssue.id,
        type: updatedIssue.type,
        userId: updatedIssue.userId,
        userEmail: updatedIssue.userEmail,
        userName: updatedIssue.userName,
        message: updatedIssue.message,
        status: updatedIssue.status,
        priority: updatedIssue.priority,
        assignedTo: updatedIssue.assignedTo,
        notes: updatedIssue.notes,
        response: updatedIssue.response,
        createdAt: updatedIssue.createdAt.toISOString(),
        updatedAt: updatedIssue.updatedAt.toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

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

    // Get the specific issue
    const issueRepository = AppDataSource.getRepository("chatbot_issues");
    const issue = await issueRepository.findOne({
      where: { id: params.id }
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      issue: {
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
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching issue:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
