-- CLEANUP: Delete oldest 5 tokens from EVERY bot
-- Run this once to clean up excess tokens

-- Step 1: See current token counts per bot (BEFORE cleanup)
SELECT
  bot_id,
  COUNT(*) as total_active_tokens,
  MIN(created_at) as oldest_token_date,
  MAX(created_at) as newest_token_date
FROM wordpress_tokens
WHERE is_active = true
GROUP BY bot_id
ORDER BY total_active_tokens DESC;

-- Step 2: Deactivate all tokens EXCEPT the 5 newest per bot
-- If bot has 10 tokens, this deactivates the oldest 5
-- If bot has 6 tokens, this deactivates the oldest 1
-- If bot has 5 or less, nothing is deactivated
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
  WHERE row_num <= 5  -- Keep the 5 NEWEST tokens
)
AND is_active = true;

-- Step 3: See token counts AFTER cleanup
SELECT
  bot_id,
  COUNT(*) as total_active_tokens,
  MIN(created_at) as oldest_token_date,
  MAX(created_at) as newest_token_date
FROM wordpress_tokens
WHERE is_active = true
GROUP BY bot_id
ORDER BY total_active_tokens DESC;

-- Step 4: (OPTIONAL) Permanently delete deactivated tokens
-- Uncomment if you want to remove them from database entirely
-- DELETE FROM wordpress_tokens WHERE is_active = false;

-- Step 5: Verify - should show max 5 tokens per bot
SELECT
  bot_id,
  COUNT(*) as active_tokens
FROM wordpress_tokens
WHERE is_active = true
GROUP BY bot_id
HAVING COUNT(*) > 5;
-- Should return 0 rows if cleanup worked
