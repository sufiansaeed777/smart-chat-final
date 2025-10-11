import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { N8nService } from '@/services/n8nService';

/**
 * API endpoint to train a bot via n8n (per ROADMAP Phase 3)
 * Sends documents to n8n for processing: parse → chunk → generate embeddings → store
 * n8n uses text-embedding-3-large (3072 dimensions) and stores in pgvector
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

    console.log(`\n🚀 Starting n8n-based training for bot: ${bot.name} (${bot.id})`);
    console.log(`📦 Documents to process: ${botDocuments.length}`);

    // Process each document via n8n
    const results: Array<{
      documentId: string;
      documentName: string;
      success: boolean;
      error?: string
    }> = [];

    for (const bd of botDocuments) {
      const document = bd.document;

      try {
        console.log(`\n📄 Processing document: ${document.name}`);

        // Get document content from database (serverless-compatible)
        let documentContent: string;

        if (document.content) {
          // Use content stored in database
          documentContent = document.content;
          console.log(`✅ Retrieved ${document.name} from database (${documentContent.length} characters)`);
        } else if (document.url) {
          // Fallback: fetch from URL if available
          try {
            const response = await fetch(document.url);
            if (!response.ok) {
              throw new Error(`Failed to fetch document from URL: ${response.statusText}`);
            }
            documentContent = await response.text();
            console.log(`✅ Retrieved ${document.name} from URL (${documentContent.length} characters)`);
          } catch (urlError) {
            results.push({
              documentId: document.id,
              documentName: document.name,
              success: false,
              error: `Failed to fetch from URL: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`,
            });
            continue;
          }
        } else {
          // No content available
          results.push({
            documentId: document.id,
            documentName: document.name,
            success: false,
            error: 'Document content not found (no content or URL)',
          });
          continue;
        }

        // Send to n8n for processing
        // n8n will: parse → chunk → generate embeddings (text-embedding-3-large) → store in pgvector
        const n8nResult = await N8nService.trainBot({
          botId: bot.id,
          botName: bot.name,
          documentId: document.id,
          documentName: document.name,
          documentContent: documentContent,
          documentType: document.type || 'text/plain',
          action: 'train',
        });

        if (n8nResult.success) {
          console.log(`✅ n8n processed ${document.name} successfully`);
          results.push({
            documentId: document.id,
            documentName: document.name,
            success: true,
          });
        } else {
          console.error(`❌ n8n failed to process ${document.name}: ${n8nResult.message}`);
          results.push({
            documentId: document.id,
            documentName: document.name,
            success: false,
            error: n8nResult.message,
          });
        }

        // Small delay between documents to avoid overwhelming n8n
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error processing document ${document.name}:`, error);
        results.push({
          documentId: document.id,
          documentName: document.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update bot training status based on results
    const successfulDocs = results.filter(r => r.success).length;
    bot.trainingStatus = successfulDocs > 0 ? 'trained' : 'training_failed';
    bot.lastTrainedAt = new Date();
    bot.updatedAt = new Date();
    bot.trainingLog = JSON.stringify({
      timestamp: new Date().toISOString(),
      totalDocuments: botDocuments.length,
      successfulDocuments: successfulDocs,
      failedDocuments: botDocuments.length - successfulDocs,
      results: results,
    });
    await botRepository.save(bot);

    console.log(`\n🎯 Training completed: ${successfulDocs}/${botDocuments.length} documents successful`);
    console.log(`📊 Bot status: ${bot.trainingStatus}`);

    return NextResponse.json({
      success: successfulDocs > 0,
      message: `Trained ${successfulDocs}/${botDocuments.length} documents successfully`,
      botId: bot.id,
      botName: bot.name,
      documentsProcessed: botDocuments.length,
      successfulDocuments: successfulDocs,
      failedDocuments: botDocuments.length - successfulDocs,
      trainingStatus: bot.trainingStatus,
      lastTrainedAt: bot.lastTrainedAt,
      results: results,
    });

  } catch (error) {
    console.error('Error training bot:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
