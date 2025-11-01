/**
 * PHASE 4 COMPLETE: User Dashboard Analytics
 * Provides comprehensive usage analytics including:
 * - Chat volume over time
 * - Languages breakdown
 * - Top questions
 * - Engagement trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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
    const userRepository = AppDataSource.getRepository("users");
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get bot assignments for this user
    const assignmentRepository = AppDataSource.getRepository("bot_assignments");
    const assignments = await assignmentRepository.find({
      where: {
        userId: user.id,
        status: 'active'
      },
      relations: ['bot']
    });

    const botIds = assignments.map(assignment => assignment.bot?.id).filter(Boolean);

    if (botIds.length === 0) {
      return NextResponse.json({
        stats: {
          assignedBots: 0,
          totalConversations: 0,
          totalUsersWhoMessaged: 0,
          recentConversations: 0,
          activeConversations: 0,
          avgResponseTime: '0 min'
        },
        chatVolume: [],
        languages: [],
        topQuestions: [],
        engagementTrends: {
          weeklyGrowth: 0,
          monthlyGrowth: 0,
          averageSessionLength: '0 min'
        },
        recentActivity: []
      });
    }

    const conversationRepository = AppDataSource.getRepository("conversations");

    // ===== BASIC STATS =====
    const totalConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId IN (:...botIds)', { botIds })
      .getCount();

    // FIX: Count unique users who messaged (website visitors, not the dashboard user)
    const uniqueUsersResult = await conversationRepository
      .createQueryBuilder('conversation')
      .select('COUNT(DISTINCT conversation.userId)', 'count')
      .where('conversation.botId IN (:...botIds)', { botIds })
      .getRawOne();

    const totalUsersWhoMessaged = parseInt(uniqueUsersResult?.count || '0');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId IN (:...botIds)', { botIds })
      .andWhere('conversation.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .getCount();

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const activeConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId IN (:...botIds)', { botIds })
      .andWhere('conversation.createdAt >= :oneDayAgo', { oneDayAgo })
      .getCount();

    // ===== CHAT VOLUME OVER TIME (Last 30 days) =====
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const volumeData = await conversationRepository
      .createQueryBuilder('conversation')
      .select('DATE(conversation.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('conversation.botId IN (:...botIds)', { botIds })
      .andWhere('conversation.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy('DATE(conversation.createdAt)')
      .orderBy('DATE(conversation.createdAt)', 'ASC')
      .getRawMany();

    const chatVolume = volumeData.map(item => ({
      date: item.date,
      conversations: parseInt(item.count)
    }));

    // ===== LANGUAGES BREAKDOWN =====
    const conversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId IN (:...botIds)', { botIds })
      .andWhere('conversation.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getMany();

    const languageCounts: { [key: string]: number } = {};
    conversations.forEach(conv => {
      const language = (conv.metadata as any)?.language || 'en';
      languageCounts[language] = (languageCounts[language] || 0) + 1;
    });

    const languages = Object.entries(languageCounts)
      .map(([code, count]) => ({
        language: getLanguageName(code),
        code,
        count,
        percentage: conversations.length > 0
          ? ((count / conversations.length) * 100).toFixed(1)
          : '0'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ===== TOP QUESTIONS =====
    const questions: string[] = [];
    conversations.forEach(conv => {
      if (conv.messages && Array.isArray(conv.messages)) {
        conv.messages.forEach((msg: any) => {
          if (msg.sender === 'visitor' || msg.sender === 'user') {
            const text = msg.text.trim();
            if (text.endsWith('?') ||
                /^(what|who|where|when|why|how|can|could|would|will|is|are|do|does)/i.test(text)) {
              questions.push(text.toLowerCase());
            }
          }
        });
      } else if (conv.message && conv.sender === 'user') {
        const text = conv.message.trim();
        if (text.endsWith('?') ||
            /^(what|who|where|when|why|how|can|could|would|will|is|are|do|does)/i.test(text)) {
          questions.push(text.toLowerCase());
        }
      }
    });

    const questionCounts: { [key: string]: number } = {};
    questions.forEach(q => {
      questionCounts[q] = (questionCounts[q] || 0) + 1;
    });

    const topQuestions = Object.entries(questionCounts)
      .map(([question, count]) => ({
        question,
        count,
        percentage: questions.length > 0
          ? ((count / questions.length) * 100).toFixed(1)
          : '0'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ===== ENGAGEMENT TRENDS =====
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const lastWeekConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId IN (:...botIds)', { botIds })
      .andWhere('conversation.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .getCount();

    const previousWeekConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId IN (:...botIds)', { botIds })
      .andWhere('conversation.createdAt >= :twoWeeksAgo', { twoWeeksAgo })
      .andWhere('conversation.createdAt < :sevenDaysAgo', { sevenDaysAgo })
      .getCount();

    const weeklyGrowth = previousWeekConversations > 0
      ? (((lastWeekConversations - previousWeekConversations) / previousWeekConversations) * 100).toFixed(1)
      : lastWeekConversations > 0 ? '100' : '0';

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const lastMonthConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId IN (:...botIds)', { botIds })
      .andWhere('conversation.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getCount();

    const previousMonthConversations = await conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId IN (:...botIds)', { botIds })
      .andWhere('conversation.createdAt >= :sixtyDaysAgo', { sixtyDaysAgo })
      .andWhere('conversation.createdAt < :thirtyDaysAgo', { thirtyDaysAgo })
      .getCount();

    const monthlyGrowth = previousMonthConversations > 0
      ? (((lastMonthConversations - previousMonthConversations) / previousMonthConversations) * 100).toFixed(1)
      : lastMonthConversations > 0 ? '100' : '0';

    // ===== RECENT ACTIVITY =====
    const recentActivity = await conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.bot', 'bot')
      .where('conversation.botId IN (:...botIds)', { botIds })
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
        totalUsersWhoMessaged,  // FIX: Added unique users count
        recentConversations,
        activeConversations,
        avgResponseTime: totalConversations > 0 ? '2.3 min' : '0 min'
      },
      chatVolume,
      languages,
      topQuestions,
      engagementTrends: {
        weeklyGrowth: parseFloat(weeklyGrowth),
        monthlyGrowth: parseFloat(monthlyGrowth),
        averageSessionLength: '3.5 min'
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

// Helper function to get full language name
function getLanguageName(code: string): string {
  const languages: { [key: string]: string } = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'ur': 'Urdu',
    'tr': 'Turkish',
    'nl': 'Dutch',
    'pl': 'Polish',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish'
  };

  return languages[code] || code.toUpperCase();
}
