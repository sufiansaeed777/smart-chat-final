import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { N8nService } from '@/services/n8nService';

/**
 * API endpoint to trigger n8n training for a bot
 * Sends bot's assigned documents to n8n for vector embedding and training
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get user
    const userRepository = AppDataSource.getRepository('users');
    const user = await userRepository.findOne({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can train bots' }, { status: 403 });
    }

    const body = await request.json();
    const { botId } = body;

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    // Get bot
    const botRepository = AppDataSource.getRepository('bots');
    const bot = await botRepository.findOne({
      where: {
        id: botId,
        createdBy: user.id,
      },
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Get bot's assigned documents
    const botDocumentRepository = AppDataSource.getRepository('bot_documents');
    const botDocuments = await botDocumentRepository
      .createQueryBuilder('bd')
      .leftJoinAndSelect('bd.document', 'document')
      .where('bd.botId = :botId', { botId })
      .andWhere('bd.status = :status', { status: 'active' })
      .getMany();

    if (botDocuments.length === 0) {
      return NextResponse.json({
        error: 'No documents assigned to this bot. Please assign documents first.',
      }, { status: 400 });
    }

    // Prepare documents for training
    const documents = botDocuments.map((bd: any) => ({
      id: bd.document.id,
      name: bd.document.name,
      content: bd.document.content || bd.document.text || '',
      type: bd.document.type || 'text',
    }));

    // Trigger n8n training
    const result = await N8nService.batchTrainBot(bot.id, bot.name, documents);

    // Update bot training status
    bot.trainingStatus = result.success ? 'trained' : 'training_failed';
    bot.lastTrainedAt = new Date();
    bot.updatedAt = new Date();
    await botRepository.save(bot);

    return NextResponse.json({
      message: result.message,
      success: result.success,
      botId: bot.id,
      documentsProcessed: documents.length,
      trainingStatus: bot.trainingStatus,
      results: result.results,
    });

  } catch (error) {
    console.error('Error training bot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
