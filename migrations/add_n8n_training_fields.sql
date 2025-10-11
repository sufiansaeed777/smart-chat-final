-- Migration: Add n8n training fields to bots table
-- Description: Adds fields to track bot training status, timestamps, and n8n webhook URLs
-- Date: 2025-10-11

-- Add training status column
ALTER TABLE bots
ADD COLUMN IF NOT EXISTS training_status VARCHAR(20) DEFAULT 'untrained'
CHECK (training_status IN ('untrained', 'training', 'trained', 'training_failed'));

-- Add last trained timestamp
ALTER TABLE bots
ADD COLUMN IF NOT EXISTS last_trained_at TIMESTAMP NULL;

-- Add n8n webhook URL for bot-specific chat endpoint
ALTER TABLE bots
ADD COLUMN IF NOT EXISTS n8n_webhook_url VARCHAR(500) NULL;

-- Add training log for debugging
ALTER TABLE bots
ADD COLUMN IF NOT EXISTS training_log TEXT NULL;

-- Create index on training_status for faster queries
CREATE INDEX IF NOT EXISTS idx_bots_training_status ON bots(training_status);

-- Create index on last_trained_at for sorting
CREATE INDEX IF NOT EXISTS idx_bots_last_trained_at ON bots(last_trained_at);

-- Add comments for documentation
COMMENT ON COLUMN bots.training_status IS 'Current training status: untrained, training, trained, or training_failed';
COMMENT ON COLUMN bots.last_trained_at IS 'Timestamp of last successful training via n8n';
COMMENT ON COLUMN bots.n8n_webhook_url IS 'Unique n8n webhook URL for this bot''s chat functionality';
COMMENT ON COLUMN bots.training_log IS 'JSON log of training attempts and results for debugging';

-- Example rollback (commented out - uncomment to rollback)
-- ALTER TABLE bots DROP COLUMN IF EXISTS training_status;
-- ALTER TABLE bots DROP COLUMN IF EXISTS last_trained_at;
-- ALTER TABLE bots DROP COLUMN IF EXISTS n8n_webhook_url;
-- ALTER TABLE bots DROP COLUMN IF EXISTS training_log;
-- DROP INDEX IF EXISTS idx_bots_training_status;
-- DROP INDEX IF EXISTS idx_bots_last_trained_at;
