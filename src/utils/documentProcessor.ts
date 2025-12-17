/**
 * Document Processing Utilities
 * Handles text extraction from various file formats
 */

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
 * Extract text from PDF buffer with better formatting preservation
 * Uses pdf-parse with workarounds for serverless environment
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Workaround for serverless: pdf-parse uses pdfjs-dist which needs canvas polyfills
    // We'll use pdf-parse/lib/pdf-parse.js directly with a custom test file approach
    // This avoids the automatic pdfjs-dist initialization that requires DOMMatrix

    // Method 1: Try using pdf-parse with the buffer directly
    // The key is to let pdf-parse handle the parsing without custom renderers
    const pdfParse = require('pdf-parse/lib/pdf-parse');

    // Create a minimal data extraction without canvas dependency
    const data = await pdfParse(buffer, {
      // Don't use custom page render (requires DOM)
      pagerender: undefined,
      // Use default max pages
      max: 0,
    });

    // Clean up extracted text
    let text = data.text || '';

    // Preserve paragraph structure
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!text || text.length < 10) {
      throw new Error('No readable text found in PDF');
    }

    return text;
  } catch (error: any) {
    // If pdf-parse fails due to canvas issues, try a simpler fallback
    if (error.message?.includes('DOMMatrix') || error.message?.includes('canvas')) {
      console.warn('PDF parsing failed due to canvas dependency, trying fallback...');
      try {
        // Fallback: Extract raw text using a simpler method
        // This is a basic fallback that extracts visible text strings from PDF
        const text = extractRawTextFromPDFBuffer(buffer);
        if (text && text.length >= 10) {
          return text;
        }
      } catch (fallbackError) {
        console.error('Fallback PDF extraction also failed:', fallbackError);
      }
    }

    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Simple fallback to extract raw text from PDF buffer
 * This is a basic method that finds text strings in the PDF
 */
function extractRawTextFromPDFBuffer(buffer: Buffer): string {
  const content = buffer.toString('binary');
  const textChunks: string[] = [];

  // Find text between BT (begin text) and ET (end text) markers
  const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
  let match;

  while ((match = btEtRegex.exec(content)) !== null) {
    const textBlock = match[1];

    // Extract text from Tj and TJ operators
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(textBlock)) !== null) {
      const text = tjMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
      if (text.trim()) {
        textChunks.push(text);
      }
    }

    // Extract from TJ arrays
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjArrayMatch;
    while ((tjArrayMatch = tjArrayRegex.exec(textBlock)) !== null) {
      const arrayContent = tjArrayMatch[1];
      const stringRegex = /\(([^)]*)\)/g;
      let stringMatch;
      while ((stringMatch = stringRegex.exec(arrayContent)) !== null) {
        const text = stringMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
        if (text.trim()) {
          textChunks.push(text);
        }
      }
    }
  }

  // Join and clean up
  let result = textChunks.join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return result;
}

/**
 * Extract text from Word document with better formatting preservation
 */
export async function extractTextFromWord(buffer: Buffer): Promise<string> {
  try {
    const mammoth = require('mammoth');

    // Use convertToHtml first to get structure, then convert to text with formatting
    const htmlResult = await mammoth.convertToHtml({ buffer });

    if (htmlResult.value) {
      // Convert HTML to formatted text
      let text = htmlResult.value
        // Add double line breaks for paragraphs and headings
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        // Add line breaks before list items
        .replace(/<li>/gi, '• ')
        // Remove all remaining HTML tags
        .replace(/<[^>]+>/g, '')
        // Decode HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Clean up excessive whitespace while preserving intentional line breaks
        .replace(/[ \t]+/g, ' ')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      return text;
    }

    // Fallback to raw text extraction
    const rawResult = await mammoth.extractRawText({ buffer });
    return rawResult.value;
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

  // Clean up content - preserve line breaks for proper formatting
  content = content
    .replace(/[ \t]+/g, ' ')  // Normalize horizontal whitespace only (not newlines)
    .replace(/\r\n/g, '\n')   // Normalize line endings
    .replace(/\n{3,}/g, '\n\n')  // Remove excessive line breaks (3+ becomes 2)
    .replace(/^\s+|\s+$/gm, '')  // Trim each line
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