import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { Document } from '@/entities/Document';
import { User } from '@/entities/User';
import path from 'path';
import { supabase, isSupabaseStorageConfigured } from '@/lib/supabase';

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

    const userRepository = AppDataSource.getRepository("users");
    const documentRepository = AppDataSource.getRepository("documents");

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

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('documents') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedDocuments = [];
    const useSupabaseStorage = isSupabaseStorageConfigured();

    for (const file of files) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv', 'application/json'];
      if (!allowedTypes.includes(file.type)) {
        continue; // Skip invalid files
      }

      // Generate unique filename
      const fileExtension = path.extname(file.name);
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;

      // Read file content
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Extract content for text-based files
      let content = '';
      let storageUrl = '';
      let fileData = '';

      // For text files, always extract content for searchability
      if (file.type === 'text/plain' || file.type === 'text/csv' || file.type === 'application/json') {
        content = buffer.toString('utf-8');
      } else {
        content = `Binary file: ${file.name}`; // Placeholder content for search
      }

      if (useSupabaseStorage) {
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents') // You need to create this bucket in Supabase dashboard
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          // Fall back to database storage if upload fails
          fileData = buffer.toString('base64');
        } else {
          // Get public URL for the uploaded file
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);

          storageUrl = urlData.publicUrl;
        }
      } else {
        // Fall back to storing in database if Supabase Storage not configured
        if (file.type === 'text/plain' || file.type === 'text/csv' || file.type === 'application/json') {
          fileData = content; // Store text directly
        } else {
          fileData = buffer.toString('base64'); // Store binary as base64
        }
      }

      // Create document record
      const document = documentRepository.create({
        name: file.name,
        type: fileExtension.substring(1).toLowerCase(),
        size: file.size,
        filePath: storageUrl || fileData, // Store URL if using Supabase, otherwise store data
        content: content,
        mimeType: file.type,
        userId: user.id,
        url: storageUrl, // Store Supabase URL separately
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
