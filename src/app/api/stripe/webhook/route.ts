import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Stripe Webhook Handler
 * Handles subscription lifecycle events from Stripe
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Initialize database with error handling
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (error) {
        console.error('Database initialization failed:', error);
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        );
      }
    }

    const userRepository = AppDataSource.getRepository(User);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Update user with Stripe customer ID and subscription info
        const user = await userRepository.findOne({
          where: { email: session.customer_email! },
        });

        if (user) {
          user.stripeCustomerId = session.customer as string;
          user.stripeSubscriptionId = session.subscription as string;
          user.subscriptionStatus = 'active';
          user.subscriptionPlan = session.metadata?.plan || 'basic';
          user.updatedAt = new Date();
          await userRepository.save(user);

          console.log(`✅ Subscription activated for user: ${user.email}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        const user = await userRepository.findOne({
          where: { stripeCustomerId: subscription.customer as string },
        });

        if (user) {
          user.subscriptionStatus = subscription.status;
          user.subscriptionPlan = subscription.items.data[0].price.metadata?.plan || user.subscriptionPlan;
          user.updatedAt = new Date();
          await userRepository.save(user);

          console.log(`✅ Subscription updated for user: ${user.email}, status: ${subscription.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        const user = await userRepository.findOne({
          where: { stripeCustomerId: subscription.customer as string },
        });

        if (user) {
          user.subscriptionStatus = 'cancelled';
          user.updatedAt = new Date();
          await userRepository.save(user);

          console.log(`❌ Subscription cancelled for user: ${user.email}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        const user = await userRepository.findOne({
          where: { stripeCustomerId: invoice.customer as string },
        });

        if (user) {
          // Reset monthly usage counters on successful payment
          user.messagesUsedThisMonth = 0;
          user.subscriptionStatus = 'active';
          user.updatedAt = new Date();
          await userRepository.save(user);

          console.log(`💰 Payment succeeded for user: ${user.email}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        const user = await userRepository.findOne({
          where: { stripeCustomerId: invoice.customer as string },
        });

        if (user) {
          user.subscriptionStatus = 'past_due';
          user.updatedAt = new Date();
          await userRepository.save(user);

          console.log(`⚠️ Payment failed for user: ${user.email}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
