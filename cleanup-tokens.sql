-- Clean up wordpress_tokens table
-- Keep only the 5 most recent active tokens per bot
-- Delete all older tokens

-- Step 1: Deactivate old tokens (keep only 5 newest per bot)
UPDATE wordpress_tokens
SET is_active = false
WHERE id NOT IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY bot_id ORDER BY created_at DESC) as row_num
    FROM wordpress_tokens
    WHERE is_active = true
  ) ranked
  WHERE row_num <= 5
);

-- Step 2: Delete all inactive tokens (optional - keeps history)
-- Uncomment the line below if you want to permanently delete inactive tokens
-- DELETE FROM wordpress_tokens WHERE is_active = false;

-- Step 3: Show token counts per bot
SELECT
  bot_id,
  COUNT(*) as active_tokens,
  MIN(created_at) as oldest_token,
  MAX(created_at) as newest_token
FROM wordpress_tokens
WHERE is_active = true
GROUP BY bot_id
ORDER BY active_tokens DESC;
