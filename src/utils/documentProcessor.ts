/**
 * Document Processing Utilities
 * Handles text extraction from various file formats
 */

import { PDFExtract } from 'pdf-extract';

export interface ProcessedDocument {
  content: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    format: string;
  };
  chunks?: string[];
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // For serverless environment, use pdf-parse
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);

    return data.text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from Word document
 */
export async function extractTextFromWord(buffer: Buffer): Promise<string> {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });

    return result.value;
  } catch (error) {
    console.error('Error extracting Word text:', error);
    throw new Error('Failed to extract text from Word document');
  }
}

/**
 * Split text into chunks for embedding
 */
export function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Process any document type
 */
export async function processDocument(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ProcessedDocument> {
  let content = '';
  let format = 'unknown';

  // Handle different file types
  switch (mimeType) {
    case 'application/pdf':
      content = await extractTextFromPDF(buffer);
      format = 'pdf';
      break;

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      content = await extractTextFromWord(buffer);
      format = 'word';
      break;

    case 'text/plain':
    case 'text/csv':
    case 'text/markdown':
      content = buffer.toString('utf-8');
      format = 'text';
      break;

    case 'application/json':
      const jsonData = JSON.parse(buffer.toString('utf-8'));
      content = JSON.stringify(jsonData, null, 2);
      format = 'json';
      break;

    default:
      // Try to extract as plain text
      content = buffer.toString('utf-8');
      format = 'text';
  }

  // Clean up content
  content = content
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')  // Remove excessive line breaks
    .trim();

  // Generate chunks for vector embedding
  const chunks = chunkText(content);

  // Calculate metadata
  const wordCount = content.split(/\s+/).length;

  return {
    content,
    metadata: {
      wordCount,
      format
    },
    chunks
  };
}

/**
 * Prepare document for training
 */
export async function prepareDocumentForTraining(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<{
  content: string;
  chunks: string[];
  metadata: any;
}> {
  const processed = await processDocument(buffer, mimeType, filename);

  // Ensure we have valid content
  if (!processed.content || processed.content.length < 10) {
    throw new Error('Document contains insufficient content for training');
  }

  // Ensure chunks are properly sized
  const validChunks = processed.chunks?.filter(chunk => chunk.length > 50) || [];

  if (validChunks.length === 0) {
    // If no valid chunks, create at least one from the content
    validChunks.push(processed.content.substring(0, 1000));
  }

  return {
    content: processed.content,
    chunks: validChunks,
    metadata: {
      ...processed.metadata,
      filename,
      mimeType,
      chunkCount: validChunks.length,
      processedAt: new Date().toISOString()
    }
  };
}