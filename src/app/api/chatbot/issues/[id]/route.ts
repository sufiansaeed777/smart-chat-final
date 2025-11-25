import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { ChatbotIssue } from '@/entities/ChatbotIssue';

/**
 * PATCH /api/chatbot/issues/[id]
 * Update a chatbot issue (status, assignedTo, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, assignedTo, notes, response, priority } = body;

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const issueRepository = AppDataSource.getRepository(ChatbotIssue);

    const issue = await issueRepository.findOne({
      where: { id }
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Update fields if provided
    if (status) issue.status = status;
    if (assignedTo !== undefined) issue.assignedTo = assignedTo;
    if (notes !== undefined) issue.notes = notes;
    if (response !== undefined) issue.response = response;
    if (priority) issue.priority = priority;

    const updatedIssue = await issueRepository.save(issue);

    return NextResponse.json({
      success: true,
      issue: updatedIssue
    });

  } catch (error) {
    console.error('Error updating chatbot issue:', error);
    return NextResponse.json(
      { error: 'Failed to update issue' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chatbot/issues/[id]
 * Delete a chatbot issue
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if ((session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const issueRepository = AppDataSource.getRepository(ChatbotIssue);

    const issue = await issueRepository.findOne({
      where: { id }
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    await issueRepository.remove(issue);

    return NextResponse.json({
      success: true,
      message: 'Issue deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting chatbot issue:', error);
    return NextResponse.json(
      { error: 'Failed to delete issue' },
      { status: 500 }
    );
  }
}
