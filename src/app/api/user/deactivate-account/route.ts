import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { Bot } from '@/entities/Bot';
import { Conversation } from '@/entities/Conversation';
import { BotAssignment } from '@/entities/BotAssignment';
import { ChatbotIssue } from '@/entities/ChatbotIssue';

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

    const userRepository = AppDataSource.getRepository(User);
    const botRepository = AppDataSource.getRepository(Bot);
    const conversationRepository = AppDataSource.getRepository(Conversation);
    const botAssignmentRepository = AppDataSource.getRepository(BotAssignment);
    const chatbotIssueRepository = AppDataSource.getRepository(ChatbotIssue);

    // Get user from database
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Starting account deletion for user:', user.email);

    // Delete all data associated with the user
    // This ensures complete data removal as per the warning message

    // 1. Delete all bot assignments (where user is assigned as team member)
    await botAssignmentRepository.delete({ userId: user.id });
    console.log('Deleted bot assignments for user:', user.id);

    // 2. Delete all chatbot issues created by user
    await chatbotIssueRepository.delete({ userId: user.id });
    console.log('Deleted chatbot issues for user:', user.id);

    // 3. Delete all conversations (both as user and guest)
    await conversationRepository.delete({ userId: user.id });
    console.log('Deleted conversations for user:', user.id);

    // 4. Delete all bots created by the user
    // This will also cascade delete BotDocuments due to CASCADE relationship
    await botRepository.delete({ createdBy: user.id });
    console.log('Deleted bots created by user:', user.id);

    // 5. Delete the user
    // This will cascade delete:
    // - Documents (has CASCADE relationship)
    // - Subscriptions (has CASCADE relationship)
    // - Invoices (has CASCADE relationship)
    await userRepository.delete(user.id);
    console.log('Account and all associated data deleted for user:', user.email);

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data permanently deleted'
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
