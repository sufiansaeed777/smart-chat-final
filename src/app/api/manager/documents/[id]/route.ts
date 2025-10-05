import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { Document } from '@/entities/Document';
import { User } from '@/entities/User';
import fs from 'fs/promises';
import path from 'path';

// GET /api/manager/documents/[id] - Get specific document
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

    return NextResponse.json({
      id: document.id,
      name: document.name,
      type: document.type,
      size: document.size,
      uploadDate: document.createdAt.toISOString().split('T')[0],
      content: document.content,
      url: `/api/manager/documents/${document.id}/download`,
      description: document.description,
      mimeType: document.mimeType
    });

  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PUT /api/manager/documents/[id] - Update document
export async function PUT(
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

    // Parse request body
    const body = await request.json();
    const { name, description } = body;

    // Update document
    if (name) document.name = name;
    if (description !== undefined) document.description = description;

    const updatedDocument = await documentRepository.save(document);

    return NextResponse.json({
      message: 'Document updated successfully',
      document: {
        id: updatedDocument.id,
        name: updatedDocument.name,
        type: updatedDocument.type,
        size: updatedDocument.size,
        uploadDate: updatedDocument.createdAt.toISOString().split('T')[0],
        content: updatedDocument.content,
        url: `/api/manager/documents/${updatedDocument.id}/download`,
        description: updatedDocument.description,
        mimeType: updatedDocument.mimeType
      }
    });

  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /api/manager/documents/[id] - Delete document
export async function DELETE(
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

    // Soft delete - mark as deleted
    document.status = 'deleted';
    await documentRepository.save(document);

    // Delete physical file
    try {
      await fs.unlink(document.filePath);
    } catch (fileError) {
      console.warn('Could not delete physical file:', fileError);
    }

    return NextResponse.json({
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
