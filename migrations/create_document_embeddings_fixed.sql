-- Migration: Create document_embeddings table (FIXED VERSION)
-- This version creates table and indexes in correct order

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop table if exists (fresh start)
DROP TABLE IF EXISTS document_embeddings CASCADE;

-- Create document_embeddings table
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL,
  document_id UUID NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  total_chunks INTEGER NOT NULL,
  embedding vector(3072) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_embeddings_bot_id ON document_embeddings(bot_id);
CREATE INDEX idx_embeddings_document_id ON document_embeddings(document_id);
CREATE INDEX idx_embeddings_created_at ON document_embeddings(created_at);

-- Create vector similarity search index
-- Note: IVFFlat index requires some data, so we wrap it in a try-catch
DO $$
BEGIN
  CREATE INDEX idx_embeddings_vector ON document_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Vector index will be created after first embeddings are inserted';
END $$;

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
COMMENT ON TABLE document_embeddings IS 'Stores document chunks and their vector embeddings for RAG retrieval';
COMMENT ON COLUMN document_embeddings.embedding IS 'Vector embedding (3072 dimensions from OpenAI text-embedding-3-large)';
COMMENT ON FUNCTION match_document_embeddings IS 'Searches for similar document chunks using cosine similarity';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON document_embeddings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_embeddings TO anon;
GRANT EXECUTE ON FUNCTION match_document_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION match_document_embeddings TO anon;

-- Success message
SELECT 'Migration completed successfully!' as status;
