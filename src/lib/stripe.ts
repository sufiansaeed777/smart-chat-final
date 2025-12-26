import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export const STRIPE_CONFIG = {
  // Free plan - 7 Day Trial
  FREE_PLAN: {
    price: 0, // $0.00 in cents
    currency: 'usd',
    name: 'Free Trial',
    description: '7 Days Trial - 1 Chatbot, 100 messages, 1 team member',
  },
  // Basic plan - $29.00/month
  BASIC_PLAN: {
    price: 2900, // $29.00 in cents
    currency: 'usd',
    name: 'Basic Plan',
    description: '2 Chatbots, 1,000 messages/month, 2 team members, 50MB storage',
  },
  // Pro plan - $99.00/month
  PRO_PLAN: {
    price: 9900, // $99.00 in cents
    currency: 'usd',
    name: 'Pro Plan',
    description: '5 Chatbots, 5,000 messages/month, 5 team members, 200MB storage, Custom Branding',
  },
  // Add-ons
  ADDON_EXTRA_MESSAGES: {
    price: 1000, // $10.00 in cents
    currency: 'usd',
    name: 'Extra Messages',
    description: '+1,000 messages',
  },
  ADDON_EXTRA_BOT: {
    price: 500, // $5.00 in cents
    currency: 'usd',
    name: 'Extra Chatbot',
    description: 'Additional chatbot',
  },
  ADDON_EXTRA_STORAGE: {
    price: 500, // $5.00 in cents
    currency: 'usd',
    name: 'Extra Storage',
    description: '+50MB storage',
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
