import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository('users');
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const issueRepository = AppDataSource.getRepository('chatbot_issues');

    // Count issues by status
    const totalIssues = await issueRepository.count({
      where: { userId: user.id, type: 'issue_report' }
    });

    const resolvedIssues = await issueRepository.count({
      where: { userId: user.id, type: 'issue_report', status: 'resolved' }
    });

    const pendingIssues = await issueRepository.count({
      where: { userId: user.id, type: 'issue_report', status: 'pending' }
    });

    return NextResponse.json({
      total: totalIssues,
      resolved: resolvedIssues,
      pending: pendingIssues
    });

  } catch (error) {
    console.error('Error fetching issue stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
