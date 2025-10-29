import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';

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

    // Get user from database
    const userRepository = AppDataSource.getRepository("users");
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a manager
    if (user.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can assign knowledge' }, { status: 403 });
    }

    const body = await request.json();
    const { botId, documentIds } = body;

    // Validate required fields
    if (!botId) {
      return NextResponse.json({
        error: 'Bot ID is required'
      }, { status: 400 });
    }

    if (!documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json({
        error: 'Document IDs must be an array'
      }, { status: 400 });
    }

    // Get the bot from database
    const botRepository = AppDataSource.getRepository("bots");
    const bot = await botRepository.findOne({
      where: {
        id: botId,
        createdBy: user.id // Ensure the manager owns this bot
      }
    });

    if (!bot) {
      return NextResponse.json({
        error: 'Bot not found or you do not have permission to modify it'
      }, { status: 404 });
    }

    const botDocumentRepository = AppDataSource.getRepository("bot_documents");
    const documentRepository = AppDataSource.getRepository("documents");

    // FIX: Delete existing bot-document relationships and create new ones
    // This prevents duplicate assignments
    await botDocumentRepository.delete({ botId: bot.id });

    // Filter out null/undefined values and duplicates
    const validDocumentIds = [...new Set(documentIds.filter(id =>
      id !== null && id !== undefined && id !== ''
    ))];

    if (validDocumentIds.length > 0) {
      // Verify all documents belong to the manager and are active
      const documents = await documentRepository
        .createQueryBuilder('document')
        .where('document.id IN (:...ids)', { ids: validDocumentIds })
        .andWhere('document.userId = :userId', { userId: user.id })
        .andWhere('document.status = :status', { status: 'active' })
        .getMany();

      if (documents.length !== validDocumentIds.length) {
        return NextResponse.json({
          error: 'Some documents are invalid or do not belong to you'
        }, { status: 400 });
      }

      // Create new bot-document relationships (no duplicates possible since we deleted all first)
      const botDocuments = validDocumentIds.map(documentId => ({
        botId: bot.id,
        documentId: documentId,
        status: 'active'
      }));

      await botDocumentRepository.save(botDocuments);
    }

    return NextResponse.json({
      message: `Successfully assigned ${validDocumentIds.length} document(s) to bot`,
      count: validDocumentIds.length
    });

  } catch (error) {
    console.error('Error assigning knowledge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
