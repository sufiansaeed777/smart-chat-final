import { Pool } from 'pg';

// Set SSL for Supabase connection - ONLY in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// DNS Fix: ONLY for developers with DNS issues (like corporate networks)
if (process.env.USE_IP_WORKAROUND === 'true' && process.env.NODE_ENV === 'development' && process.env.DATABASE_URL) {
  const originalUrl = process.env.DATABASE_URL;

  if (originalUrl.includes('aws-1-ap-southeast-1.pooler.supabase.com')) {
    process.env.DATABASE_URL = originalUrl.replace(
      'aws-1-ap-southeast-1.pooler.supabase.com',
      '13.213.241.248'
    );
  } else if (originalUrl.includes('db.aucvnpwyrbefzfiqnrvd.supabase.co')) {
    process.env.DATABASE_URL = originalUrl.replace(
      'db.aucvnpwyrbefzfiqnrvd.supabase.co:5432',
      '13.213.241.248:6543'
    ).replace('postgres:', 'postgres.aucvnpwyrbefzfiqnrvd:');
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;