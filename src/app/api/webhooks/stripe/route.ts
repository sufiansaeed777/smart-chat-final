import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { AppDataSource } from '@/config/database';
import { Bot } from '@/entities/Bot';
import { User } from '@/entities/User';
import { Subscription as SubscriptionEntity } from '@/entities/Subscription';
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

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
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

  const botRepository = AppDataSource.getRepository(Bot);
  const userRepository = AppDataSource.getRepository(User);

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
    await AppDataSource.initialize();
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

// Subscription Event Handlers
async function handleSubscriptionCreated(stripeSubscription: Stripe.Subscription) {
  console.log('Subscription created:', stripeSubscription.id);

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const subscriptionRepository = AppDataSource.getRepository(SubscriptionEntity);
  const userRepository = AppDataSource.getRepository(User);

  const customerId = stripeSubscription.customer as string;
  const userId = stripeSubscription.metadata?.userId;

  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  // Get user
  const user = await userRepository.findOne({ where: { id: userId } });
  if (!user) {
    console.error('User not found:', userId);
    return;
  }

  // Get plan details from price
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const planType = getPlanTypeFromPriceId(priceId);
  const limits = getPlanLimits(planType);

  // Create subscription record
  const stripeSub = stripeSubscription as Stripe.Subscription;
  const subscription = subscriptionRepository.create({
    managerId: userId,
    planName: planType,
    status: stripeSub.status as any,
    amount: (stripeSub.items.data[0]?.price.unit_amount || 0) / 100,
    currency: stripeSub.currency.toUpperCase(),
    billingCycle: stripeSub.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly',
    startDate: new Date(stripeSub.current_period_start * 1000),
    endDate: new Date(stripeSub.current_period_end * 1000),
    nextBillingDate: new Date(stripeSub.current_period_end * 1000),
    stripeSubscriptionId: stripeSub.id,
    stripeCustomerId: customerId,
    messageLimit: limits.messages,
    messagesUsed: 0,
    maxBots: limits.bots,
    botsCount: 0,
    maxUsers: limits.users,
    usersCount: 0,
    storageLimit: limits.storage,
    storageUsed: 0,
  });

  await subscriptionRepository.save(subscription);
  console.log('Subscription created in database:', subscription.id);
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  console.log('Subscription updated:', stripeSubscription.id);

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const subscriptionRepository = AppDataSource.getRepository(SubscriptionEntity);

  // Find existing subscription
  const subscription = await subscriptionRepository.findOne({
    where: { stripeSubscriptionId: stripeSubscription.id }
  });

  if (!subscription) {
    console.error('Subscription not found:', stripeSubscription.id);
    return;
  }

  // Update subscription details
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const planType = getPlanTypeFromPriceId(priceId);
  const limits = getPlanLimits(planType);

  subscription.planName = planType;
  subscription.status = stripeSubscription.status as any;
  subscription.amount = (stripeSubscription.items.data[0]?.price.unit_amount || 0) / 100;
  subscription.endDate = new Date(stripeSubscription.current_period_end * 1000);
  subscription.nextBillingDate = new Date(stripeSubscription.current_period_end * 1000);
  subscription.messageLimit = limits.messages;
  subscription.maxBots = limits.bots;
  subscription.maxUsers = limits.users;
  subscription.storageLimit = limits.storage;

  // Reset usage if new billing period
  const now = new Date();
  const periodStart = new Date(stripeSubscription.current_period_start * 1000);
  if (subscription.startDate < periodStart) {
    subscription.messagesUsed = 0;
    subscription.startDate = periodStart;
  }

  await subscriptionRepository.save(subscription);
  console.log('Subscription updated in database:', subscription.id);
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  console.log('Subscription deleted/cancelled:', stripeSubscription.id);

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const subscriptionRepository = AppDataSource.getRepository(SubscriptionEntity);

  // Find and cancel subscription
  const subscription = await subscriptionRepository.findOne({
    where: { stripeSubscriptionId: stripeSubscription.id }
  });

  if (!subscription) {
    console.error('Subscription not found:', stripeSubscription.id);
    return;
  }

  // Mark as cancelled
  subscription.status = 'cancelled';
  await subscriptionRepository.save(subscription);

  console.log('Subscription marked as cancelled:', subscription.id);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const subscriptionRepository = AppDataSource.getRepository(SubscriptionEntity);

  if (!invoice.subscription) {
    return;
  }

  // Find subscription and reactivate if needed
  const subscription = await subscriptionRepository.findOne({
    where: { stripeSubscriptionId: invoice.subscription as string }
  });

  if (subscription) {
    subscription.status = 'active';
    await subscriptionRepository.save(subscription);
    console.log('Subscription reactivated after payment:', subscription.id);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const subscriptionRepository = AppDataSource.getRepository(SubscriptionEntity);

  if (!invoice.subscription) {
    return;
  }

  // Find subscription and suspend
  const subscription = await subscriptionRepository.findOne({
    where: { stripeSubscriptionId: invoice.subscription as string }
  });

  if (subscription) {
    subscription.status = 'past_due';
    await subscriptionRepository.save(subscription);
    console.log('Subscription marked as past_due:', subscription.id);
  }
}

// Helper functions
function getPlanTypeFromPriceId(priceId: string): string {
  // Map Stripe price IDs to plan types
  // You'll need to update these with your actual Stripe price IDs
  const priceMap: { [key: string]: string } = {
    'price_free': 'Free',
    'price_pro_monthly': 'Pro',
    'price_pro_yearly': 'Pro',
    'price_enterprise_monthly': 'Enterprise',
    'price_enterprise_yearly': 'Enterprise',
  };

  return priceMap[priceId] || 'Free';
}

function getPlanLimits(planType: string) {
  const limits: { [key: string]: { messages: number; bots: number; users: number; storage: number } } = {
    'Free': {
      messages: 100,
      bots: 1,
      users: 1,
      storage: 10485760, // 10MB
    },
    'Pro': {
      messages: 10000,
      bots: 10,
      users: 5,
      storage: 104857600, // 100MB
    },
    'Enterprise': {
      messages: 100000,
      bots: 100,
      users: 50,
      storage: 1073741824, // 1GB
    },
  };

  return limits[planType] || limits['Free'];
}
