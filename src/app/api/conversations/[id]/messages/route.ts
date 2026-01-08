import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { Conversation } from '@/entities/Conversation';
import { Bot } from '@/entities/Bot';
import { User } from '@/entities/User';
import { getUserPlanLimits, checkLimit } from '@/middleware/planLimits';

/**
 * POST /api/conversations/[id]/messages
 * Send a message to a conversation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { message, sender } = body;

    if (!message || !sender) {
      return NextResponse.json(
        { success: false, error: 'Message and sender are required' },
        { status: 400 }
      );
    }

    if (!['visitor', 'agent', 'bot'].includes(sender)) {
      return NextResponse.json(
        { success: false, error: 'Invalid sender type' },
        { status: 400 }
      );
    }

    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (error) {
        console.error('Database initialization failed:', error);
        return NextResponse.json(
          { success: false, error: 'Database connection failed' },
          { status: 500 }
        );
      }
    }

    const conversationRepository = AppDataSource.getRepository(Conversation);

    const conversation = await conversationRepository.findOne({
      where: { id },
      relations: ['bot']
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check human message limit for agent messages (human handoff)
    if (sender === 'agent') {
      const botRepository = AppDataSource.getRepository(Bot);
      const userRepository = AppDataSource.getRepository(User);

      // Get the bot owner to check their plan limits
      const bot = conversation.bot || await botRepository.findOne({
        where: { id: conversation.botId }
      });

      if (bot) {
        const botOwner = await userRepository.findOne({
          where: { id: bot.createdBy }
        });

        if (botOwner) {
          const planLimits = getUserPlanLimits(botOwner.subscriptionPlan || 'free');

          // Count human (agent) messages this month across all owner's bots
          const ownerBots = await botRepository.find({
            where: { createdBy: botOwner.id },
            select: ['id']
          });
          const ownerBotIds = ownerBots.map(b => b.id);

          if (ownerBotIds.length > 0) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            // Count agent messages from conversations
            const conversations = await conversationRepository
              .createQueryBuilder('conv')
              .where('conv.botId IN (:...botIds)', { botIds: ownerBotIds })
              .andWhere('conv.createdAt >= :startOfMonth', { startOfMonth })
              .getMany();

            let humanMessageCount = 0;
            for (const conv of conversations) {
              if (conv.messages && Array.isArray(conv.messages)) {
                humanMessageCount += conv.messages.filter((msg: { sender?: string }) =>
                  msg.sender === 'agent'
                ).length;
              }
            }

            const limitCheck = checkLimit(humanMessageCount, planLimits.monthlyHumanMessages, 'human_messages');
            if (!limitCheck.allowed) {
              return NextResponse.json({
                success: false,
                error: 'Plan limit reached',
                message: limitCheck.message,
                currentCount: humanMessageCount,
                limit: planLimits.monthlyHumanMessages,
                upgradeRequired: true,
                upgradeUrl: '/manager-dashboard/billing'
              }, { status: 403 });
            }
          }
        }
      }
    }

    // Add message to conversation
    const messages = conversation.messages || [];
    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sender: sender as 'visitor' | 'agent' | 'bot',
      text: message,
      timestamp: new Date().toISOString()
    };

    messages.push(newMessage);
    conversation.messages = messages;
    conversation.lastMessageAt = new Date();

    // Update status to active if message is sent (including completed conversations that restart)
    if (conversation.status === 'idle' || conversation.status === 'waiting' || conversation.status === 'completed') {
      conversation.status = 'active';
    }

    await conversationRepository.save(conversation);

    return NextResponse.json({
      success: true,
      message: newMessage,
      conversation: {
        id: conversation.id,
        messages: conversation.messages,
        lastMessageAt: conversation.lastMessageAt,
        status: conversation.status
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
