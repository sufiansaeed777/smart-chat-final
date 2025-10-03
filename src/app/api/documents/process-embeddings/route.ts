import { NextRequest, NextResponse } from 'next/server';
import { processDocument } from '@/services/documentProcessing';
import { AppDataSource } from '@/config/database';
import { Document } from '@/entities/Document';
import { getServerSession } from 'next-auth';
import { checkRateLimit, RateLimits } from '@/middleware/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting for document processing (use email as identifier)
    const identifier = `user:${session.user.email}`;
    const rateLimitResponse = checkRateLimit(identifier, RateLimits.UPLOAD);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { documentId, botId } = await request.json();

    if (!documentId || !botId) {
      return NextResponse.json(
        { error: 'Document ID and Bot ID required' },
        { status: 400 }
      );
    }

    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Verify document exists
    const documentRepository = AppDataSource.getRepository(Document);
    const document = await documentRepository.findOne({
      where: { id: documentId }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Process document in background
    // In production, you'd want to use a job queue like Bull or BullMQ
    processDocument(documentId, botId)
      .then(() => {
        console.log(`✓ Document ${documentId} processed successfully`);
      })
      .catch((error) => {
        console.error(`✗ Error processing document ${documentId}:`, error);
      });

    return NextResponse.json({
      success: true,
      message: 'Document processing started',
      documentId,
      botId
    });

  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
