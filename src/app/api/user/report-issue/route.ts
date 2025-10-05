import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { ChatbotIssue } from '@/entities/ChatbotIssue';
import { User } from '@/entities/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { issueType, description, priority = 'medium' } = body;

    if (!issueType || !description) {
      return NextResponse.json({ 
        error: 'Issue type and description are required' 
      }, { status: 400 });
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

    // Create new issue
    const issueRepository = AppDataSource.getRepository("chatbot_issues");
    
    const newIssue = issueRepository.create({
      type: 'issue_report',
      userId: user.id,
      userEmail: user.email,
      userName: user.fullName || user.email.split('@')[0],
      message: `${issueType}: ${description}`,
      priority: priority as 'low' | 'medium' | 'high' | 'urgent',
      status: 'pending'
    });

    const savedIssue = await issueRepository.save(newIssue);

    return NextResponse.json({ 
      success: true,
      issue: savedIssue,
      message: 'Issue reported successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user issue report:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
