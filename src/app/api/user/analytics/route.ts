import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { BotAssignment } from '@/entities/BotAssignment';
import { Conversation } from '@/entities/Conversation';

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

    // Get user from database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ 
      where: { email: session.user.email } 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get bot assignments for this user
    const assignmentRepository = AppDataSource.getRepository(BotAssignment);
    const assignments = await assignmentRepository.find({
      where: { 
        userId: user.id,
        status: 'active'
      },
      relations: ['bot']
    });

    const botIds = assignments.map(assignment => assignment.bot?.id).filter(Boolean);

    // Get conversation statistics
    const conversationRepository = AppDataSource.getRepository(Conversation);
    
    // Total conversations for assigned bots
    const totalConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId IN (:...botIds)', { botIds })
      .andWhere('conversation.userId = :userId', { userId: user.id })
      .getCount();

    // Recent conversations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId IN (:...botIds)', { botIds })
      .andWhere('conversation.userId = :userId', { userId: user.id })
      .andWhere('conversation.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .getCount();

    // Active conversations (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const activeConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId IN (:...botIds)', { botIds })
      .andWhere('conversation.userId = :userId', { userId: user.id })
      .andWhere('conversation.createdAt >= :oneDayAgo', { oneDayAgo })
      .getCount();

    // Calculate average response time from actual conversation data
    let avgResponseTime = '0 min';
    if (totalConversations > 0) {
      const conversationsWithMessages = await conversationRepository
        .createQueryBuilder('conversation')
        .where('conversation.botId IN (:...botIds)', { botIds })
        .andWhere('conversation.userId = :userId', { userId: user.id })
        .select('conversation.id')
        .addSelect('conversation.createdAt')
        .addSelect('conversation.lastMessageAt')
        .getMany();

      const validConversations = conversationsWithMessages.filter(c => c.lastMessageAt);
      if (validConversations.length > 0) {
        const totalResponseTimeMs = validConversations.reduce((acc, conv) => {
          const responseTime = new Date(conv.lastMessageAt!).getTime() - new Date(conv.createdAt).getTime();
          return acc + responseTime;
        }, 0);

        const avgMs = totalResponseTimeMs / validConversations.length;
        const avgMinutes = Math.round(avgMs / (1000 * 60) * 10) / 10;
        avgResponseTime = `${avgMinutes} min`;
      }
    }

    // Get recent activity
    const recentActivity = await conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.bot', 'bot')
      .where('conversation.botId IN (:...botIds)', { botIds })
      .andWhere('conversation.userId = :userId', { userId: user.id })
      .orderBy('conversation.createdAt', 'DESC')
      .limit(5)
      .getMany();

    const formattedActivity = recentActivity.map(conv => ({
      id: conv.id,
      type: 'conversation',
      bot: conv.bot?.name || 'Unknown Bot',
      time: conv.createdAt.toISOString(),
      status: conv.isTestMessage ? 'test' : 'active'
    }));

    return NextResponse.json({
      stats: {
        assignedBots: assignments.length,
        totalConversations,
        recentConversations,
        activeConversations,
        avgResponseTime
      },
      recentActivity: formattedActivity
    });

  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
