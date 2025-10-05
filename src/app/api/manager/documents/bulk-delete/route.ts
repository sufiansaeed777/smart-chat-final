import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { Document } from '@/entities/Document';
import { User } from '@/entities/User';
import fs from 'fs/promises';

// POST /api/manager/documents/bulk-delete - Delete multiple documents
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { documentIds } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'No document IDs provided' }, { status: 400 });
    }

    // Get the documents using TypeORM In operator
    const documents = await documentRepository
      .createQueryBuilder('document')
      .where('document.id IN (:...documentIds)', { documentIds })
      .andWhere('document.userId = :userId', { userId: user.id })
      .andWhere('document.status = :status', { status: 'active' })
      .getMany();

    if (documents.length === 0) {
      return NextResponse.json({ error: 'No documents found' }, { status: 404 });
    }

    // Soft delete documents
    const deletedIds = [];
    for (const document of documents) {
      document.status = 'deleted';
      await documentRepository.save(document);
      deletedIds.push(document.id);

      // Delete physical file
      try {
        await fs.unlink(document.filePath);
      } catch (fileError) {
        console.warn(`Could not delete physical file for document ${document.id}:`, fileError);
      }
    }

    return NextResponse.json({
      message: `${deletedIds.length} documents deleted successfully`,
      deletedIds
    });

  } catch (error) {
    console.error('Error bulk deleting documents:', error);
    return NextResponse.json(
      { error: 'Failed to delete documents' },
      { status: 500 }
    );
  }
}
