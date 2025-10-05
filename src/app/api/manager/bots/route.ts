import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';
import { BotAssignment } from '@/entities/BotAssignment';
import { Conversation } from '@/entities/Conversation';
import { BotDocument } from '@/entities/BotDocument';

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
      return NextResponse.json({ error: 'Only managers can view bots' }, { status: 403 });
    }

    // Get bots created by this manager
    const botRepository = AppDataSource.getRepository("bots");
    const conversationRepository = AppDataSource.getRepository("conversations");
    const botDocumentRepository = AppDataSource.getRepository("bot_documents");
    const bots = await botRepository.find({
      where: { createdBy: user.id },
      relations: ['assignments', 'assignments.user', 'botDocuments', 'botDocuments.document'],
      order: { createdAt: 'DESC' }
    });

    // Get real conversation counts for each bot
    const botIds = bots.map(bot => bot.id);
    let conversationCounts = [];
    
    // Only query conversations if there are bots
    if (botIds.length > 0) {
      conversationCounts = await conversationRepository
        .createQueryBuilder('conversation')
        .select('conversation.botId')
        .addSelect('COUNT(*)', 'count')
        .where('conversation.botId IN (:...botIds)', { botIds })
        .groupBy('conversation.botId')
        .getRawMany();
    }

    // Create a map of botId to conversation count
    const conversationCountMap = conversationCounts.reduce((acc, item) => {
      acc[item.conversation_botId] = parseInt(item.count);
      return acc;
    }, {} as Record<string, number>);

    // Transform the data to match the expected format
    const formattedBots = bots.map(bot => ({
      id: bot.id,
      name: bot.name,
      description: bot.description,
      domain: bot.domain,
      status: bot.status,
      conversations: conversationCountMap[bot.id] || 0, // Use real conversation count
      totalUsers: bot.assignments?.length || 0,
      lastActive: bot.lastActive ? new Date(bot.lastActive).toLocaleString() : 'Never',
      assignedUsers: bot.assignments?.map(assignment => assignment.user?.email).filter(Boolean) || [],
      createdAt: bot.createdAt.toISOString().split('T')[0],
      lastConversation: bot.lastActive ? new Date(bot.lastActive).toISOString().split('T')[0] : null,
      documents: bot.botDocuments?.map(bd => ({
        id: bd.document.id,
        name: bd.document.name,
        type: bd.document.type,
        size: Number(bd.document.size) || 0
      })) || []
    }));

    return NextResponse.json({ 
      bots: formattedBots,
      totalCount: formattedBots.length 
    });

  } catch (error) {
    console.error('Error fetching bots:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
