-- Migration: Update document_embeddings to use 1536 dimensions (text-embedding-3-small)
-- Description: Changes from 3072 (text-embedding-3-large) to 1536 (text-embedding-3-small)
-- Date: 2025-10-23
-- Reason: Match n8n configuration and reduce costs

-- Step 1: Delete all existing embeddings (they're 3072 dimensions, incompatible with 1536)
TRUNCATE TABLE document_embeddings;

-- Step 2: Update embedding column to 1536 dimensions
ALTER TABLE document_embeddings
ALTER COLUMN embedding TYPE vector(1536);

-- Step 3: Update the match function to use 1536 dimensions
DROP FUNCTION IF EXISTS match_document_embeddings;

CREATE OR REPLACE FUNCTION match_document_embeddings(
  query_embedding vector(1536),  -- Changed from 3072 to 1536
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
    1 - (document_embeddings.embedding <=> query_embedding) AS similarity
  FROM document_embeddings
  WHERE
    (filter_bot_id IS NULL OR document_embeddings.bot_id = filter_bot_id)
    AND 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY document_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Update comments
COMMENT ON COLUMN document_embeddings.embedding IS 'Vector embedding (1536 dimensions from OpenAI text-embedding-3-small)';
COMMENT ON FUNCTION match_document_embeddings IS 'Searches for similar document chunks using cosine similarity (1536 dimensions)';

-- Verification
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'document_embeddings' AND column_name = 'embedding';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully updated document_embeddings to 1536 dimensions';
  RAISE NOTICE '⚠️  All old embeddings were deleted - you need to re-train all bots';
  RAISE NOTICE '🔧 Using text-embedding-3-small model for consistency with n8n';
END $$;
