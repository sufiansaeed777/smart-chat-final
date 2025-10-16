import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export const STRIPE_CONFIG = {
  // Signup plan - $0.01 charge that gets refunded
  SIGNUP_PLAN: {
    price: 1, // $0.01 in cents
    currency: 'usd',
    name: 'Signup Plan - Bot Creation',
    description: 'Create your first bot (refundable)',
    productId: 'prod_T1Oq2owhO3uruq', // Your existing Stripe product
  },
  // Free plan - $0.00
  FREE_PLAN: {
    price: 0, // $0.00 in cents
    currency: 'usd',
    name: 'Free Plan',
    description: '1 Bot, 50 conversations/month, 1 team member',
  },
  // Starter plan - $19.00
  STARTER_PLAN: {
    price: 1900, // $19.00 in cents
    currency: 'usd',
    name: 'Starter Plan',
    description: '2 Bots, 1,000 conversations/month, 2 team members',
  },
  // Pro plan - $49.00
  PRO_PLAN: {
    price: 4900, // $49.00 in cents
    currency: 'usd',
    name: 'Pro Plan',
    description: '5 Bots, 10,000 conversations/month, 5 team members',
  },
  // Enterprise plan - $99.00
  ENTERPRISE_PLAN: {
    price: 9900, // $99.00 in cents
    currency: 'usd',
    name: 'Enterprise Plan',
    description: '20 Bots, 50,000 conversations/month, 20+ team members',
  },
  // Add-ons
  ADDON_EXTRA_CONVERSATIONS: {
    price: 1000, // $10.00 in cents
    currency: 'usd',
    name: 'Extra Conversations',
    description: '+5,000 conversations',
  },
  ADDON_EXTRA_BOT: {
    price: 500, // $5.00 in cents
    currency: 'usd',
    name: 'Extra Bot Seat',
    description: 'Additional bot',
  },
  ADDON_DEDICATED_HOSTING: {
    price: 10000, // $100.00 in cents
    currency: 'usd',
    name: 'Dedicated Hosting',
    description: 'Dedicated server hosting',
  },
};

// Payment methods for international customers
export const PAYMENT_METHODS = [
  'card', // Credit/debit cards
  'klarna', // Buy now, pay later
  'afterpay_clearpay', // Buy now, pay later
  'alipay', // For Asian markets
  'wechat_pay', // For Chinese market
  'google_pay', // Google Pay
  'apple_pay', // Apple Pay
  'link', // Stripe Link
];

// Countries you want to support
export const SUPPORTED_COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI',
  'AT', 'BE', 'CH', 'IE', 'PT', 'LU', 'MT', 'CY', 'EE', 'LV', 'LT', 'SI', 'SK',
  'CZ', 'HU', 'PL', 'RO', 'BG', 'HR', 'GR', 'JP', 'SG', 'HK', 'MY', 'TH', 'PH',
  'ID', 'VN', 'KR', 'TW', 'NZ', 'BR', 'MX', 'AR', 'CL', 'CO', 'PE', 'UY', 'ZA'
];
