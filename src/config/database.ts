import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Bot } from "../entities/Bot";
import { BotAssignment } from "../entities/BotAssignment";
import { Conversation } from "../entities/Conversation";
import { Subscription } from "../entities/Subscription";
import { BillingPlan } from "../entities/BillingPlan";
import { Invoice } from "../entities/Invoice";
import { ChatbotIssue } from "../entities/ChatbotIssue";
import { Document } from "../entities/Document";
import { BotDocument } from "../entities/BotDocument";

// Environment-specific database configuration
const getDatabaseConfig = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // During Next.js build process, don't validate environment variables
  if (process.env.NEXT_PHASE === 'phase-production-build') {
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
    // Production environment - strict validation
    const prodDbUrl = process.env.DATABASE_URL;
    if (!prodDbUrl) {
      throw new Error('DATABASE_URL is required in production environment');
    }
    return {
      url: prodDbUrl,
      synchronize: false, // Never auto-sync in production
      logging: false
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
// Database config logging removed for production

export const AppDataSource = new DataSource({
  type: "postgres",
  url: config.url,
  synchronize: config.synchronize,
  logging: config.logging,
  entities: [User, Bot, BotAssignment, Conversation, Subscription, BillingPlan, Invoice, ChatbotIssue, Document, BotDocument],
  migrations: ["src/migrations/**/*.ts"],
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

// Initialize the data source
export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  } catch (error) {
    throw error;
  }
};

// Remove automatic initialization - let each API route handle it
// AppDataSource.initialize().catch(console.error);
