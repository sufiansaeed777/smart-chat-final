import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { issueId, resolution, notes } = await request.json();

    if (!issueId) {
      return NextResponse.json({ error: 'Issue ID is required' }, { status: 400 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const issuesRepository = AppDataSource.getRepository('chatbot_issues');

    const issue = await issuesRepository.findOne({ where: { id: issueId } });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Update issue with resolution
    issue.status = 'resolved';
    issue.resolution = resolution || 'Resolved by admin';
    issue.resolvedAt = new Date();
    issue.resolvedBy = session.user.email;
    if (notes) {
      issue.notes = notes;
    }

    await issuesRepository.save(issue);

    return NextResponse.json({
      success: true,
      message: 'Issue resolved successfully',
      issue: {
        id: issue.id,
        status: issue.status,
        resolvedAt: issue.resolvedAt,
        resolvedBy: issue.resolvedBy
      }
    });

  } catch (error) {
    console.error('Error resolving issue:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
