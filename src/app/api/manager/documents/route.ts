import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { Document } from '@/entities/Document';
import { User } from '@/entities/User';
import path from 'path';
import { getUserPlanLimits, checkLimit } from '@/middleware/planLimits';

// GET /api/manager/documents - Get all documents for the manager
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (error) {
        console.error('Database initialization failed:', error);
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        );
      }
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
  // TODO: Migrate to Supabase Storage or AWS S3 for better file handling
  // Current implementation stores files directly in database which is not ideal for:
  // - Large files (PDFs, documents) that can slow down database
  // - Database storage is more expensive than object storage
  // - Can hit database size limits with many documents
  //
  // Recommended: Use Supabase Storage since we're already using Supabase for DB
  // Steps needed:
  // 1. Enable Storage in Supabase dashboard
  // 2. Install @supabase/supabase-js
  // 3. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to env
  // 4. Update this endpoint to upload to Supabase Storage and store only URLs in DB

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (error) {
        console.error('Database initialization failed:', error);
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        );
      }
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

    // Check plan limits for documents
    const planLimits = getUserPlanLimits(user.subscriptionPlan || 'free');

    // Check document count limit
    const currentDocCount = await documentRepository.count({
      where: { userId: user.id, status: 'active' }
    });

    const docLimitCheck = checkLimit(currentDocCount, planLimits.maxDocuments, 'documents');
    if (!docLimitCheck.allowed) {
      return NextResponse.json({
        error: 'Plan limit reached',
        message: docLimitCheck.message,
        currentCount: currentDocCount,
        limit: planLimits.maxDocuments,
        plan: user.subscriptionPlan || 'free',
        upgradeRequired: true,
        upgradeUrl: '/manager-dashboard/billing'
      }, { status: 403 });
    }

    // Check storage limit
    const storageResult = await documentRepository
      .createQueryBuilder('doc')
      .select('COALESCE(SUM(doc.size), 0)', 'totalBytes')
      .where('doc.userId = :userId', { userId: user.id })
      .andWhere('doc.status = :status', { status: 'active' })
      .getRawOne();

    const currentStorageMB = Number(storageResult?.totalBytes || 0) / (1024 * 1024);
    const storageLimitCheck = checkLimit(Math.floor(currentStorageMB), planLimits.maxStorageMB, 'storage');
    if (!storageLimitCheck.allowed) {
      return NextResponse.json({
        error: 'Plan limit reached',
        message: storageLimitCheck.message,
        currentStorageMB: Math.round(currentStorageMB * 100) / 100,
        limit: planLimits.maxStorageMB,
        plan: user.subscriptionPlan || 'free',
        upgradeRequired: true,
        upgradeUrl: '/manager-dashboard/billing'
      }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('documents') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedDocuments = [];

    for (const file of files) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
        'application/json',
        'image/svg+xml',  // SVG files
        'image/png',      // PNG images
        'image/jpeg',     // JPEG images
        'image/gif',      // GIF images
        'image/webp'      // WebP images
      ];
      if (!allowedTypes.includes(file.type)) {
        continue; // Skip invalid files
      }

      // FIX: Check for duplicate document name and auto-rename if exists
      let fileName = file.name;
      const fileExtension = path.extname(fileName);
      const fileBaseName = fileName.substring(0, fileName.length - fileExtension.length);

      let existingDocument = await documentRepository.findOne({
        where: {
          name: fileName,
          userId: user.id,
          status: 'active'
        }
      });

      // Auto-rename with incremental number if duplicate exists
      let counter = 1;
      while (existingDocument) {
        fileName = `${fileBaseName} (${counter})${fileExtension}`;
        existingDocument = await documentRepository.findOne({
          where: {
            name: fileName,
            userId: user.id,
            status: 'active'
          }
        });
        counter++;
      }

      // Read file content
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Process document to extract text
      let content = '';
      let fileData = '';

      try {
        // Import document processor
        const { processDocument } = await import('@/utils/documentProcessor');

        // Process the document
        const processed = await processDocument(buffer, file.type, file.name);
        content = processed.content;

        // For text files, store content directly
        if (file.type === 'text/plain' || file.type === 'text/csv' || file.type === 'application/json') {
          fileData = content; // Store text directly
        } else {
          // For binary files, still store as base64 for now (will migrate to S3 later)
          fileData = buffer.toString('base64');
        }
      } catch (processError) {
        console.warn('Failed to process document, storing raw data:', processError);
        // Fallback to original behavior
        if (file.type === 'text/plain' || file.type === 'text/csv' || file.type === 'application/json') {
          content = buffer.toString('utf-8');
          fileData = content;
        } else {
          fileData = buffer.toString('base64');
          content = `Binary file: ${file.name}`;
        }
      }

      // Create document record - store file data in database
      // FIX: Use the renamed fileName instead of original file.name
      const document = documentRepository.create({
        name: fileName,
        type: fileExtension.substring(1).toLowerCase(),
        size: file.size,
        filePath: fileData, // Store the actual file data
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
