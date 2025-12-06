import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { Conversation } from '@/entities/Conversation';
import { LessThan, In } from 'typeorm';

/**
 * Auto-revert conversations to AI mode if agent hasn't responded within 10 minutes
 * This endpoint should be called periodically by the HumanHandoff component
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const body = await request.json();
    const { botId } = body;

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    const conversationRepository = AppDataSource.getRepository(Conversation);

    // Find conversations in Human mode that need to be reverted
    // Criteria: mode='Human', last message was > 10 minutes ago, AND no agent message since handoff
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Get all Human mode conversations for this bot
    const humanModeConversations = await conversationRepository.find({
      where: {
        botId: botId,
        mode: 'Human' as const,
        status: In(['active', 'waiting'])
      }
    });

    const revertedConversations: string[] = [];
    const now = new Date();

    for (const conv of humanModeConversations) {
      const messages = conv.messages || [];

      // Find the handoff notification message (when mode switched to Human)
      const handoffIndex = messages.findLastIndex(
        (m: { type?: string; text?: string; sender?: string }) =>
          m.type === 'notification' ||
          m.sender === 'system' ||
          (m.text && (m.text.includes('human agent') || m.text.includes('Agent')))
      );

      // Get messages after handoff
      const messagesAfterHandoff = handoffIndex >= 0
        ? messages.slice(handoffIndex + 1)
        : messages;

      // Check if there's any agent message after handoff
      const hasAgentResponse = messagesAfterHandoff.some(
        (m: { sender?: string }) => m.sender === 'agent'
      );

      // If agent hasn't responded yet, check the time since last message
      if (!hasAgentResponse) {
        // Get the last message timestamp
        const lastMessage = messages[messages.length - 1];
        const lastMessageTime = lastMessage?.timestamp
          ? new Date(lastMessage.timestamp)
          : conv.lastMessageAt || conv.updatedAt || conv.createdAt;

        // Check if last message was more than 10 minutes ago
        if (lastMessageTime && lastMessageTime < tenMinutesAgo) {
          // Revert to AI mode
          conv.mode = 'AI';

          // Add system notification about auto-revert
          const newMessages = [...messages];
          newMessages.push({
            id: `${Date.now()}-system`,
            sender: 'system',
            text: 'Conversation automatically returned to AI mode after 10 minutes of no agent response.',
            timestamp: now.toISOString(),
            type: 'notification'
          });

          conv.messages = newMessages;
          conv.lastMessageAt = now;

          await conversationRepository.save(conv);
          revertedConversations.push(conv.id);

          console.log(`[AUTO-REVERT] Conversation ${conv.id} reverted to AI mode (no agent response in 10+ minutes)`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      revertedCount: revertedConversations.length,
      revertedConversations: revertedConversations,
      checkedCount: humanModeConversations.length
    });

  } catch (error) {
    console.error('Auto-revert error:', error);
    return NextResponse.json(
      { error: 'Failed to process auto-revert' },
      { status: 500 }
    );
  }
}
