import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { Document } from '@/entities/Document';
import { User } from '@/entities/User';

// GET /api/manager/documents/[id]/download - Download document
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

    const userRepository = AppDataSource.getRepository("users");
    const documentRepository = AppDataSource.getRepository("documents");

    // Get the current user
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the document
    const document = await documentRepository.findOne({
      where: { 
        id: (await params).id,
        userId: user.id,
        status: 'active'
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if document has data
    if (!document.filePath) {
      return NextResponse.json({ error: 'Document data not found' }, { status: 404 });
    }

    let fileBuffer: Buffer;

    // Determine if the filePath contains base64 data or plain text
    const isTextFile = document.mimeType === 'text/plain' ||
                      document.mimeType === 'text/csv' ||
                      document.mimeType === 'application/json';

    if (isTextFile) {
      // For text files, filePath contains the actual text content
      fileBuffer = Buffer.from(document.filePath, 'utf-8');
    } else {
      // For binary files (PDF, DOC), filePath contains base64-encoded data
      try {
        fileBuffer = Buffer.from(document.filePath, 'base64');
      } catch (error) {
        console.error('Error decoding base64 data:', error);
        return NextResponse.json({ error: 'Invalid document data' }, { status: 500 });
      }
    }

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', document.mimeType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${document.name}"`);
    headers.set('Content-Length', fileBuffer.length.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
}
