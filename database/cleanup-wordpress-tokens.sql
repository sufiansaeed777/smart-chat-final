-- =====================================================
-- CLEANUP SCRIPT: 1 Bot = 1 Site = 1 Token Model
-- =====================================================
-- Run this in Supabase SQL Editor to clean up old tokens
-- and ensure each bot has only 1 active token
-- =====================================================

-- Step 1: Delete all inactive tokens (is_active = false)
DELETE FROM wordpress_tokens
WHERE is_active = false;

-- Step 2: For each bot that has multiple active tokens,
-- keep only the most recent one and delete the rest
WITH ranked_tokens AS (
  SELECT
    id,
    bot_id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY bot_id, user_id
      ORDER BY created_at DESC
    ) as rn
  FROM wordpress_tokens
  WHERE is_active = true
)
DELETE FROM wordpress_tokens
WHERE id IN (
  SELECT id
  FROM ranked_tokens
  WHERE rn > 1
);

-- Step 3: Verify cleanup - this should show 0 or 1 token per bot
-- Run this to check the result:
SELECT
  bot_id,
  user_id,
  COUNT(*) as token_count,
  MAX(created_at) as latest_token_created
FROM wordpress_tokens
WHERE is_active = true
GROUP BY bot_id, user_id
ORDER BY token_count DESC;

-- Expected result: All bots should have token_count = 1
