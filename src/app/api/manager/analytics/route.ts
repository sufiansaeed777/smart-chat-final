import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Conversation } from '@/entities/Conversation';
import { Bot } from '@/entities/Bot';
import { In } from 'typeorm';

/**
 * PHASE 4: User Dashboard Analytics
 * GET /api/manager/analytics?type=languages|topQuestions
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
    const type = searchParams.get('type') || 'languages';
    const botId = searchParams.get('botId'); // Optional: filter by bot

    // PHASE 4 FIX: Get conversations from manager's BOTS (not invited users)
    const botRepository = AppDataSource.getRepository(Bot);
    const managerBots = await botRepository.find({
      where: { createdBy: manager.id },
      select: ['id']
    });

    const botIds = managerBots.map(b => b.id);

    if (botIds.length === 0) {
      return NextResponse.json({
        type,
        data: []
      });
    }

    const conversationRepository = AppDataSource.getRepository(Conversation);

    // Build base query - get conversations from manager's bots
    let queryBuilder = conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId IN (:...botIds)', { botIds });

    // Filter by specific bot if specified
    if (botId) {
      queryBuilder = queryBuilder.andWhere('conversation.botId = :botId', { botId });
    }

    if (type === 'languages') {
      // PHASE 4: Languages Analytics
      const conversations = await queryBuilder.getMany();

      // Extract language from metadata and count occurrences
      const languageCounts: { [key: string]: number } = {};

      conversations.forEach(conv => {
        const language = (conv.metadata as any)?.language || 'en';
        languageCounts[language] = (languageCounts[language] || 0) + 1;
      });

      // Convert to array and sort by count
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

    } else if (type === 'topQuestions') {
      // PHASE 4: Top Questions Analytics
      const conversations = await queryBuilder
        .orderBy('conversation.createdAt', 'DESC')
        .limit(1000) // Limit to recent 1000 conversations
        .getMany();

      // Extract questions from messages
      const questions: string[] = [];

      conversations.forEach(conv => {
        if (conv.messages && Array.isArray(conv.messages)) {
          conv.messages.forEach((msg: any) => {
            if (msg.sender === 'visitor' || msg.sender === 'user') {
              // Consider it a question if it ends with ? or contains question words
              const text = msg.text.trim();
              if (text.endsWith('?') ||
                  /^(what|who|where|when|why|how|can|could|would|will|is|are|do|does)/i.test(text)) {
                questions.push(text.toLowerCase());
              }
            }
          });
        } else if (conv.message && conv.sender === 'user') {
          // OLD SCHEMA support
          const text = conv.message.trim();
          if (text.endsWith('?') ||
              /^(what|who|where|when|why|how|can|could|would|will|is|are|do|does)/i.test(text)) {
            questions.push(text.toLowerCase());
          }
        }
      });

      // Count question frequency
      const questionCounts: { [key: string]: number } = {};
      questions.forEach(q => {
        questionCounts[q] = (questionCounts[q] || 0) + 1;
      });

      // Get top 10 questions
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

      return NextResponse.json({
        type: 'topQuestions',
        total: questions.length,
        data: topQuestions
      });
    }

    return NextResponse.json({
      error: 'Invalid analytics type. Use: languages or topQuestions'
    }, { status: 400 });

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
