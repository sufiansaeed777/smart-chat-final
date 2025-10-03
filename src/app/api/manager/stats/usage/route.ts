import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';
import { Document } from '@/entities/Document';
import { Conversation } from '@/entities/Conversation';
import { UserRole } from '@/types/UserRole';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);
    const botRepository = AppDataSource.getRepository(Bot);
    const documentRepository = AppDataSource.getRepository(Document);
    const conversationRepository = AppDataSource.getRepository(Conversation);

    // Get current user
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get usage statistics
    const [users, bots, documents, conversations] = await Promise.all([
      // Count team members (users invited by this manager)
      userRepository.count({
        where: { role: UserRole.USER }
      }),
      // Count bots created by this manager
      botRepository.count({
        where: { createdBy: currentUser.id }
      }),
      // Count documents uploaded by this manager
      documentRepository.count({
        where: { uploadedBy: currentUser.id }
      }),
      // Count conversations for this manager's bots
      conversationRepository
        .createQueryBuilder('conversation')
        .innerJoin('bots', 'bot', 'bot.id = conversation.botId')
        .where('bot.createdBy = :createdBy', { createdBy: currentUser.id })
        .getCount()
    ]);

    return NextResponse.json({
      users: users + 1, // +1 to include the manager themselves
      bots,
      documents,
      conversations
    });

  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
}
