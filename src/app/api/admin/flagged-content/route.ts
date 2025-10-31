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

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const conversationRepository = AppDataSource.getRepository('conversations');

    // Build query based on status filter
    const queryBuilder = conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.bot', 'bot')
      .leftJoinAndSelect('conversation.user', 'user')
      .where('conversation.isFlagged = :isFlagged', { isFlagged: true });

    if (status && status !== 'all') {
      queryBuilder.andWhere('conversation.reviewStatus = :status', { status });
    }

    const [flaggedConversations, total] = await queryBuilder
      .orderBy('conversation.flaggedAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    // Get flagged by user details
    const flaggedByIds = flaggedConversations
      .map(conv => conv.flaggedBy)
      .filter(Boolean);

    const flaggedByUsers = flaggedByIds.length > 0
      ? await userRepository
          .createQueryBuilder('user')
          .where('user.id IN (:...ids)', { ids: flaggedByIds })
          .select(['user.id', 'user.firstName', 'user.lastName', 'user.email'])
          .getMany()
      : [];

    const reviewedByIds = flaggedConversations
      .map(conv => conv.reviewedBy)
      .filter(Boolean);

    const reviewedByUsers = reviewedByIds.length > 0
      ? await userRepository
          .createQueryBuilder('user')
          .where('user.id IN (:...ids)', { ids: reviewedByIds })
          .select(['user.id', 'user.firstName', 'user.lastName', 'user.email'])
          .getMany()
      : [];

    const flaggedContent = flaggedConversations.map(conv => {
      const flaggedByUser = flaggedByUsers.find(u => u.id === conv.flaggedBy);
      const reviewedByUser = reviewedByUsers.find(u => u.id === conv.reviewedBy);

      return {
        id: conv.id,
        botName: conv.bot?.name || 'Unknown Bot',
        botId: conv.botId,
        userName: conv.user
          ? `${conv.user.firstName || ''} ${conv.user.lastName || ''}`.trim() || conv.user.email
          : 'Unknown User',
        userId: conv.userId,
        flagReason: conv.flagReason,
        flaggedBy: flaggedByUser
          ? `${flaggedByUser.firstName || ''} ${flaggedByUser.lastName || ''}`.trim() || flaggedByUser.email
          : 'Unknown',
        flaggedAt: conv.flaggedAt,
        reviewStatus: conv.reviewStatus,
        reviewedBy: reviewedByUser
          ? `${reviewedByUser.firstName || ''} ${reviewedByUser.lastName || ''}`.trim() || reviewedByUser.email
          : null,
        reviewedAt: conv.reviewedAt,
        reviewNotes: conv.reviewNotes,
        messageCount: Array.isArray(conv.messages) ? conv.messages.length : 0,
        messages: conv.messages || [],
        createdAt: conv.createdAt
      };
    });

    // Get counts by status
    const pendingCount = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.isFlagged = :isFlagged', { isFlagged: true })
      .andWhere('conversation.reviewStatus = :status', { status: 'pending' })
      .getCount();

    const approvedCount = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.isFlagged = :isFlagged', { isFlagged: true })
      .andWhere('conversation.reviewStatus = :status', { status: 'approved' })
      .getCount();

    const rejectedCount = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.isFlagged = :isFlagged', { isFlagged: true })
      .andWhere('conversation.reviewStatus = :status', { status: 'rejected' })
      .getCount();

    const resolvedCount = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.isFlagged = :isFlagged', { isFlagged: true })
      .andWhere('conversation.reviewStatus = :status', { status: 'resolved' })
      .getCount();

    return NextResponse.json({
      success: true,
      flaggedContent,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        resolved: resolvedCount,
        total: pendingCount + approvedCount + rejectedCount + resolvedCount
      }
    });

  } catch (error) {
    console.error('Error fetching flagged content:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
