-- Migration: Add prompt detection and priority columns
-- Description: Adds is_prompt and priority_order columns for intelligent context prioritization
-- Date: 2025-10-27
-- Purpose: Enable automatic detection of prompt vs content documents and prioritize them accordingly

-- Step 1: Add is_prompt column (boolean flag)
ALTER TABLE document_embeddings
ADD COLUMN IF NOT EXISTS is_prompt BOOLEAN DEFAULT FALSE;

-- Step 2: Add priority_order column (integer, lower = higher priority)
ALTER TABLE document_embeddings
ADD COLUMN IF NOT EXISTS priority_order INTEGER DEFAULT 100;

-- Step 3: Create index on priority_order for efficient sorting
CREATE INDEX IF NOT EXISTS idx_embeddings_priority ON document_embeddings(priority_order);

-- Step 4: Create index on is_prompt for filtering
CREATE INDEX IF NOT EXISTS idx_embeddings_is_prompt ON document_embeddings(is_prompt);

-- Step 5: Update the match function to prioritize prompt documents
DROP FUNCTION IF EXISTS match_document_embeddings;

CREATE OR REPLACE FUNCTION match_document_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_bot_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  bot_id UUID,
  document_id UUID,
  document_name VARCHAR,
  chunk_text TEXT,
  chunk_index INTEGER,
  is_prompt BOOLEAN,
  priority_order INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_embeddings.id,
    document_embeddings.bot_id,
    document_embeddings.document_id,
    document_embeddings.document_name,
    document_embeddings.chunk_text,
    document_embeddings.chunk_index,
    document_embeddings.is_prompt,
    document_embeddings.priority_order,
    1 - (document_embeddings.embedding <=> query_embedding) AS similarity
  FROM document_embeddings
  WHERE
    (filter_bot_id IS NULL OR document_embeddings.bot_id = filter_bot_id)
    AND 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY
    document_embeddings.priority_order ASC,  -- Prioritize by priority_order first
    document_embeddings.embedding <=> query_embedding ASC  -- Then by similarity
  LIMIT match_count;
END;
$$;

-- Add comments
COMMENT ON COLUMN document_embeddings.is_prompt IS 'TRUE if document contains system prompts/instructions, FALSE if regular content';
COMMENT ON COLUMN document_embeddings.priority_order IS 'Priority order (1=highest/prompts, 100=normal/content). Lower values appear first in results.';
COMMENT ON FUNCTION match_document_embeddings IS 'Searches for similar document chunks, prioritizing prompt documents over content';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully added prompt detection columns';
  RAISE NOTICE '📊 is_prompt: Boolean flag for prompt vs content documents';
  RAISE NOTICE '🎯 priority_order: Integer priority (1=prompts, 100=content)';
  RAISE NOTICE '🔍 Updated match function to prioritize prompts in results';
END $$;
