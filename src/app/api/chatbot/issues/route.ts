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

    const issueRepository = AppDataSource.getRepository(ChatbotIssue);
    const issues = await issueRepository.find({
      relations: ['bot'],
      order: { createdAt: 'DESC' }
    });

    // Format response to include bot info
    const formattedIssues = issues.map(issue => ({
      ...issue,
      botId: issue.botId,
      botName: issue.bot?.name || null
    }));

    return NextResponse.json({ issues: formattedIssues });
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

    // Validate required fields
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Use defaults for optional fields
    const issueType = type || 'issue_report';
    const issueUserId = userId || 'anonymous';
    const issueUserEmail = userEmail || 'unknown@example.com';
    const issueUserName = userName || 'Anonymous User';

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const issueRepository = AppDataSource.getRepository(ChatbotIssue);

    // Validate botId if provided - check if it's a valid UUID and exists
    let validBotId: string | null = null;
    if (botId && typeof botId === 'string' && botId.length > 0) {
      // Check if it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(botId)) {
        // Optionally verify bot exists (commented out to avoid extra query)
        // const botRepository = AppDataSource.getRepository('bots');
        // const botExists = await botRepository.findOne({ where: { id: botId } });
        // if (botExists) validBotId = botId;
        validBotId = botId;
      }
    }

    const newIssue = issueRepository.create({
      type: issueType,
      userId: issueUserId,
      userEmail: issueUserEmail,
      userName: issueUserName,
      message: message.trim(),
      priority: priority || 'medium',
      status: 'pending',
      botId: validBotId
    });

    const savedIssue = await issueRepository.save(newIssue);

    console.log('Issue created successfully:', savedIssue.id);

    return NextResponse.json({
      success: true,
      issue: savedIssue
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating chatbot issue:', error);

    // Provide more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      error: 'Failed to create issue',
      details: errorMessage
    }, { status: 500 });
  }
}
