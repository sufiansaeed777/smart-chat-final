import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';
import { BotDocument } from '@/entities/BotDocument';

export async function PUT(request: NextRequest) {
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
      return NextResponse.json({ error: 'Only managers can update bots' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, domain, status, knowledgeIds } = body;

    // Check required fields (only id is always required)
    if (!id) {
      return NextResponse.json({
        error: 'Bot ID is required'
      }, { status: 400 });
    }

    // Get the bot from database
    const botRepository = AppDataSource.getRepository("bots");
    const bot = await botRepository.findOne({
      where: { 
        id: id,
        createdBy: user.id // Ensure the manager owns this bot
      }
    });

    if (!bot) {
      return NextResponse.json({ 
        error: 'Bot not found or you do not have permission to update it' 
      }, { status: 404 });
    }

    // Update the bot fields if provided
    if (name !== undefined) bot.name = name;
    if (description !== undefined) bot.description = description;
    if (domain !== undefined) bot.domain = domain;
    if (status !== undefined) bot.status = status;
    bot.updatedAt = new Date();

    await botRepository.save(bot);

    // Handle knowledge base assignment if provided
    if (knowledgeIds !== undefined && Array.isArray(knowledgeIds)) {
      const botDocumentRepository = AppDataSource.getRepository("bot_documents");

      // Delete existing bot-document relationships
      await botDocumentRepository.delete({ botId: bot.id });

      // Create new bot-document relationships
      if (knowledgeIds.length > 0) {
        const botDocuments = knowledgeIds.map(documentId => ({
          botId: bot.id,
          documentId: documentId,
          status: 'active'
        }));

        await botDocumentRepository.save(botDocuments);
      }
    }

    return NextResponse.json({
      message: 'Bot updated successfully',
      bot: {
        id: bot.id,
        name: bot.name,
        description: bot.description,
        domain: bot.domain,
        status: bot.status,
        createdAt: bot.createdAt,
        updatedAt: bot.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating bot:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
