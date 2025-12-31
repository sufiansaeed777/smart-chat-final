import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';
import { BotDocument } from '@/entities/BotDocument';
import { Document } from '@/entities/Document';
import { embedSystemPrompt } from '@/services/openaiTrainingService';
import { getUserPlanLimits, checkLimit } from '@/middleware/planLimits';

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
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a manager
    if (user.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can create bots' }, { status: 403 });
    }

    // Check plan limits for bot creation
    const botRepository = AppDataSource.getRepository(Bot);
    const currentBotCount = await botRepository.count({
      where: { createdBy: user.id }
    });

    // Get user's plan (default to 'free' if not set)
    const userPlan = user.subscriptionPlan ?? 'free';
    const planLimits = getUserPlanLimits(userPlan);
    const limitCheck = checkLimit(currentBotCount, planLimits.maxBots, 'bots');

    console.log(`[Plan Check] User: ${user.email}, Plan: ${userPlan}, Bots: ${currentBotCount}/${planLimits.maxBots}`);

    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: 'Plan limit reached',
        message: limitCheck.message,
        currentCount: currentBotCount,
        limit: planLimits.maxBots,
        plan: userPlan,
        upgradeRequired: true,
        upgradeUrl: '/manager-dashboard/billing'
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, domain, status, documentIds, newDocuments } = body;

    // Validate required fields
    if (!name || !description || !domain) {
      return NextResponse.json({
        error: 'Missing required fields: name, description, and domain are required'
      }, { status: 400 });
    }

    // Validate domain format (must be valid https:// URL)
    if (!domain.startsWith('https://')) {
      return NextResponse.json({
        error: 'Domain must start with https:// (e.g., https://yoursite.com)'
      }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(domain);
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid domain URL format. Please provide a valid URL (e.g., https://yoursite.com)'
      }, { status: 400 });
    }

    // Create the bot in database (botRepository already initialized above for limit check)
    const newBot = botRepository.create({
      name,
      description,
      domain,
      status: status || 'active',
      createdBy: user.id,
      totalConversations: 0,
      lastActive: new Date()
    });

    const savedBot = await botRepository.save(newBot);

    // Handle document associations
    const botDocumentRepository = AppDataSource.getRepository("bot_documents");
    const documentRepository = AppDataSource.getRepository("documents");
    const associatedDocuments = [];

    // Associate existing documents
    // FIX: Remove duplicates from documentIds array
    if (documentIds && documentIds.length > 0) {
      const uniqueDocumentIds = [...new Set(documentIds)];

      for (const documentId of uniqueDocumentIds) {
        // Verify the document belongs to the manager
        const document = await documentRepository.findOne({
          where: { id: documentId, userId: user.id, status: 'active' }
        });

        if (document) {
          // FIX: Check if this document is already assigned to this bot
          const existingAssignment = await botDocumentRepository.findOne({
            where: { botId: savedBot.id, documentId: documentId }
          });

          if (!existingAssignment) {
            const botDocument = botDocumentRepository.create({
              botId: savedBot.id,
              documentId: documentId,
              status: 'active'
            });
            await botDocumentRepository.save(botDocument);
            associatedDocuments.push({
              id: document.id,
              name: document.name,
              type: document.type
            });
          }
        }
      }
    }

    // Handle new document uploads
    if (newDocuments && newDocuments.length > 0) {
      for (const newDoc of newDocuments) {
        // Create new document
        const document = documentRepository.create({
          name: newDoc.name,
          type: newDoc.type,
          size: newDoc.size,
          filePath: newDoc.filePath,
          content: newDoc.content,
          mimeType: newDoc.mimeType,
          userId: user.id,
          status: 'active'
        });

        const savedDocument = await documentRepository.save(document);

        // Associate with bot
        const botDocument = botDocumentRepository.create({
          botId: savedBot.id,
          documentId: savedDocument.id,
          status: 'active'
        });
        await botDocumentRepository.save(botDocument);

        associatedDocuments.push({
          id: savedDocument.id,
          name: savedDocument.name,
          type: savedDocument.type
        });
      }
    }

    // Auto-embed system prompt (description) for RAG
    console.log('🎯 Auto-embedding system prompt for bot:', savedBot.id);
    try {
      const embedResult = await embedSystemPrompt(savedBot.id, name, description);
      if (embedResult.success) {
        console.log('✅ System prompt embedded:', embedResult.message);
      } else {
        console.warn('⚠️  System prompt embedding failed:', embedResult.message);
        // Don't fail bot creation if embedding fails
      }
    } catch (embedError) {
      console.error('❌ Error embedding system prompt:', embedError);
      // Don't fail bot creation if embedding fails
    }

    // Create n8n workflow for the bot
    try {
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL_BOT_CREATION;
      if (n8nWebhookUrl) {
        const n8nPayload = {
          botId: savedBot.id,
          botName: name,
          description: description,
          domain: domain,
          status: status || 'active',
          createdBy: user.id,
          createdAt: new Date().toISOString()
        };

        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(n8nPayload),
        });

        if (!n8nResponse.ok) {
          console.error('Failed to create n8n workflow for bot:', savedBot.id);
          // Don't fail the bot creation if n8n fails
        } else {
          console.log('Successfully created n8n workflow for bot:', savedBot.id);
        }
      }
    } catch (n8nError) {
      console.error('Error creating n8n workflow:', n8nError);
      // Don't fail the bot creation if n8n fails
    }

    return NextResponse.json({
      message: 'Bot created successfully',
      bot: {
        id: savedBot.id,
        name: savedBot.name,
        description: savedBot.description,
        domain: savedBot.domain,
        status: savedBot.status,
        createdAt: savedBot.createdAt,
        associatedDocuments: associatedDocuments
      }
    });

  } catch (error) {
    console.error('Error creating bot:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
