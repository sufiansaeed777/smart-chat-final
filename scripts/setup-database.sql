-- Complete database setup for Smart Chat application
-- Run this script in your Supabase SQL editor or PostgreSQL client

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    firstName VARCHAR(255),
    lastName VARCHAR(255),
    isEmailVerified BOOLEAN DEFAULT FALSE,
    emailVerificationToken VARCHAR(255),
    passwordResetToken VARCHAR(255),
    passwordResetExpires TIMESTAMP,
    role VARCHAR(50) DEFAULT 'user',
    isActive BOOLEAN DEFAULT TRUE,
    lastLoginAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bots table
CREATE TABLE IF NOT EXISTS bots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    systemPrompt TEXT,
    model VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
    maxTokens INTEGER DEFAULT 1000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    isActive BOOLEAN DEFAULT TRUE,
    createdBy UUID REFERENCES users(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bot_assignments table
CREATE TABLE IF NOT EXISTS bot_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    botId UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    assignedBy UUID NOT NULL REFERENCES users(id),
    assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, botId)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    botId UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    title VARCHAR(255),
    messages JSONB DEFAULT '[]',
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    planId VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    stripeSubscriptionId VARCHAR(255),
    stripeCustomerId VARCHAR(255),
    currentPeriodStart TIMESTAMP,
    currentPeriodEnd TIMESTAMP,
    cancelAtPeriodEnd BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create billing_plans table
CREATE TABLE IF NOT EXISTS billing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    interval VARCHAR(20) NOT NULL,
    stripePriceId VARCHAR(255),
    features JSONB DEFAULT '[]',
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscriptionId UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    stripeInvoiceId VARCHAR(255),
    paidAt TIMESTAMP,
    dueDate TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chatbot_issues table
CREATE TABLE IF NOT EXISTS chatbot_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    botId UUID REFERENCES bots(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignedTo UUID REFERENCES users(id),
    resolvedAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(emailVerificationToken);
CREATE INDEX IF NOT EXISTS idx_bots_created_by ON bots(createdBy);
CREATE INDEX IF NOT EXISTS idx_bot_assignments_user_id ON bot_assignments(userId);
CREATE INDEX IF NOT EXISTS idx_bot_assignments_bot_id ON bot_assignments(botId);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(userId);
CREATE INDEX IF NOT EXISTS idx_conversations_bot_id ON conversations(botId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(userId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripeSubscriptionId);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(userId);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON invoices(stripeInvoiceId);
CREATE INDEX IF NOT EXISTS idx_chatbot_issues_user_id ON chatbot_issues(userId);
CREATE INDEX IF NOT EXISTS idx_chatbot_issues_bot_id ON chatbot_issues(botId);
CREATE INDEX IF NOT EXISTS idx_chatbot_issues_status ON chatbot_issues(status);

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_issues ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on bots" ON bots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on bot_assignments" ON bot_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on subscriptions" ON subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on billing_plans" ON billing_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on chatbot_issues" ON chatbot_issues FOR ALL USING (true) WITH CHECK (true);
