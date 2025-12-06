import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Conversation } from '@/entities/Conversation';
import { Bot } from '@/entities/Bot';
import { ChatbotIssue } from '@/entities/ChatbotIssue';

/**
 * Manager Dashboard Analytics API
 * GET /api/manager/analytics
 *
 * Query Parameters:
 * - period: '7d' | '30d' | '90d' | '1y' | 'lifetime' | 'custom'
 * - startDate: ISO date string (for custom period)
 * - endDate: ISO date string (for custom period)
 * - botId: UUID (optional, filter by specific bot)
 * - type: 'overview' | 'languages' | 'topQuestions' | 'messageTrends' | 'botwise' | 'issues'
 */
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

    // Get manager from database
    const userRepository = AppDataSource.getRepository(User);
    const manager = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!manager || manager.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const period = searchParams.get('period') || '7d';
    const botId = searchParams.get('botId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Calculate date range
    const { startDate, endDate } = getDateRange(period, startDateParam, endDateParam);

    // Get manager's bots
    const botRepository = AppDataSource.getRepository(Bot);
    const managerBots = await botRepository.find({
      where: { createdBy: manager.id }
    });

    const botIds = managerBots.map(b => b.id);

    if (botIds.length === 0) {
      return NextResponse.json(getEmptyResponse(type));
    }

    const conversationRepository = AppDataSource.getRepository(Conversation);
    const issueRepository = AppDataSource.getRepository(ChatbotIssue);

    // Build base query for conversations
    const buildConversationQuery = () => {
      let qb = conversationRepository
        .createQueryBuilder('conversation')
        .where('conversation.botId IN (:...botIds)', { botIds });

      if (botId) {
        qb = qb.andWhere('conversation.botId = :botId', { botId });
      }

      if (period !== 'lifetime') {
        qb = qb.andWhere('conversation.createdAt >= :startDate', { startDate });
        qb = qb.andWhere('conversation.createdAt <= :endDate', { endDate });
      }

      return qb;
    };

    // Build base query for issues
    const buildIssueQuery = () => {
      let qb = issueRepository
        .createQueryBuilder('issue')
        .where('issue.botId IN (:...botIds)', { botIds });

      if (botId) {
        qb = qb.andWhere('issue.botId = :botId', { botId });
      }

      if (period !== 'lifetime') {
        qb = qb.andWhere('issue.createdAt >= :startDate', { startDate });
        qb = qb.andWhere('issue.createdAt <= :endDate', { endDate });
      }

      return qb;
    };

    // Handle different analytics types
    switch (type) {
      case 'overview':
        return await getOverviewAnalytics(
          buildConversationQuery,
          buildIssueQuery,
          managerBots,
          manager.id,
          userRepository
        );

      case 'languages':
        return await getLanguagesAnalytics(buildConversationQuery);

      case 'topQuestions':
        return await getTopQuestionsAnalytics(buildConversationQuery, managerBots);

      case 'messageTrends':
        return await getMessageTrendsAnalytics(buildConversationQuery, startDate, endDate, period);

      case 'botwise':
        return await getBotwiseAnalytics(
          conversationRepository,
          issueRepository,
          managerBots,
          startDate,
          endDate,
          period
        );

      case 'issues':
        return await getIssuesAnalytics(buildIssueQuery, managerBots);

      // Legacy support for old analytics types
      case 'humanMessages':
        const hmConversations = await buildConversationQuery().getMany();
        let humanMessageCount = 0;
        hmConversations.forEach(conv => {
          if (conv.messages && Array.isArray(conv.messages)) {
            conv.messages.forEach((msg: any) => {
              // Human messages = ONLY agent messages (after handoff)
              if (msg.sender === 'agent') {
                humanMessageCount++;
              }
            });
          }
        });
        return NextResponse.json({ type: 'humanMessages', total: humanMessageCount });

      case 'totalAgents':
        const invitedUsers = await userRepository
          .createQueryBuilder('user')
          .where('user.invitedBy = :managerId', { managerId: manager.id })
          .andWhere('user.password IS NOT NULL')
          .getCount();
        return NextResponse.json({ type: 'totalAgents', total: invitedUsers });

      case 'resolvedIssues':
        const resolvedCount = await buildIssueQuery()
          .andWhere('issue.status = :status', { status: 'resolved' })
          .getCount();
        return NextResponse.json({ type: 'resolvedIssues', total: resolvedCount });

      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper: Get date range based on period
function getDateRange(period: string, startDateParam: string | null, endDateParam: string | null) {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (period === 'custom' && startDateParam && endDateParam) {
    startDate = new Date(startDateParam);
    endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999);
  } else {
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'lifetime':
        startDate = new Date('2020-01-01');
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
}

// Helper: Get empty response for type
function getEmptyResponse(type: string) {
  switch (type) {
    case 'overview':
      return {
        aiMessages: 0,
        humanMessages: 0,
        issueReports: 0,
        csatRating: 0,
        avgResponseTime: 0,
        languagesUsed: 0,
        totalBots: 0,
        totalConversations: 0
      };
    case 'languages':
      return { total: 0, data: [] };
    case 'topQuestions':
      return { total: 0, data: [] };
    case 'messageTrends':
      return { data: [] };
    case 'botwise':
      return { bots: [] };
    case 'issues':
      return { total: 0, data: [] };
    default:
      return {};
  }
}

// Get overview analytics (stat cards data)
async function getOverviewAnalytics(
  buildConversationQuery: () => any,
  buildIssueQuery: () => any,
  managerBots: Bot[],
  managerId: string,
  userRepository: any
) {
  const conversations = await buildConversationQuery().getMany();
  const issues = await buildIssueQuery().getMany();

  // Count AI and Human Agent messages
  // AI Messages: Messages sent by 'bot' or 'ai' (includes Playground responses)
  // Human Messages: Messages sent by 'agent' ONLY (after human handoff)
  let aiMessages = 0;
  let humanAgentMessages = 0;
  let totalResponseTimes: number[] = [];
  const languagesSet = new Set<string>();

  conversations.forEach(conv => {
    if (conv.messages && Array.isArray(conv.messages)) {
      let lastVisitorTime: Date | null = null;
      let isInHumanMode = false;

      conv.messages.forEach((msg: any, index: number) => {
        // Track when conversation enters Human mode
        if (msg.type === 'notification' && msg.text?.includes("now talking to")) {
          if (msg.text.toLowerCase().includes("agent") || msg.text.toLowerCase().includes("human")) {
            isInHumanMode = true;
          } else if (msg.text.toLowerCase().includes("ai") || msg.text.toLowerCase().includes("bot")) {
            isInHumanMode = false;
          }
        }

        // Also check mode changes based on conversation mode
        if (conv.mode === 'Human') {
          isInHumanMode = true;
        }

        if (msg.sender === 'visitor' || msg.sender === 'user') {
          // Track visitor message time for response time calculation
          lastVisitorTime = parseTimestamp(msg.timestamp);
        } else if (msg.sender === 'bot' || msg.sender === 'ai' || msg.sender === 'assistant') {
          // AI Messages: bot, ai, or assistant (includes Playground)
          aiMessages++;
          // Calculate response time for AI responses
          if (lastVisitorTime) {
            const botResponseTime = parseTimestamp(msg.timestamp);
            if (botResponseTime && lastVisitorTime) {
              const responseTime = (botResponseTime.getTime() - lastVisitorTime.getTime()) / 1000;
              if (responseTime > 0 && responseTime < 300) { // Max 5 minutes
                totalResponseTimes.push(responseTime);
              }
            }
            lastVisitorTime = null;
          }
        } else if (msg.sender === 'agent') {
          // Human Agent Messages: ONLY count agent messages (after handoff)
          humanAgentMessages++;
          // Also calculate response time for agent responses
          if (lastVisitorTime) {
            const agentResponseTime = parseTimestamp(msg.timestamp);
            if (agentResponseTime && lastVisitorTime) {
              const responseTime = (agentResponseTime.getTime() - lastVisitorTime.getTime()) / 1000;
              if (responseTime > 0 && responseTime < 300) {
                totalResponseTimes.push(responseTime);
              }
            }
            lastVisitorTime = null;
          }
        }
      });
    }

    // Extract language
    const language = (conv.metadata as any)?.language || 'en';
    languagesSet.add(language);
  });

  // Calculate average response time
  const avgResponseTime = totalResponseTimes.length > 0
    ? totalResponseTimes.reduce((a, b) => a + b, 0) / totalResponseTimes.length
    : 0;

  // Calculate CSAT rating from conversations with ratings
  let totalRatings = 0;
  let ratingSum = 0;
  conversations.forEach(conv => {
    const rating = (conv.metadata as any)?.rating;
    if (rating && typeof rating === 'number') {
      totalRatings++;
      ratingSum += rating;
    }
  });
  const csatRating = totalRatings > 0 ? (ratingSum / totalRatings) : 0;

  // Count issue reports
  const issueReports = issues.filter(i => i.type === 'issue_report').length;

  return NextResponse.json({
    aiMessages,
    humanMessages: humanAgentMessages,
    issueReports,
    csatRating: Math.round(csatRating * 10) / 10,
    avgResponseTime: Math.round(avgResponseTime * 10) / 10,
    languagesUsed: languagesSet.size,
    totalBots: managerBots.length,
    totalConversations: conversations.length
  });
}

// Get languages analytics
async function getLanguagesAnalytics(buildConversationQuery: () => any) {
  const conversations = await buildConversationQuery().getMany();

  const languageCounts: { [key: string]: number } = {};

  conversations.forEach(conv => {
    const language = (conv.metadata as any)?.language || 'en';
    languageCounts[language] = (languageCounts[language] || 0) + 1;
  });

  const languageData = Object.entries(languageCounts)
    .map(([language, count]) => ({
      language: getLanguageName(language),
      code: language,
      count,
      percentage: conversations.length > 0
        ? ((count / conversations.length) * 100).toFixed(1)
        : '0'
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    type: 'languages',
    total: conversations.length,
    data: languageData
  });
}

// Get top questions analytics
async function getTopQuestionsAnalytics(buildConversationQuery: () => any, bots: Bot[]) {
  const conversations = await buildConversationQuery()
    .leftJoinAndSelect('conversation.bot', 'bot')
    .orderBy('conversation.createdAt', 'DESC')
    .limit(1000)
    .getMany();

  interface QuestionEntry {
    question: string;
    count: number;
    botId: string;
    botName: string;
    lastAsked: Date;
  }

  const questionMap = new Map<string, QuestionEntry>();

  conversations.forEach(conv => {
    const botName = bots.find(b => b.id === conv.botId)?.name || 'Unknown Bot';

    if (conv.messages && Array.isArray(conv.messages)) {
      conv.messages.forEach((msg: any) => {
        if (msg.sender === 'visitor' || msg.sender === 'user') {
          const text = msg.text.trim();
          if (text.endsWith('?') ||
              /^(what|who|where|when|why|how|can|could|would|will|is|are|do|does)/i.test(text)) {
            const normalizedQ = text.toLowerCase().substring(0, 100);
            const existing = questionMap.get(normalizedQ);
            const timestamp = new Date(msg.timestamp);

            if (existing) {
              existing.count++;
              if (timestamp > existing.lastAsked) {
                existing.lastAsked = timestamp;
              }
            } else {
              questionMap.set(normalizedQ, {
                question: text.substring(0, 100),
                count: 1,
                botId: conv.botId,
                botName,
                lastAsked: timestamp
              });
            }
          }
        }
      });
    }
  });

  const topQuestions = Array.from(questionMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .map(q => ({
      question: q.question,
      timesAsked: q.count,
      botName: q.botName,
      lastAsked: q.lastAsked.toISOString()
    }));

  return NextResponse.json({
    type: 'topQuestions',
    total: questionMap.size,
    data: topQuestions
  });
}

// Get message trends analytics
async function getMessageTrendsAnalytics(
  buildConversationQuery: () => any,
  startDate: Date,
  endDate: Date,
  period: string
) {
  const conversations = await buildConversationQuery().getMany();

  // Determine grouping based on period
  const groupBy = period === '7d' ? 'day' : period === '30d' ? 'day' : period === '90d' ? 'week' : 'month';

  interface TrendData {
    date: string;
    aiMessages: number;
    humanMessages: number;
  }

  const trendsMap = new Map<string, TrendData>();

  conversations.forEach(conv => {
    if (conv.messages && Array.isArray(conv.messages)) {
      conv.messages.forEach((msg: any) => {
        const date = parseTimestamp(msg.timestamp);
        if (!date) return;

        const key = getDateKey(date, groupBy);

        if (!trendsMap.has(key)) {
          trendsMap.set(key, { date: key, aiMessages: 0, humanMessages: 0 });
        }

        const trend = trendsMap.get(key)!;
        // AI Messages: bot, ai, or assistant (includes Playground)
        if (msg.sender === 'bot' || msg.sender === 'ai' || msg.sender === 'assistant') {
          trend.aiMessages++;
        } else if (msg.sender === 'agent') {
          // Human Messages: ONLY agent messages (after handoff)
          trend.humanMessages++;
        }
        // Note: visitor/user messages are NOT counted as human messages
      });
    }
  });

  // Sort by date
  const data = Array.from(trendsMap.values())
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    type: 'messageTrends',
    groupBy,
    data
  });
}

// Get bot-wise analytics
async function getBotwiseAnalytics(
  conversationRepository: any,
  issueRepository: any,
  bots: Bot[],
  startDate: Date,
  endDate: Date,
  period: string
) {
  const botwiseData = await Promise.all(bots.map(async (bot) => {
    let convQuery = conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId = :botId', { botId: bot.id });

    let issueQuery = issueRepository
      .createQueryBuilder('issue')
      .where('issue.botId = :botId', { botId: bot.id });

    if (period !== 'lifetime') {
      convQuery = convQuery
        .andWhere('conversation.createdAt >= :startDate', { startDate })
        .andWhere('conversation.createdAt <= :endDate', { endDate });
      issueQuery = issueQuery
        .andWhere('issue.createdAt >= :startDate', { startDate })
        .andWhere('issue.createdAt <= :endDate', { endDate });
    }

    const conversations = await convQuery.getMany();
    const issues = await issueQuery.getMany();

    let aiMessages = 0;
    let humanMessages = 0;
    let totalResponseTimes: number[] = [];
    let ratingSum = 0;
    let ratingCount = 0;
    const languagesSet = new Set<string>();

    conversations.forEach(conv => {
      if (conv.messages && Array.isArray(conv.messages)) {
        let lastVisitorTime: Date | null = null;

        conv.messages.forEach((msg: any) => {
          if (msg.sender === 'visitor' || msg.sender === 'user') {
            // Track visitor message time for response time calculation
            lastVisitorTime = parseTimestamp(msg.timestamp);
          } else if (msg.sender === 'bot' || msg.sender === 'ai' || msg.sender === 'assistant') {
            // AI Messages: bot, ai, or assistant (includes Playground)
            aiMessages++;
            if (lastVisitorTime) {
              const botResponseTime = parseTimestamp(msg.timestamp);
              if (botResponseTime && lastVisitorTime) {
                const responseTime = (botResponseTime.getTime() - lastVisitorTime.getTime()) / 1000;
                if (responseTime > 0 && responseTime < 300) {
                  totalResponseTimes.push(responseTime);
                }
              }
              lastVisitorTime = null;
            }
          } else if (msg.sender === 'agent') {
            // Human Agent Messages: ONLY count agent messages
            humanMessages++;
            if (lastVisitorTime) {
              const agentResponseTime = parseTimestamp(msg.timestamp);
              if (agentResponseTime && lastVisitorTime) {
                const responseTime = (agentResponseTime.getTime() - lastVisitorTime.getTime()) / 1000;
                if (responseTime > 0 && responseTime < 300) {
                  totalResponseTimes.push(responseTime);
                }
              }
              lastVisitorTime = null;
            }
          }
        });
      }

      const rating = (conv.metadata as any)?.rating;
      if (rating && typeof rating === 'number') {
        ratingCount++;
        ratingSum += rating;
      }

      const language = (conv.metadata as any)?.language || 'en';
      languagesSet.add(language);
    });

    const avgResponseTime = totalResponseTimes.length > 0
      ? totalResponseTimes.reduce((a, b) => a + b, 0) / totalResponseTimes.length
      : 0;

    const csatRating = ratingCount > 0 ? ratingSum / ratingCount : 0;
    const issueReports = issues.filter(i => i.type === 'issue_report').length;
    const humanRequests = issues.filter(i => i.type === 'human_request').length;

    return {
      botId: bot.id,
      botName: bot.name,
      status: bot.status,
      totalConversations: conversations.length,
      aiMessages,
      humanMessages,
      issueReports,
      humanRequests,
      csatRating: Math.round(csatRating * 10) / 10,
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      languagesUsed: languagesSet.size
    };
  }));

  return NextResponse.json({
    type: 'botwise',
    bots: botwiseData
  });
}

// Get issues analytics
async function getIssuesAnalytics(buildIssueQuery: () => any, bots: Bot[]) {
  const issues = await buildIssueQuery()
    .orderBy('issue.createdAt', 'DESC')
    .limit(20)
    .getMany();

  const issueData = issues.map(issue => ({
    id: issue.id,
    type: issue.type,
    userName: issue.userName,
    userEmail: issue.userEmail,
    message: issue.message,
    status: issue.status,
    priority: issue.priority,
    botName: bots.find(b => b.id === issue.botId)?.name || 'Unknown Bot',
    createdAt: issue.createdAt
  }));

  // Count by type
  const allIssues = await buildIssueQuery().getMany();
  const issueReportCount = allIssues.filter(i => i.type === 'issue_report').length;
  const humanRequestCount = allIssues.filter(i => i.type === 'human_request').length;

  return NextResponse.json({
    type: 'issues',
    total: allIssues.length,
    issueReports: issueReportCount,
    humanRequests: humanRequestCount,
    data: issueData
  });
}

// Helper: Get date key for grouping
function getDateKey(date: Date, groupBy: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (groupBy) {
    case 'day':
      return `${year}-${month}-${day}`;
    case 'week':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    case 'month':
      return `${year}-${month}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

// Helper: Get full language name
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

// Helper: Parse timestamp (handles both ISO strings and localized time strings)
function parseTimestamp(timestamp: string | Date | undefined): Date | null {
  if (!timestamp) return null;

  // If already a Date object
  if (timestamp instanceof Date) {
    return isNaN(timestamp.getTime()) ? null : timestamp;
  }

  // Try parsing as ISO string first
  let date = new Date(timestamp);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // If it looks like a localized time string (e.g., "2:30 PM"), try parsing with today's date
  if (/^\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)?$/i.test(timestamp)) {
    const today = new Date();
    const timeStr = timestamp.toUpperCase();
    const isPM = timeStr.includes('PM');
    const isAM = timeStr.includes('AM');
    const timeParts = timeStr.replace(/\s*(AM|PM)/i, '').split(':');

    let hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;

    if (isPM && hours !== 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    today.setHours(hours, minutes, seconds, 0);
    return today;
  }

  return null;
}
