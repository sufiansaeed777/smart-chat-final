import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { stripe } from '@/lib/stripe';
import { AppDataSource } from '@/config/database';
import { Bot } from '@/entities/Bot';
import { User } from '@/entities/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get user details to verify ownership
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const userRepository = AppDataSource.getRepository("users");
    const user = await userRepository.findOne({
      where: { email: session.user.email || '' }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify the session belongs to the current user
    if (checkoutSession.metadata?.userId !== user.id) {
      return NextResponse.json(
        { error: 'Session does not belong to current user' },
        { status: 403 }
      );
    }

    // Check if payment was successful
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const botRepository = AppDataSource.getRepository("bots");

    // Check if bot already exists for this session
    const existingBot = await botRepository.findOne({
      where: { 
        name: checkoutSession.metadata?.botName,
        createdBy: user.id 
      }
    });

    let bot = existingBot;

    // Create bot if it doesn't exist and payment was successful
    if (!bot && checkoutSession.metadata?.botName) {
      const botData = {
        name: checkoutSession.metadata.botName,
        description: checkoutSession.metadata.botDescription || 'AI-powered chatbot',
        status: 'active' as const,
        createdBy: user.id,
        isPublic: false,
        welcomeMessage: `Hello! I'm ${checkoutSession.metadata.botName}. How can I help you today?`,
        systemPrompt: `You are ${checkoutSession.metadata.botName}, a helpful AI assistant. Be friendly, professional, and helpful in your responses.`,
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
        // Store payment information
        paymentSessionId: sessionId,
        paymentStatus: 'completed' as const,
        planType: checkoutSession.metadata?.planType || 'free',
      };

      bot = botRepository.create(botData);
      await botRepository.save(bot);
    }

    // Return session data with bot information
    return NextResponse.json({
      id: checkoutSession.id,
      payment_status: checkoutSession.payment_status,
      amount_total: checkoutSession.amount_total,
      currency: checkoutSession.currency,
      payment_method_types: checkoutSession.payment_method_types,
      customer_email: checkoutSession.customer_email,
      metadata: checkoutSession.metadata,
      bot: bot ? {
        id: bot.id,
        name: bot.name,
        description: bot.description,
        status: bot.status,
        createdAt: bot.createdAt,
      } : null,
    });

  } catch (error) {
    console.error('Error verifying payment session:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
