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
    try {
      await AppDataSource.initialize();
    } catch (error) {
      console.error('Database initialization failed:', error);
      return;
    }
  }

  const botRepository = AppDataSource.getRepository(Bot);
  const userRepository = AppDataSource.getRepository(User);

  const userId = session.metadata?.userId;
  const planType = session.metadata?.planType;
  const botName = session.metadata?.botName;

  // Get user
  if (!userId) {
    console.error('Missing userId in metadata');
    return;
  }

  const user = await userRepository.findOne({ where: { id: userId } });
  if (!user) {
    console.error('User not found:', userId);
    return;
  }

  // Handle subscription plan purchases (starter, professional, enterprise)
  if (planType === 'starter' || planType === 'professional' || planType === 'enterprise') {
    console.log(`Processing ${planType} subscription for user:`, userId);

    const now = new Date();
    const billingCycleEnd = new Date(now);
    billingCycleEnd.setMonth(billingCycleEnd.getMonth() + 1); // 1 month billing cycle

    // Update user subscription information
    user.subscriptionPlan = planType as 'starter' | 'professional' | 'enterprise';
    user.subscriptionStatus = 'active';
    user.stripeCustomerId = session.customer as string;
    user.stripeSubscriptionId = session.subscription as string || null;
    user.subscriptionStartedAt = now;
    user.billingCycleStart = now;
    user.billingCycleEnd = billingCycleEnd;

    await userRepository.save(user);
    console.log(`User subscription updated to ${planType}:`, user.id);
    return;
  }

  // Handle bot creation (for individual bot purchases)
  if (!botName) {
    console.error('Missing botName in metadata for bot creation');
    return;
  }

  // Validate metadata format
  if (!/^[a-f0-9-]{36}$/i.test(userId)) {
    console.error('Invalid userId format in metadata');
    return;
  }

  if (botName.length > 100) {
    console.error('Bot name too long in metadata');
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
  // CRITICAL: setTimeout is unreliable in serverless environments (will be lost on restart)
  if (planType === 'signup' && session.payment_intent) {
    try {
      // Store refund request in bot record for processing by a cron job
      bot.scheduledRefundAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      bot.refundPaymentIntentId = session.payment_intent as string;
      await botRepository.save(bot);

      console.log(`📅 Scheduled refund for bot ${bot.id} at ${bot.scheduledRefundAt.toISOString()}`);
      console.log(`💡 IMPORTANT: Create a cron job to process scheduledRefundAt refunds`);

      // TODO: Implement proper refund scheduling with one of these options:
      // 1. Create a cron job that checks bot.scheduledRefundAt every hour
      // 2. Use a job queue like Bull or Agenda
      // 3. Use Vercel Cron Jobs (if deployed on Vercel)
      // 4. Use a ScheduledRefund entity with a separate cron job

    } catch (error) {
      console.error('Error scheduling refund:', error);
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);

  // Update bot payment status if needed
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
    } catch (error) {
      console.error('Database initialization failed:', error);
      return;
    }
  }

  const botRepository = AppDataSource.getRepository(Bot);
  
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
    try {
      await AppDataSource.initialize();
    } catch (error) {
      console.error('Database initialization failed:', error);
      return;
    }
  }

  const botRepository = AppDataSource.getRepository(Bot);
  
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

    // Generate idempotency key to prevent duplicate refunds
    const idempotencyKey = `refund_${paymentIntentId}_${botId}`;

    // Create refund with idempotency key
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        botId: botId,
        reason: 'signup_plan_refund',
        refunded_at: new Date().toISOString(),
      }
    }, {
      idempotencyKey: idempotencyKey
    });

    console.log('Refund created:', refund.id);

    // Update bot with refund information
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (error) {
        console.error('Database initialization failed:', error);
        return;
      }
    }

    const botRepository = AppDataSource.getRepository(Bot);
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
