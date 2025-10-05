import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { AppDataSource } from '@/config/database';
import { Bot } from '@/entities/Bot';
import { User } from '@/entities/User';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id);
  
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const botRepository = AppDataSource.getRepository("bots");
  const userRepository = AppDataSource.getRepository("users");

  const userId = session.metadata?.userId;
  const planType = session.metadata?.planType;
  const botName = session.metadata?.botName;

  if (!userId || !botName) {
    console.error('Missing required metadata in checkout session');
    return;
  }

  // Get user
  const user = await userRepository.findOne({ where: { id: userId } });
  if (!user) {
    console.error('User not found:', userId);
    return;
  }

  // Check if bot already exists
  const existingBot = await botRepository.findOne({
    where: { 
      name: botName,
      createdBy: userId 
    }
  });

  if (existingBot) {
    console.log('Bot already exists:', existingBot.id);
    return;
  }

  // Create the bot
  const botData = {
    name: botName,
    description: session.metadata?.botDescription || 'AI-powered chatbot',
    status: 'active' as const,
    createdBy: userId,
    isPublic: false,
    welcomeMessage: `Hello! I'm ${botName}. How can I help you today?`,
    systemPrompt: `You are ${botName}, a helpful AI assistant. Be friendly, professional, and helpful in your responses.`,
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    paymentSessionId: session.id,
    paymentStatus: 'completed' as const,
    planType: planType || 'free',
  };

  const bot = botRepository.create(botData);
  await botRepository.save(bot);

  console.log('Bot created successfully:', bot.id);

  // Handle signup plan refund
  if (planType === 'signup' && session.payment_intent) {
    try {
      // Schedule refund for 24 hours later
      // In production, you might want to use a job queue like Bull or Agenda
      setTimeout(async () => {
        await handleSignupPlanRefund(session.payment_intent as string, bot.id);
      }, 24 * 60 * 60 * 1000); // 24 hours
    } catch (error) {
      console.error('Error scheduling refund:', error);
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  
  // Update bot payment status if needed
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const botRepository = AppDataSource.getRepository("bots");
  
  const bot = await botRepository.findOne({
    where: { paymentSessionId: paymentIntent.metadata?.sessionId }
  });

  if (bot) {
    bot.paymentStatus = 'completed';
    await botRepository.save(bot);
    console.log('Bot payment status updated:', bot.id);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id);
  
  // Update bot payment status
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const botRepository = AppDataSource.getRepository("bots");
  
  const bot = await botRepository.findOne({
    where: { paymentSessionId: paymentIntent.metadata?.sessionId }
  });

  if (bot) {
    bot.paymentStatus = 'failed';
    bot.status = 'inactive';
    await botRepository.save(bot);
    console.log('Bot payment status updated to failed:', bot.id);
  }
}

async function handleSignupPlanRefund(paymentIntentId: string, botId: string) {
  try {
    console.log('Processing signup plan refund for bot:', botId);
    
    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        botId: botId,
        reason: 'signup_plan_refund',
        refunded_at: new Date().toISOString(),
      }
    });

    console.log('Refund created:', refund.id);

    // Update bot with refund information
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const botRepository = AppDataSource.getRepository("bots");
    const bot = await botRepository.findOne({ where: { id: botId } });

    if (bot) {
      bot.paymentStatus = 'refunded';
      bot.refundId = refund.id;
      await botRepository.save(bot);
      console.log('Bot refund status updated:', bot.id);
    }

  } catch (error) {
    console.error('Error processing refund:', error);
  }
}
