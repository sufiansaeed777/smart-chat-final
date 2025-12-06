import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { BotAssignment } from '@/entities/BotAssignment';
import { Conversation } from '@/entities/Conversation';
import { ChatbotIssue } from '@/entities/ChatbotIssue';
import { In } from 'typeorm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get botId query parameter if provided
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    // We'll check the role from the database instead of session

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // First, get the current user to find their ID and verify role
    const userRepository = AppDataSource.getRepository("users");
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    if (currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // If botId is provided, fetch only agents assigned to that bot
    if (botId) {
      const botAssignmentRepository = AppDataSource.getRepository(BotAssignment);

      // Get all active bot assignments for this bot
      const assignments = await botAssignmentRepository
        .createQueryBuilder('assignment')
        .leftJoinAndSelect('assignment.user', 'user')
        .where('assignment.botId = :botId', { botId })
        .andWhere('assignment.status = :status', { status: 'active' })
        .andWhere('user.invitedBy = :managerId', { managerId: currentUser.id })
        .select([
          'assignment.id',
          'user.id',
          'user.firstName',
          'user.lastName',
          'user.email',
          'user.role',
          'user.password',
          'user.lastLoginAt',
          'user.createdAt'
        ])
        .getMany();

      const usersWithStatus = assignments.map(assignment => {
        const user = assignment.user;
        if (!user) return null;

        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        return {
          id: user.id,
          name: fullName || (user.email ? user.email.split('@')[0] : 'Unknown User'),
          email: user.email,
          role: user.role,
          status: user.password ? 'accepted' : 'pending',
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        };
      }).filter(Boolean); // Remove null entries

      return NextResponse.json({ users: usersWithStatus });
    }

    // Fetch all users invited by this manager (both accepted and pending)
    const invitedUsers = await userRepository
      .createQueryBuilder('user')
      .where('user.invitedBy = :managerId', { managerId: currentUser.id })
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.role',
        'user.password',
        'user.lastLoginAt',
        'user.createdAt'
      ])
      .getMany();

    // Fetch bot assignments for all users
    const botAssignmentRepository = AppDataSource.getRepository(BotAssignment);
    const userIds = invitedUsers.map(u => u.id);

    let assignmentsWithBots: BotAssignment[] = [];
    if (userIds.length > 0) {
      assignmentsWithBots = await botAssignmentRepository
        .createQueryBuilder('assignment')
        .leftJoinAndSelect('assignment.bot', 'bot')
        .where('assignment.userId IN (:...userIds)', { userIds })
        .andWhere('assignment.status = :status', { status: 'active' })
        .getMany();
    }

    // Group assignments by userId
    const userBotAssignments: Record<string, Array<{ botId: string; botName: string }>> = {};
    assignmentsWithBots.forEach(assignment => {
      if (!userBotAssignments[assignment.userId]) {
        userBotAssignments[assignment.userId] = [];
      }
      userBotAssignments[assignment.userId].push({
        botId: assignment.botId,
        botName: assignment.bot?.name || 'Unknown Bot'
      });
    });

    // Get manager's bot IDs for querying conversations and issues
    const botRepository = AppDataSource.getRepository("bots");
    const managerBots = await botRepository.find({
      where: { createdBy: currentUser.id },
      select: ['id']
    });
    const managerBotIds = managerBots.map((b: { id: string }) => b.id);

    // Get REAL stats for each user
    const conversationRepository = AppDataSource.getRepository(Conversation);
    const issueRepository = AppDataSource.getRepository(ChatbotIssue);

    // Count conversations handled by each user (as assigned agent)
    const userChatCounts: Record<string, number> = {};
    if (userIds.length > 0 && managerBotIds.length > 0) {
      const chatCounts = await conversationRepository
        .createQueryBuilder('conversation')
        .select('conversation.assignedAgentId', 'agentId')
        .addSelect('COUNT(DISTINCT conversation.sessionId)', 'count')
        .where('conversation.assignedAgentId IN (:...userIds)', { userIds })
        .andWhere('conversation.botId IN (:...botIds)', { botIds: managerBotIds })
        .groupBy('conversation.assignedAgentId')
        .getRawMany();

      chatCounts.forEach(item => {
        userChatCounts[item.agentId] = parseInt(item.count) || 0;
      });
    }

    // Count issues resolved by each user
    const userIssueCounts: Record<string, number> = {};
    if (userIds.length > 0 && managerBotIds.length > 0) {
      const issueCounts = await issueRepository
        .createQueryBuilder('issue')
        .select('issue.resolvedBy', 'resolvedBy')
        .addSelect('COUNT(*)', 'count')
        .where('issue.resolvedBy IN (:...userIds)', { userIds })
        .andWhere('issue.botId IN (:...botIds)', { botIds: managerBotIds })
        .andWhere('issue.status = :status', { status: 'resolved' })
        .groupBy('issue.resolvedBy')
        .getRawMany();

      issueCounts.forEach(item => {
        if (item.resolvedBy) {
          userIssueCounts[item.resolvedBy] = parseInt(item.count) || 0;
        }
      });
    }

    // Transform the data to include status based on whether they have a password
    const usersWithStatus = invitedUsers.map(user => {
      // Properly handle undefined/null values
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return {
        id: user.id,
        name: fullName || (user.email ? user.email.split('@')[0] : 'Unknown User'), // Safely handle null email
        email: user.email,
        role: user.role,
        status: user.password ? 'accepted' : 'pending', // accepted if they have password, pending if not
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        assignedBots: userBotAssignments[user.id] || [],
        // REAL stats from database
        totalChats: userChatCounts[user.id] || 0,
        issuesHandled: userIssueCounts[user.id] || 0,
        botsAssigned: (userBotAssignments[user.id] || []).length
      };
    });

    // Also create a grouped-by-bot view
    const botGroups: Record<string, { botId: string; botName: string; members: typeof usersWithStatus }> = {};

    usersWithStatus.forEach(user => {
      if (user.assignedBots.length === 0) {
        // Users with no bot assignments go to "Unassigned" group
        if (!botGroups['unassigned']) {
          botGroups['unassigned'] = { botId: 'unassigned', botName: 'Unassigned', members: [] };
        }
        botGroups['unassigned'].members.push(user);
      } else {
        user.assignedBots.forEach(bot => {
          if (!botGroups[bot.botId]) {
            botGroups[bot.botId] = { botId: bot.botId, botName: bot.botName, members: [] };
          }
          botGroups[bot.botId].members.push(user);
        });
      }
    });

    return NextResponse.json({
      users: usersWithStatus,
      botGroups: Object.values(botGroups)
    });

  } catch (error) {
    console.error('Error fetching manager users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
