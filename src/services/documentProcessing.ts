import { AppDataSource } from '@/config/database';
import { Document } from '@/entities/Document';
import { DocumentEmbedding } from '@/entities/DocumentEmbedding';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200; // overlap between chunks

/**
 * Split text into chunks with overlap
 */
export function chunkText(text: string, chunkSize: number = CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    const chunk = text.slice(startIndex, endIndex);

    // Only add non-empty chunks
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }

    // Move forward by chunkSize minus overlap
    startIndex += chunkSize - overlap;

    // Prevent infinite loop
    if (startIndex >= text.length - overlap) {
      break;
    }
  }

  return chunks;
}

/**
 * Count approximate tokens in text (rough estimate: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Generate embedding using OpenAI API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Process document: chunk text and generate embeddings
 */
export async function processDocument(documentId: string, botId: string): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const documentRepository = AppDataSource.getRepository(Document);
  const embeddingRepository = AppDataSource.getRepository(DocumentEmbedding);

  // Get document
  const document = await documentRepository.findOne({
    where: { id: documentId }
  });

  if (!document) {
    throw new Error('Document not found');
  }

  if (!document.content) {
    throw new Error('Document has no content to process');
  }

  console.log(`Processing document: ${document.name}`);

  // Delete existing embeddings for this document
  await embeddingRepository.delete({ documentId, botId });

  // Chunk the document
  const chunks = chunkText(document.content);
  console.log(`Created ${chunks.length} chunks`);

  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Processing chunk ${i + 1}/${chunks.length}...`);

    try {
      // Generate embedding
      const embedding = await generateEmbedding(chunk);

      // Save to database
      const docEmbedding = embeddingRepository.create({
        documentId,
        botId,
        content: chunk,
        embedding,
        chunkIndex: i,
        tokenCount: estimateTokens(chunk),
        metadata: JSON.stringify({
          documentName: document.name,
          documentType: document.type,
          chunkIndex: i,
          totalChunks: chunks.length
        })
      });

      await embeddingRepository.save(docEmbedding);
      console.log(`✓ Chunk ${i + 1} processed and saved`);
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
      throw error;
    }
  }

  console.log(`✓ Document processing complete: ${chunks.length} embeddings created`);
}

/**
 * Search for relevant document chunks using vector similarity
 */
export async function searchSimilarChunks(
  botId: string,
  query: string,
  limit: number = 5
): Promise<Array<{ content: string; similarity: number; metadata: string }>> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Perform vector similarity search using pgvector
    // Using cosine distance: <=> operator
    const embeddingRepository = AppDataSource.getRepository(DocumentEmbedding);

    const results = await embeddingRepository
      .createQueryBuilder('embedding')
      .select([
        'embedding.content',
        'embedding.metadata',
        'embedding.embedding <=> :queryEmbedding AS similarity'
      ])
      .where('embedding.botId = :botId', { botId })
      .andWhere('embedding.embedding IS NOT NULL')
      .setParameter('queryEmbedding', JSON.stringify(queryEmbedding))
      .orderBy('similarity', 'ASC')
      .limit(limit)
      .getRawMany();

    return results.map((result: any) => ({
      content: result.embedding_content,
      similarity: parseFloat(result.similarity),
      metadata: result.embedding_metadata
    }));
  } catch (error) {
    console.error('Error searching similar chunks:', error);
    return [];
  }
}

/**
 * Build context from relevant chunks for RAG
 */
export async function buildRAGContext(botId: string, query: string): Promise<string> {
  const chunks = await searchSimilarChunks(botId, query, 3);

  if (chunks.length === 0) {
    return '';
  }

  const context = chunks
    .map((chunk, index) => {
      const meta = JSON.parse(chunk.metadata);
      return `[Source: ${meta.documentName}]\n${chunk.content}`;
    })
    .join('\n\n---\n\n');

  return `Relevant information from knowledge base:\n\n${context}\n\n---\n\nUse the above information to answer the user's question accurately.`;
}
