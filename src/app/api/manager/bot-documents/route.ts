import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { Document } from '@/entities/Document';
import { User } from '@/entities/User';

// GET /api/manager/bot-documents - Get documents for bot creation
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

    const userRepository = AppDataSource.getRepository("users");
    const documentRepository = AppDataSource.getRepository("documents");

    // Get the current user
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get search parameter
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Build query
    let query = documentRepository
      .createQueryBuilder('document')
      .where('document.userId = :userId', { userId: user.id })
      .andWhere('document.status = :status', { status: 'active' });

    if (search) {
      query = query.andWhere(
        '(document.name ILIKE :search OR document.content ILIKE :search OR document.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Get documents
    const documents = await query
      .orderBy('document.createdAt', 'DESC')
      .getMany();

    // Format response
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: Number(doc.size) || 0,
      uploadDate: doc.createdAt.toISOString().split('T')[0],
      content: doc.content,
      description: doc.description,
      mimeType: doc.mimeType
    }));

    return NextResponse.json({
      documents: formattedDocuments
    });

  } catch (error) {
    console.error('Error fetching bot documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
