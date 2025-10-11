import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { extractText } from '@/services/textExtraction';
import { splitTextIntoChunks } from '@/services/textChunking';
import { generateEmbeddings, deleteBotEmbeddings } from '@/services/embeddingService';
import fs from 'fs/promises';
import path from 'path';

/**
 * API endpoint to train a bot directly (no n8n for training)
 * Processes documents: Extract → Chunk → Generate Embeddings → Store in Supabase
 * n8n is ONLY used for chat responses (RAG retrieval)
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

    // Update bot status to 'training'
    bot.trainingStatus = 'training';
    bot.updatedAt = new Date();
    await botRepository.save(bot);

    // Delete existing embeddings for this bot (retrain from scratch)
    await deleteBotEmbeddings(bot.id);

    // Process each document
    const results: Array<{ documentId: string; documentName: string; success: boolean; chunksCreated: number; error?: string }> = [];
    let totalEmbeddings = 0;

    for (const bd of botDocuments) {
      const document = bd.document;

      try {
        console.log(`\n📄 Processing document: ${document.name}`);

        // Get document file path
        const filePath = document.filePath || document.path;
        if (!filePath) {
          results.push({
            documentId: document.id,
            documentName: document.name,
            success: false,
            chunksCreated: 0,
            error: 'File path not found',
          });
          continue;
        }

        // Read file
        const fileBuffer = await fs.readFile(path.join(process.cwd(), filePath));

        // Extract text
        const extraction = await extractText(fileBuffer, document.type || 'text/plain');
        console.log(`✅ Extracted ${extraction.metadata.words} words from ${document.name}`);

        // Split into chunks
        const chunks = splitTextIntoChunks(extraction.text, 1000, 200);
        console.log(`✅ Split into ${chunks.length} chunks`);

        // Generate embeddings
        const embeddingResult = await generateEmbeddings(chunks, {
          botId: bot.id,
          documentId: document.id,
          documentName: document.name,
          chunkIndex: 0,
          totalChunks: chunks.length,
        });

        if (embeddingResult.success) {
          totalEmbeddings += embeddingResult.embeddingsCreated;
          results.push({
            documentId: document.id,
            documentName: document.name,
            success: true,
            chunksCreated: embeddingResult.embeddingsCreated,
          });
        } else {
          results.push({
            documentId: document.id,
            documentName: document.name,
            success: false,
            chunksCreated: 0,
            error: embeddingResult.error,
          });
        }
      } catch (error) {
        console.error(`Error processing document ${document.name}:`, error);
        results.push({
          documentId: document.id,
          documentName: document.name,
          success: false,
          chunksCreated: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update bot training status
    const successfulDocs = results.filter(r => r.success).length;
    bot.trainingStatus = successfulDocs > 0 ? 'trained' : 'training_failed';
    bot.lastTrainedAt = new Date();
    bot.updatedAt = new Date();
    await botRepository.save(bot);

    return NextResponse.json({
      success: successfulDocs > 0,
      message: `Trained ${successfulDocs}/${botDocuments.length} documents successfully`,
      botId: bot.id,
      documentsProcessed: botDocuments.length,
      totalEmbeddings: totalEmbeddings,
      trainingStatus: bot.trainingStatus,
      results: results,
    });

  } catch (error) {
    console.error('Error training bot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
