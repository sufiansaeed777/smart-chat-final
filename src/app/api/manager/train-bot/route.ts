import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { trainBotWithDocuments, updateBotTrainingStatus } from '@/services/openaiTrainingService';

/**
 * NEW Training Endpoint - Uses OpenAI directly (NOT n8n)
 * Based on the clarification that n8n is ONLY for RAG retrieval
 * Training should use OpenAI API directly for embeddings
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { botId } = await request.json();

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    // Get bot
    const botRepository = AppDataSource.getRepository('bots');
    const bot = await botRepository.findOne({
      where: { id: botId, createdBy: user.id },
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

    // Update bot status to 'training'
    await updateBotTrainingStatus(botId, 'training', 'Starting training with OpenAI...');

    console.log(`\n🚀 Starting DIRECT OpenAI training for bot: ${bot.name} (${bot.id})`);
    console.log(`📦 Documents to process: ${botDocuments.length}`);
    console.log('🔧 Using OpenAI text-embedding-3-large (NOT n8n)');

    // Prepare documents for training
    const documentsToTrain = [];

    for (const bd of botDocuments) {
      const document = bd.document;
      let content = '';

      // Extract content based on document type
      if (document.content && !document.content.startsWith('Binary file:')) {
        // Text content already extracted
        content = document.content;
      } else if (document.filePath) {
        // For binary files, try to extract text
        try {
          const { processDocument } = await import('@/utils/documentProcessor');
          const buffer = Buffer.from(document.filePath, 'base64');
          const processed = await processDocument(buffer, document.mimeType || 'application/pdf', document.name);
          content = processed.content;
        } catch (error) {
          console.warn(`Failed to extract text from ${document.name}, skipping`);
          continue;
        }
      }

      if (content) {
        documentsToTrain.push({
          id: document.id,
          name: document.name,
          content: content,
        });
      }
    }

    if (documentsToTrain.length === 0) {
      await updateBotTrainingStatus(botId, 'training_failed', 'No valid content found in documents');
      return NextResponse.json({
        error: 'No valid content found in documents',
      }, { status: 400 });
    }

    // Train with OpenAI directly
    const results = await trainBotWithDocuments(botId, documentsToTrain);

    // Check if training was successful
    const successfulDocs = results.filter(r => r.success).length;
    const failedDocs = results.filter(r => !r.success).length;

    if (successfulDocs === 0) {
      await updateBotTrainingStatus(
        botId,
        'training_failed',
        `All documents failed to train: ${results[0]?.error || 'Unknown error'}`
      );

      return NextResponse.json({
        success: false,
        message: 'Training failed for all documents',
        results,
      }, { status: 500 });
    }

    // Update bot status to 'trained'
    const totalEmbeddings = results.reduce((sum, r) => sum + r.embeddingsCreated, 0);
    await updateBotTrainingStatus(
      botId,
      'trained',
      `Successfully trained with ${successfulDocs} documents (${totalEmbeddings} embeddings created)`
    );

    console.log(`\n✅ Training completed for bot ${bot.name}`);
    console.log(`📊 Results: ${successfulDocs} successful, ${failedDocs} failed`);
    console.log(`🔢 Total embeddings created: ${totalEmbeddings}`);

    return NextResponse.json({
      success: true,
      message: `Bot trained successfully with ${successfulDocs} documents`,
      botId,
      botName: bot.name,
      results,
      summary: {
        totalDocuments: documentsToTrain.length,
        successfulDocuments: successfulDocs,
        failedDocuments: failedDocs,
        totalEmbeddings: totalEmbeddings,
      },
    });

  } catch (error: any) {
    console.error('Training error:', error);

    // Try to update bot status if we have botId
    try {
      const body = await request.json().catch(() => ({}));
      if (body.botId) {
        await updateBotTrainingStatus(body.botId, 'training_failed', error.message);
      }
    } catch {}

    return NextResponse.json(
      {
        error: 'Training failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}