import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { Document } from '@/entities/Document';
import { User } from '@/entities/User';
import path from 'path';
import fs from 'fs/promises';

// GET /api/manager/documents - Get all documents for the manager
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

    const userRepository = AppDataSource.getRepository(User);
    const documentRepository = AppDataSource.getRepository(Document);

    // Get the current user
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get search and filter parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

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

    if (type !== 'all') {
      query = query.andWhere('document.type = :type', { type });
    }

    // Get total count
    const totalCount = await query.getCount();

    // Get paginated results
    const documents = await query
      .orderBy('document.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Format response
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: Number(doc.size) || 0, // Ensure size is a number
      uploadDate: doc.createdAt.toISOString().split('T')[0],
      content: doc.content,
      url: doc.url,
      description: doc.description,
      mimeType: doc.mimeType
    }));

    return NextResponse.json({
      documents: formattedDocuments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/manager/documents - Upload new documents
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

    const userRepository = AppDataSource.getRepository(User);
    const documentRepository = AppDataSource.getRepository(Document);

    // Get the current user
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('documents') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    const uploadedDocuments = [];

    for (const file of files) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        continue; // Skip invalid files
      }

      // Generate unique filename
      const fileExtension = path.extname(file.name);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Save file to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.writeFile(filePath, buffer);

      // Extract content for text files
      let content = '';
      if (file.type === 'text/plain') {
        content = buffer.toString('utf-8');
      }

      // Create document record
      const document = documentRepository.create({
        name: file.name,
        type: fileExtension.substring(1).toLowerCase(),
        size: file.size,
        filePath: filePath,
        content: content,
        mimeType: file.type,
        userId: user.id,
        status: 'active'
      });

      const savedDocument = await documentRepository.save(document);

      uploadedDocuments.push({
        id: savedDocument.id,
        name: savedDocument.name,
        type: savedDocument.type,
        size: savedDocument.size,
        uploadDate: savedDocument.createdAt.toISOString().split('T')[0],
        content: savedDocument.content,
        url: `/api/manager/documents/${savedDocument.id}/download`
      });
    }

    return NextResponse.json({
      message: 'Documents uploaded successfully',
      documents: uploadedDocuments
    });

  } catch (error) {
    console.error('Error uploading documents:', error);
    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    );
  }
}
