-- Migration: Create document_embeddings table for vector storage
-- Description: Stores text chunks and their embeddings for RAG retrieval
-- Date: 2025-10-11

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_embeddings table
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL,
  document_id UUID NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  total_chunks INTEGER NOT NULL,
  embedding vector(1536) NOT NULL, -- OpenAI ada-002 produces 1536 dimensions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT fk_bot FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
  CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_embeddings_bot_id ON document_embeddings(bot_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON document_embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_created_at ON document_embeddings(created_at);

-- Create vector similarity search index (IVFFlat for faster searches)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON document_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create function for vector similarity search
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

-- Add comments
COMMENT ON TABLE document_embeddings IS 'Stores document chunks and their vector embeddings for RAG retrieval';
COMMENT ON COLUMN document_embeddings.embedding IS 'Vector embedding (1536 dimensions from OpenAI text-embedding-ada-002)';
COMMENT ON FUNCTION match_document_embeddings IS 'Searches for similar document chunks using cosine similarity';

-- Grant permissions (adjust role name as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON document_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION match_document_embeddings TO authenticated;

-- Example queries:

-- 1. Get all embeddings for a bot
-- SELECT * FROM document_embeddings WHERE bot_id = 'your-bot-id';

-- 2. Search for similar chunks
-- SELECT * FROM match_document_embeddings(
--   '[0.1, 0.2, ...]'::vector,  -- query embedding
--   0.7,                          -- similarity threshold
--   5,                            -- number of results
--   'your-bot-id'                 -- filter by bot
-- );

-- 3. Count embeddings per bot
-- SELECT bot_id, COUNT(*) as embedding_count
-- FROM document_embeddings
-- GROUP BY bot_id;

-- 4. Delete all embeddings for a bot
-- DELETE FROM document_embeddings WHERE bot_id = 'your-bot-id';

-- Rollback (uncomment to rollback)
-- DROP FUNCTION IF EXISTS match_document_embeddings;
-- DROP INDEX IF EXISTS idx_embeddings_vector;
-- DROP INDEX IF EXISTS idx_embeddings_created_at;
-- DROP INDEX IF EXISTS idx_embeddings_document_id;
-- DROP INDEX IF EXISTS idx_embeddings_bot_id;
-- DROP TABLE IF EXISTS document_embeddings;
