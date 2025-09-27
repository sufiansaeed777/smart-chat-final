import { DataSource } from "typeorm";

// Environment-specific database configuration
const getDatabaseConfig = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Debug logging for environment variables
  console.log('Database config debug:', {
    NODE_ENV: nodeEnv,
    NEXT_PHASE: process.env.NEXT_PHASE,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
    ALL_ENV_KEYS: Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('NODE'))
  });
  
  // During Next.js build process, don't validate environment variables
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    console.log('Build phase detected, using placeholder database config');
    return {
      url: 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
      synchronize: false,
      logging: false
    };
  }
  
  if (nodeEnv === 'test') {
    // Test environment - use test database or fail if not configured
    const testDbUrl = process.env.TEST_DATABASE_URL;
    if (!testDbUrl) {
      throw new Error('TEST_DATABASE_URL is required for test environment');
    }
    return {
      url: testDbUrl,
      synchronize: true, // Allow schema changes in test
      logging: false
    };
  }
  
  if (nodeEnv === 'production') {
    // Production environment - try multiple ways to get DATABASE_URL
    let prodDbUrl = process.env.DATABASE_URL;
    
    // If not found, try alternative environment variable names
    if (!prodDbUrl) {
      prodDbUrl = process.env.POSTGRES_URL || 
                  process.env.POSTGRESQL_URL || 
                  process.env.DB_URL ||
                  process.env.DATABASE_CONNECTION_STRING ||
                  process.env.SUPABASE_DATABASE_URL;
    }
    
    if (!prodDbUrl) {
      console.error('Production environment detected but DATABASE_URL is not set');
      console.error('Available environment variables:', Object.keys(process.env).filter(key => 
        key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('DB')
      ));
      console.error('Full environment keys:', Object.keys(process.env).sort());
      throw new Error('DATABASE_URL is required in production environment. Please check your environment variables configuration.');
    }
    console.log('Production database URL configured successfully');
    return {
      url: prodDbUrl,
      synchronize: true, // Temporarily enable sync to create missing tables
      logging: true // Enable logging to see what's happening
    };
  }
  
  // Development environment
  const devDbUrl = process.env.DATABASE_URL;
  if (!devDbUrl) {
    throw new Error('DATABASE_URL is required for development environment');
  }
  return {
    url: devDbUrl,
    synchronize: true, // Allow schema changes in development
    logging: true,
    nodeEnv: nodeEnv // Add nodeEnv to the config
  };
};

// Create data source with environment-specific config
const config = getDatabaseConfig();

// Create DataSource with conditional entity loading
const getEntities = () => {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return [];
  }
  
  // Dynamic imports to avoid circular dependencies during build
  const { User } = require("../entities/User");
  const { Bot } = require("../entities/Bot");
  const { BotAssignment } = require("../entities/BotAssignment");
  const { Conversation } = require("../entities/Conversation");
  const { Subscription } = require("../entities/Subscription");
  const { BillingPlan } = require("../entities/BillingPlan");
  const { Invoice } = require("../entities/Invoice");
  const { ChatbotIssue } = require("../entities/ChatbotIssue");
  
  return [User, Bot, BotAssignment, Conversation, Subscription, BillingPlan, Invoice, ChatbotIssue];
};

const AppDataSource = new DataSource({
  type: "postgres",
  url: config.url,
  synchronize: config.synchronize,
  logging: config.logging,
  entities: getEntities(),
  migrations: [],
  subscribers: [],
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Required for managed databases like Supabase
  } : false,
  extra: {
    // Connection pool settings for production
    max: process.env.NODE_ENV === 'production' ? 20 : 10,
    min: process.env.NODE_ENV === 'production' ? 5 : 2,
    acquire: 30000,
    idle: 10000,
  }
});

export { AppDataSource };

// Initialize the data source with better error handling
export const initializeDatabase = async () => {
  try {
    // Skip initialization during build phase or when DATABASE_URL is not available
    if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
      console.log('Skipping database initialization during build phase or missing DATABASE_URL');
      return;
    }
    
    if (!AppDataSource.isInitialized) {
      console.log('Initializing database connection...');
      await AppDataSource.initialize();
      console.log('Database connection established successfully');
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    console.error('Database URL being used:', (AppDataSource.options as any).url?.substring(0, 20) + '...');
    throw error;
  }
};

// Remove automatic initialization - let each API route handle it
// AppDataSource.initialize().catch(console.error);
