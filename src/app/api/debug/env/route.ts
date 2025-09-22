import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow this in development or if explicitly enabled
  const isDevelopment = process.env.NODE_ENV === 'development';
  const debugEnabled = process.env.ENABLE_DEBUG === 'true';
  
  if (!isDevelopment && !debugEnabled) {
    return NextResponse.json({ error: 'Debug endpoint disabled in production' }, { status: 403 });
  }

  // Get all environment variables (be careful not to expose sensitive data)
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PHASE: process.env.NEXT_PHASE,
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL ? 'SET' : 'NOT SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET',
    EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
    EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD ? 'SET' : 'NOT SET',
    // Show first few characters of DATABASE_URL for debugging (be careful!)
    DATABASE_URL_PREFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'NOT SET',
  };

  return NextResponse.json({
    message: 'Environment variables status',
    environment: envVars,
    timestamp: new Date().toISOString()
  });
}
