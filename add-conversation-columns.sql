-- Add Content Moderation / Flagging columns to conversations table
-- Run this SQL on your PostgreSQL database

-- Create enum type for review_status if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_review_status_enum') THEN
        CREATE TYPE conversation_review_status_enum AS ENUM ('pending', 'approved', 'rejected', 'resolved');
    END IF;
END $$;

-- Add is_flagged column
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT false;

-- Add flag_reason column
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- Add flagged_by column
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS flagged_by UUID;

-- Add flagged_at column
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP;

-- Add review_status column
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS review_status conversation_review_status_enum;

-- Add reviewed_by column
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- Add reviewed_at column
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- Add review_notes column
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_is_flagged ON conversations(is_flagged);
CREATE INDEX IF NOT EXISTS idx_conversations_review_status ON conversations(review_status);

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'conversations'
AND column_name IN ('is_flagged', 'flag_reason', 'flagged_by', 'flagged_at', 'review_status', 'reviewed_by', 'reviewed_at', 'review_notes')
ORDER BY column_name;
