-- Migration: Create document_embeddings table for vector storage (Production Version)
-- Description: Stores text chunks and their embeddings for RAG retrieval
-- Note: Supabase pgvector has 2000 dimension limit for indexes, so vector index is omitted
--       Similarity search still works, just without index optimization

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
  embedding vector(3072) NOT NULL, -- OpenAI text-embedding-3-large: 3072 dimensions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT fk_bot FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
  CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Create indexes for performance (regular B-tree indexes)
CREATE INDEX IF NOT EXISTS idx_embeddings_bot_id ON document_embeddings(bot_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON document_embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_created_at ON document_embeddings(created_at);

-- NOTE: Vector index omitted due to Supabase 2000 dimension limit
-- Similarity search will work via sequential scan (acceptable for moderate data volumes)

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION match_document_embeddings(
  query_embedding vector(3072),
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
COMMENT ON TABLE document_embeddings IS 'Stores document chunks and their embeddings for RAG retrieval';
COMMENT ON COLUMN document_embeddings.embedding IS 'Vector embedding (3072 dimensions from OpenAI text-embedding-3-large)';
COMMENT ON FUNCTION match_document_embeddings IS 'Searches for similar document chunks using cosine similarity';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON document_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION match_document_embeddings TO authenticated;

-- Performance Notes:
-- Without vector index, search performance depends on:
-- 1. bot_id index filters results first (fast)
-- 2. Sequential scan for similarity (acceptable for <100k embeddings per bot)
-- 3. For large datasets (>100k embeddings), consider reducing dimensions to 1536
--    by using text-embedding-3-small model instead
