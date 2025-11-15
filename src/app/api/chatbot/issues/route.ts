import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { ChatbotIssue } from '@/entities/ChatbotIssue';

// GET - Fetch all chatbot issues
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if ((session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const issueRepository = AppDataSource.getRepository("chatbot_issues");
    const issues = await issueRepository.find({
      order: { createdAt: 'DESC' }
    });

    return NextResponse.json({ issues });
  } catch (error) {
    console.error('Error fetching chatbot issues:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new chatbot issue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userId, userEmail, userName, message, priority = 'medium', botId } = body;

    if (!type || !userId || !userEmail || !userName || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const issueRepository = AppDataSource.getRepository("chatbot_issues");

    const newIssue = issueRepository.create({
      type,
      userId,
      userEmail,
      userName,
      message,
      priority,
      status: 'pending',
      botId: botId || null
    });

    const savedIssue = await issueRepository.save(newIssue);

    return NextResponse.json({ issue: savedIssue }, { status: 201 });
  } catch (error) {
    console.error('Error creating chatbot issue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
