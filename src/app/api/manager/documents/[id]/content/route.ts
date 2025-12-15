import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { Document } from '@/entities/Document';
import { User } from '@/entities/User';

/**
 * GET /api/manager/documents/[id]/content
 * Get document content - re-extracts from stored file data if needed
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);
    const documentRepository = AppDataSource.getRepository(Document);

    // Get the current user
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const documentId = (await params).id;

    // Get the document
    const document = await documentRepository.findOne({
      where: {
        id: documentId,
        userId: user.id,
        status: 'active'
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if content exists and is valid (not "Binary file:" placeholder)
    const hasValidContent = document.content &&
      !document.content.startsWith('Binary file:') &&
      document.content.length > 20;

    if (hasValidContent) {
      return NextResponse.json({
        id: document.id,
        name: document.name,
        type: document.type,
        content: document.content,
        extracted: false
      });
    }

    // Try to re-extract content from stored file data
    const fileData = document.filePath;
    if (!fileData) {
      return NextResponse.json({
        id: document.id,
        name: document.name,
        type: document.type,
        content: null,
        error: 'No file data available for re-extraction'
      });
    }

    try {
      // Decode the stored file data
      let buffer: Buffer;
      const mimeType = document.mimeType || '';

      // Check if it's stored as base64 (binary files) or plain text
      if (mimeType.includes('text/') || mimeType === 'application/json') {
        // Text files are stored directly
        buffer = Buffer.from(fileData, 'utf-8');
      } else {
        // Binary files (PDF, DOCX) are stored as base64
        buffer = Buffer.from(fileData, 'base64');
      }

      // Import document processor
      const { processDocument } = await import('@/utils/documentProcessor');

      // Re-process the document
      const processed = await processDocument(buffer, mimeType, document.name);

      // Update the document with the new content
      document.content = processed.content;
      await documentRepository.save(document);

      return NextResponse.json({
        id: document.id,
        name: document.name,
        type: document.type,
        content: processed.content,
        extracted: true,
        message: 'Content successfully re-extracted'
      });

    } catch (extractError) {
      console.error('Error re-extracting content:', extractError);

      // Return a helpful message based on file type
      let errorMessage = 'Unable to extract text content from this file.';
      if (document.mimeType === 'application/pdf') {
        errorMessage = 'Unable to extract text from this PDF. It may be a scanned document or contain only images.';
      } else if (document.mimeType?.includes('word') || document.type === 'docx') {
        errorMessage = 'Unable to extract text from this Word document. The file may be corrupted.';
      }

      return NextResponse.json({
        id: document.id,
        name: document.name,
        type: document.type,
        content: null,
        error: errorMessage,
        details: extractError instanceof Error ? extractError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error fetching document content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document content' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manager/documents/[id]/content
 * Force re-extraction of document content
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);
    const documentRepository = AppDataSource.getRepository(Document);

    // Get the current user
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const documentId = (await params).id;

    // Get the document
    const document = await documentRepository.findOne({
      where: {
        id: documentId,
        userId: user.id,
        status: 'active'
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const fileData = document.filePath;
    if (!fileData) {
      return NextResponse.json({
        error: 'No file data available for extraction'
      }, { status: 400 });
    }

    try {
      // Decode the stored file data
      let buffer: Buffer;
      const mimeType = document.mimeType || '';

      if (mimeType.includes('text/') || mimeType === 'application/json') {
        buffer = Buffer.from(fileData, 'utf-8');
      } else {
        buffer = Buffer.from(fileData, 'base64');
      }

      // Import document processor
      const { processDocument } = await import('@/utils/documentProcessor');

      // Re-process the document
      const processed = await processDocument(buffer, mimeType, document.name);

      // Update the document with the new content
      document.content = processed.content;
      await documentRepository.save(document);

      return NextResponse.json({
        success: true,
        id: document.id,
        name: document.name,
        content: processed.content,
        message: 'Content successfully re-extracted and saved'
      });

    } catch (extractError) {
      console.error('Error re-extracting content:', extractError);
      return NextResponse.json({
        error: 'Failed to extract content',
        details: extractError instanceof Error ? extractError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in content extraction:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
