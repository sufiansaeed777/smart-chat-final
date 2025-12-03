import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { ChatbotIssue } from '@/entities/ChatbotIssue';
import { User } from '@/entities/User';
import { Conversation } from '@/entities/Conversation';
import { v4 as uuidv4 } from 'uuid';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get user from database and check if they're a manager
    const userRepository = AppDataSource.getRepository("users");
    const user = await userRepository.findOne({ 
      where: { email: session.user.email } 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has manager role
    if (user.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { status, notes, response, assignedTo } = body;

    // Get the issue with bot information
    const issueRepository = AppDataSource.getRepository("chatbot_issues");
    const issue = await issueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.bot', 'bot')
      .where('issue.id = :id', { id: params.id })
      .getOne();

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Update the issue
    if (status) issue.status = status;
    if (notes !== undefined) issue.notes = notes;
    if (response !== undefined) issue.response = response;
    if (assignedTo !== undefined) issue.assignedTo = assignedTo;

    const updatedIssue = await issueRepository.save(issue);

    // If a response is being sent, also deliver it to the website widget
    // by adding it as a message to the user's active conversation
    if (response && response.trim()) {
      try {
        const conversationRepository = AppDataSource.getRepository(Conversation);

        // Find an active conversation for this user/bot combination
        const conversation = await conversationRepository
          .createQueryBuilder('conversation')
          .where('conversation.guestId = :guestId', { guestId: issue.userId })
          .andWhere('conversation.botId = :botId', { botId: issue.botId })
          .andWhere('conversation.status IN (:...statuses)', { statuses: ['active', 'waiting', 'idle'] })
          .orderBy('conversation.lastMessageAt', 'DESC')
          .getOne();

        if (conversation) {
          // Add the response as an agent message
          const newMessage = {
            id: uuidv4(),
            sender: 'agent',
            text: response,
            timestamp: new Date().toISOString(),
            type: 'message'
          };

          // Append to existing messages
          const messages = conversation.messages || [];
          messages.push(newMessage);
          conversation.messages = messages;
          conversation.lastMessageAt = new Date();
          conversation.mode = 'Human'; // Switch to human mode when agent responds

          await conversationRepository.save(conversation);
          console.log(`[Issues] Response delivered to conversation ${conversation.id} for user ${issue.userId}`);
        } else {
          console.log(`[Issues] No active conversation found for user ${issue.userId}, response saved to issue only`);
        }
      } catch (convError) {
        console.error('[Issues] Error delivering response to conversation:', convError);
        // Don't fail the request, the response is still saved to the issue
      }
    }

    // Fetch updated issue with bot info
    const finalIssue = await issueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.bot', 'bot')
      .where('issue.id = :id', { id: params.id })
      .getOne();

    return NextResponse.json({
      success: true,
      issue: {
        id: finalIssue!.id,
        type: finalIssue!.type,
        userId: finalIssue!.userId,
        userEmail: finalIssue!.userEmail,
        userName: finalIssue!.userName,
        message: finalIssue!.message,
        status: finalIssue!.status,
        priority: finalIssue!.priority,
        assignedTo: finalIssue!.assignedTo,
        notes: finalIssue!.notes,
        response: finalIssue!.response,
        botId: finalIssue!.botId,
        bot: finalIssue!.bot ? {
          id: finalIssue!.bot.id,
          name: finalIssue!.bot.name,
          description: finalIssue!.bot.description
        } : null,
        websiteUrl: finalIssue!.websiteUrl,
        createdAt: finalIssue!.createdAt.toISOString(),
        updatedAt: finalIssue!.updatedAt.toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get user from database and check if they're a manager
    const userRepository = AppDataSource.getRepository("users");
    const user = await userRepository.findOne({ 
      where: { email: session.user.email } 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has manager role
    if (user.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // Get the specific issue with bot information
    const issueRepository = AppDataSource.getRepository("chatbot_issues");
    const issue = await issueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.bot', 'bot')
      .where('issue.id = :id', { id: params.id })
      .getOne();

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      issue: {
        id: issue.id,
        type: issue.type,
        userId: issue.userId,
        userEmail: issue.userEmail,
        userName: issue.userName,
        message: issue.message,
        status: issue.status,
        priority: issue.priority,
        assignedTo: issue.assignedTo,
        notes: issue.notes,
        response: issue.response,
        botId: issue.botId,
        bot: issue.bot ? {
          id: issue.bot.id,
          name: issue.bot.name,
          description: issue.bot.description
        } : null,
        websiteUrl: issue.websiteUrl,
        createdAt: issue.createdAt.toISOString(),
        updatedAt: issue.updatedAt.toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching issue:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
