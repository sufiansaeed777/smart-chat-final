-- Phase 4: Add subscription and billing fields to users table
-- Run this migration to add the new columns for subscription management

-- Add subscription plan (enum type)
DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'professional', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add subscription status (enum type)
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'suspended', 'trialing');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add subscription plan column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_plan subscription_plan NOT NULL DEFAULT 'free';

-- Add subscription status column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_status subscription_status;

-- Add Stripe customer ID
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Add Stripe subscription ID
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Add messages used this month counter
ALTER TABLE users
ADD COLUMN IF NOT EXISTS messages_used_this_month INTEGER NOT NULL DEFAULT 0;

-- Add billing cycle start date
ALTER TABLE users
ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMP;

-- Add billing cycle end date
ALTER TABLE users
ADD COLUMN IF NOT EXISTS billing_cycle_end TIMESTAMP;

-- Add subscription started at
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP;

-- Add subscription ended at
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_ended_at TIMESTAMP;

-- Create index on stripe_customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Create index on subscription_plan for analytics
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan);

-- Create index on subscription_status for filtering
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

COMMENT ON COLUMN users.subscription_plan IS 'User subscription tier (free, starter, professional, enterprise)';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status (active, past_due, cancelled, suspended, trialing)';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN users.messages_used_this_month IS 'Number of messages used in current billing cycle';
COMMENT ON COLUMN users.billing_cycle_start IS 'Start of current billing cycle';
COMMENT ON COLUMN users.billing_cycle_end IS 'End of current billing cycle';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Phase 4 migration completed successfully! Subscription fields added to users table.';
END $$;
