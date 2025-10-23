/**
 * Embedding Generation Service
 * Generates vector embeddings using OpenAI API
 * Stores embeddings in Supabase vector database
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface EmbeddingMetadata {
  botId: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  totalChunks: number;
}

export interface EmbeddingResult {
  success: boolean;
  embeddingsCreated: number;
  error?: string;
}

/**
 * Generate embeddings for text chunks
 */
export async function generateEmbeddings(
  chunks: string[],
  metadata: EmbeddingMetadata
): Promise<EmbeddingResult> {
  try {
    const embeddingsCreated: number[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Skip empty chunks
      if (!chunk.trim()) {
        continue;
      }

      try {
        // Generate embedding using OpenAI
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunk,
          dimensions: 1536,
        });

        const embedding = embeddingResponse.data[0].embedding;

        // Store in Supabase
        const { error } = await supabase.from('document_embeddings').insert({
          bot_id: metadata.botId,
          document_id: metadata.documentId,
          document_name: metadata.documentName,
          chunk_text: chunk,
          chunk_index: i,
          total_chunks: chunks.length,
          embedding: embedding,
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.error('Supabase insert error:', error);
          throw new Error(`Failed to store embedding: ${error.message}`);
        }

        embeddingsCreated.push(i);
        console.log(`✅ Embedding ${i + 1}/${chunks.length} stored for document ${metadata.documentName}`);
      } catch (chunkError) {
        console.error(`Error processing chunk ${i}:`, chunkError);
        // Continue with next chunk instead of failing entirely
      }
    }

    return {
      success: embeddingsCreated.length > 0,
      embeddingsCreated: embeddingsCreated.length,
    };
  } catch (error) {
    console.error('Embedding generation error:', error);
    return {
      success: false,
      embeddingsCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete all embeddings for a specific document
 */
export async function deleteDocumentEmbeddings(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('document_embeddings')
      .delete()
      .eq('document_id', documentId);

    if (error) {
      throw new Error(error.message);
    }

    console.log(`✅ Deleted embeddings for document: ${documentId}`);

    return { success: true };
  } catch (error) {
    console.error('Error deleting embeddings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete all embeddings for a specific bot
 */
export async function deleteBotEmbeddings(
  botId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('document_embeddings')
      .delete()
      .eq('bot_id', botId);

    if (error) {
      throw new Error(error.message);
    }

    console.log(`✅ Deleted all embeddings for bot: ${botId}`);

    return { success: true };
  } catch (error) {
    console.error('Error deleting bot embeddings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get embedding count for a bot
 */
export async function getBotEmbeddingCount(botId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('document_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('bot_id', botId);

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting embedding count:', error);
    return 0;
  }
}
