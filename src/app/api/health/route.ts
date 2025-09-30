import { NextResponse } from 'next/server';
import { AppDataSource } from '@/config/database';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown',
        email: 'unknown',
        auth: 'unknown'
      }
    };

    // Check database connection
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      await AppDataSource.query('SELECT 1');
      healthCheck.services.database = 'healthy';
    } catch (error) {
      healthCheck.services.database = 'unhealthy';
      healthCheck.status = 'degraded';
    }

    // Check email configuration
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
      healthCheck.services.email = 'configured';
    } else {
      healthCheck.services.email = 'not_configured';
    }

    // Check auth configuration
    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL) {
      healthCheck.services.auth = 'configured';
    } else {
      healthCheck.services.auth = 'not_configured';
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;

    return NextResponse.json(healthCheck, { status: statusCode, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503, headers: corsHeaders }
    );
  }
}
