-- =====================================================
-- SQL Script to Clean Up Duplicate Documents
-- =====================================================
-- This script removes duplicate documents (same name + userId)
-- keeping only the oldest copy and updating all bot relationships
-- =====================================================

BEGIN;

-- Step 1: Create a temporary table to identify duplicates and documents to keep
CREATE TEMP TABLE docs_to_keep AS
SELECT DISTINCT ON (name, "userId")
    id as keep_id,
    name,
    "userId"
FROM documents
WHERE status = 'active'
ORDER BY name, "userId", "createdAt" ASC; -- Keep oldest document

-- Step 2: Create a temporary table of duplicate documents to remove
CREATE TEMP TABLE docs_to_remove AS
SELECT d.id as duplicate_id, dtk.keep_id, d.name, d."userId"
FROM documents d
INNER JOIN docs_to_keep dtk ON d.name = dtk.name AND d."userId" = dtk."userId"
WHERE d.id != dtk.keep_id
AND d.status = 'active';

-- Step 3: Show what will be cleaned up (for verification)
SELECT
    name as "Document Name",
    "userId" as "User ID",
    COUNT(*) as "Duplicates to Remove"
FROM docs_to_remove
GROUP BY name, "userId"
ORDER BY name;

-- Step 4: Update bot_documents to point to the kept document
-- (Avoiding duplicates in bot_documents table)
UPDATE bot_documents bd
SET "documentId" = dtr.keep_id
FROM docs_to_remove dtr
WHERE bd."documentId" = dtr.duplicate_id
AND NOT EXISTS (
    SELECT 1 FROM bot_documents bd2
    WHERE bd2."botId" = bd."botId"
    AND bd2."documentId" = dtr.keep_id
);

-- Step 5: Delete bot_documents relationships that would become duplicates
DELETE FROM bot_documents bd
USING docs_to_remove dtr
WHERE bd."documentId" = dtr.duplicate_id
AND EXISTS (
    SELECT 1 FROM bot_documents bd2
    WHERE bd2."botId" = bd."botId"
    AND bd2."documentId" = dtr.keep_id
);

-- Step 6: Mark duplicate documents as deleted
UPDATE documents d
SET status = 'deleted'
FROM docs_to_remove dtr
WHERE d.id = dtr.duplicate_id;

-- Step 7: Show summary of cleanup
SELECT
    'Total duplicate documents marked as deleted' as "Summary",
    COUNT(*) as "Count"
FROM docs_to_remove;

-- Clean up temp tables
DROP TABLE docs_to_keep;
DROP TABLE docs_to_remove;

-- Commit the transaction
-- IMPORTANT: Review the output above before committing
-- If everything looks correct, uncomment the line below:
-- COMMIT;

-- If you want to rollback instead, uncomment the line below:
ROLLBACK;
