import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      planType, 
      botName, 
      botDescription, 
      amount, 
      currency, 
      description 
    } = body;

    if (!planType || !amount || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const userRepository = AppDataSource.getRepository(User);

    // Get user details
    const user = await userRepository.findOne({
      where: { email: session.user.email || '' }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'klarna', 'afterpay_clearpay', 'alipay', 'wechat_pay', 'link'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description,
              description: botName ? `Bot: ${botName}` : 'Smart Chat Bot Creation',
              images: [], // Add your product images here
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel?plan=${planType}`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        planType: planType,
        botName: botName || '',
        botDescription: botDescription || '',
        userRole: user.role,
      },
      // Enable international payments
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI', 'AT', 'BE', 'CH', 'IE', 'PT', 'LU', 'MT', 'CY', 'EE', 'LV', 'LT', 'SI', 'SK', 'CZ', 'HU', 'PL', 'RO', 'BG', 'HR', 'GR', 'JP', 'SG', 'HK', 'MY', 'TH', 'PH', 'ID', 'VN', 'KR', 'TW', 'NZ', 'BR', 'MX', 'AR', 'CL', 'CO', 'PE', 'UY', 'ZA'],
      },
      // Automatic tax calculation for supported countries
      automatic_tax: {
        enabled: true,
      },
      // Payment intent data for webhooks
      payment_intent_data: {
        metadata: {
          userId: user.id,
          planType: planType,
          botName: botName || '',
          botDescription: botDescription || '',
        },
      },
    });

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url 
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
