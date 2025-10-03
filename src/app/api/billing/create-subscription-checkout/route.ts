import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, priceId, planType } = await request.json();

    if (!userId || !priceId) {
      return NextResponse.json(
        { error: 'User ID and price ID required' },
        { status: 400 }
      );
    }

    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get user
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create Stripe Checkout Session for subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId: userId,
        planType: planType || 'pro',
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
