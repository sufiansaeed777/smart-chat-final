/**
 * OpenAI Training Service
 * Handles document training directly with OpenAI API
 * Bypasses n8n completely as per architecture design
 */

import OpenAI from 'openai';
import { AppDataSource } from '@/config/database';
import { Bot } from '@/entities/Bot';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TrainingResult {
  success: boolean;
  documentId: string;
  documentName: string;
  embeddingsCreated: number;
  error?: string;
}

/**
 * Train a bot with documents using OpenAI directly
 * This bypasses n8n completely as n8n is only for RAG retrieval
 */
export async function trainBotWithDocuments(
  botId: string,
  documents: Array<{
    id: string;
    name: string;
    content: string;
    chunks?: string[];
  }>
): Promise<TrainingResult[]> {
  const results: TrainingResult[] = [];

  console.log(`🚀 Starting DIRECT OpenAI training for bot ${botId}`);
  console.log(`📄 Processing ${documents.length} documents`);
  console.log(`🔧 Using text-embedding-3-small (1536 dimensions)`);

  for (const doc of documents) {
    try {
      console.log(`\n📝 Processing document: ${doc.name}`);

      // Get chunks (either provided or split content)
      const chunks = doc.chunks || splitIntoChunks(doc.content);
      console.log(`📊 Created ${chunks.length} chunks`);

      // Generate embeddings for each chunk
      const embeddingsCreated = await createEmbeddings(
        botId,
        doc.id,
        doc.name,
        chunks
      );

      results.push({
        success: true,
        documentId: doc.id,
        documentName: doc.name,
        embeddingsCreated,
      });

      console.log(`✅ Successfully created ${embeddingsCreated} embeddings for ${doc.name}`);
    } catch (error: any) {
      console.error(`❌ Failed to process ${doc.name}:`, error);
      results.push({
        success: false,
        documentId: doc.id,
        documentName: doc.name,
        embeddingsCreated: 0,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Create embeddings using OpenAI text-embedding-3-large
 */
async function createEmbeddings(
  botId: string,
  documentId: string,
  documentName: string,
  chunks: string[]
): Promise<number> {
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new Error('Database connection failed');
    }
  }

  // Delete existing embeddings for this bot+document to prevent duplicates
  console.log(`🗑️  Removing old embeddings for document ${documentName}...`);
  const deleteResult = await AppDataSource.query(
    `DELETE FROM document_embeddings WHERE bot_id = $1 AND document_id = $2`,
    [botId, documentId]
  );
  console.log(`✅ Deleted ${deleteResult[1] || 0} old embeddings`);

  let embeddingsCreated = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    try {
      // Generate embedding using OpenAI
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk,
        dimensions: 1536, // Match pgvector dimension and n8n configuration
      });

      const embedding = response.data[0].embedding;

      // Store in pgvector database (matching actual table schema)
      await AppDataSource.query(
        `
        INSERT INTO document_embeddings
        (id, bot_id, document_id, document_name, chunk_text, chunk_index, total_chunks, embedding, created_at)
        VALUES
        (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())
        `,
        [
          botId,
          documentId,
          documentName,
          chunk,
          i,
          chunks.length,
          JSON.stringify(embedding), // pgvector will handle conversion
        ]
      );

      embeddingsCreated++;
    } catch (error) {
      console.error(`Failed to create embedding for chunk ${i + 1}:`, error);
      throw error;
    }
  }

  return embeddingsCreated;
}

/**
 * Split text into chunks for embedding
 * OpenAI embedding API limit: 8192 tokens
 * Approximation: 1 token ≈ 4 characters, so 8192 tokens ≈ 32,000 characters
 * Using 6000 characters as safe limit (≈1500 tokens) with overlap
 */
function splitIntoChunks(text: string, maxChunkSize: number = 6000): string[] {
  const chunks: string[] = [];

  // If text is shorter than max, return as single chunk
  if (text.length <= maxChunkSize) {
    return [text];
  }

  // Split by sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();

    // If a single sentence is too large, split it by words
    if (trimmedSentence.length > maxChunkSize) {
      // Save current chunk if exists
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // Split large sentence by words
      const words = trimmedSentence.split(/\s+/);
      let wordChunk = '';

      for (const word of words) {
        if ((wordChunk + ' ' + word).length > maxChunkSize && wordChunk) {
          chunks.push(wordChunk.trim());
          wordChunk = word;
        } else {
          wordChunk += (wordChunk ? ' ' : '') + word;
        }
      }

      if (wordChunk) {
        currentChunk = wordChunk;
      }
      continue;
    }

    // Normal sentence processing
    if ((currentChunk + ' ' + trimmedSentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Search for relevant chunks using vector similarity
 * This is used by n8n for RAG retrieval
 */
export async function searchSimilarChunks(
  botId: string,
  query: string,
  limit: number = 5
): Promise<Array<{ content: string; similarity: number }>> {
  try {
    // Generate embedding for the query
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: query,
      dimensions: 3072,
    });

    const queryEmbedding = response.data[0].embedding;

    // Search in pgvector using cosine similarity
    const results = await AppDataSource.query(
      `
      SELECT
        chunk_text as content,
        1 - (embedding <=> $2::vector) as similarity
      FROM document_embeddings
      WHERE bot_id = $1
      ORDER BY embedding <=> $2::vector
      LIMIT $3
      `,
      [botId, JSON.stringify(queryEmbedding), limit]
    );

    return results;
  } catch (error) {
    console.error('Error searching similar chunks:', error);
    return [];
  }
}

/**
 * Update bot training status
 */
export async function updateBotTrainingStatus(
  botId: string,
  status: 'training' | 'trained' | 'training_failed',
  log?: string
): Promise<void> {
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new Error('Database connection failed');
    }
  }

  const botRepository = AppDataSource.getRepository(Bot);

  await botRepository.update(
    { id: botId },
    {
      trainingStatus: status,
      lastTrainedAt: status === 'trained' ? new Date() : undefined,
      trainingLog: log,
    }
  );
}