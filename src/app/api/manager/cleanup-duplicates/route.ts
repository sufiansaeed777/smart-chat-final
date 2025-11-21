import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';

// POST /api/manager/cleanup-duplicates - Remove duplicate documents
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
    const botDocumentRepository = AppDataSource.getRepository("bot_documents");

    // Get the current user
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all active documents for this user
    const documents = await documentRepository
      .createQueryBuilder('document')
      .where('document.userId = :userId', { userId: user.id })
      .andWhere('document.status = :status', { status: 'active' })
      .orderBy('document.createdAt', 'ASC') // Oldest first
      .getMany();

    // Group documents by name
    const documentsByName: { [key: string]: any[] } = {};
    documents.forEach((doc: any) => {
      if (!documentsByName[doc.name]) {
        documentsByName[doc.name] = [];
      }
      documentsByName[doc.name].push(doc);
    });

    // Find duplicates and clean up
    let totalDuplicatesRemoved = 0;
    const duplicateGroups: { [key: string]: number } = {};

    for (const [name, docs] of Object.entries(documentsByName)) {
      if (docs.length > 1) {
        // Keep the oldest (first) document, delete the rest
        const keepDoc = docs[0];
        const duplicates = docs.slice(1);

        duplicateGroups[name] = duplicates.length;

        for (const duplicate of duplicates) {
          // Update any bot_documents relationships to point to the kept document
          const botDocs = await botDocumentRepository
            .createQueryBuilder('bd')
            .where('bd.documentId = :duplicateId', { duplicateId: duplicate.id })
            .getMany();

          for (const botDoc of botDocs) {
            // Check if a relationship already exists for this bot with the kept document
            const existingRelation = await botDocumentRepository
              .createQueryBuilder('bd')
              .where('bd.botId = :botId', { botId: (botDoc as any).botId })
              .andWhere('bd.documentId = :keepId', { keepId: keepDoc.id })
              .getOne();

            if (!existingRelation) {
              // Update to point to kept document
              await botDocumentRepository.update(
                { id: (botDoc as any).id },
                { documentId: keepDoc.id }
              );
            } else {
              // Delete this relationship as it would be duplicate
              await botDocumentRepository.delete({ id: (botDoc as any).id });
            }
          }

          // Mark duplicate document as deleted
          await documentRepository.update(
            { id: duplicate.id },
            { status: 'deleted' }
          );

          totalDuplicatesRemoved++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Removed ${totalDuplicatesRemoved} duplicate documents`,
      duplicateGroups,
      totalDuplicatesRemoved
    });

  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup duplicates', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
