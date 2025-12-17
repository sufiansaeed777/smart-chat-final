/**
 * Document Processing Utilities
 * Handles text extraction from various file formats
 * Serverless-compatible (no canvas/DOM dependencies)
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
 * Extract text from PDF buffer using unpdf (serverless-compatible)
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('Extracting PDF text using unpdf...');

    // Use unpdf which is serverless-compatible
    const { extractText } = await import('unpdf');

    // Convert Buffer to Uint8Array for unpdf
    const uint8Array = new Uint8Array(buffer);

    const { text } = await extractText(uint8Array);

    if (!text || text.trim().length < 10) {
      throw new Error('No readable text found in PDF');
    }

    // Clean up the extracted text
    const cleanedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    console.log(`Successfully extracted ${cleanedText.length} characters from PDF`);
    return cleanedText;

  } catch (error: any) {
    console.error('Error extracting PDF text with unpdf:', error);

    // Try fallback method for simple PDFs
    try {
      console.log('Trying fallback PDF extraction...');
      const fallbackText = extractRawTextFromPDFBuffer(buffer);
      if (fallbackText && fallbackText.length >= 10) {
        console.log(`Fallback extraction got ${fallbackText.length} characters`);
        return fallbackText;
      }
    } catch (fallbackError) {
      console.error('Fallback PDF extraction also failed:', fallbackError);
    }

    throw new Error('Failed to extract text from PDF: ' + (error.message || 'Unknown error'));
  }
}

/**
 * Fallback: Extract raw text from PDF buffer without external dependencies
 */
function extractRawTextFromPDFBuffer(buffer: Buffer): string {
  const content = buffer.toString('binary');
  const textChunks: string[] = [];

  // Method 1: Find text between BT (begin text) and ET (end text) markers
  const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
  let match;

  while ((match = btEtRegex.exec(content)) !== null) {
    const textBlock = match[1];

    // Extract text from Tj operator (show text)
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(textBlock)) !== null) {
      const text = decodePDFString(tjMatch[1]);
      if (text.trim()) {
        textChunks.push(text);
      }
    }

    // Extract from TJ arrays (show text with positioning)
    const tjArrayRegex = /\[(.*?)\]\s*TJ/gi;
    let tjArrayMatch;
    while ((tjArrayMatch = tjArrayRegex.exec(textBlock)) !== null) {
      const arrayContent = tjArrayMatch[1];
      const stringRegex = /\(([^)]*)\)/g;
      let stringMatch;
      while ((stringMatch = stringRegex.exec(arrayContent)) !== null) {
        const text = decodePDFString(stringMatch[1]);
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
 * Decode PDF string escape sequences
 */
function decodePDFString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\(\d{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
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
      // Convert HTML to formatted text with proper line breaks
      let text = htmlResult.value
        // Add double line breaks for paragraphs and headings
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/tr>/gi, '\n')  // Table rows
        .replace(/<\/li>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        // Add line breaks before list items
        .replace(/<li>/gi, '• ')
        // Add tab for table cells
        .replace(/<td[^>]*>/gi, '\t')
        .replace(/<th[^>]*>/gi, '\t')
        // Remove all remaining HTML tags
        .replace(/<[^>]+>/g, '')
        // Decode HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&ndash;/g, '–')
        .replace(/&mdash;/g, '—')
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
    return rawResult.value || '';
  } catch (error) {
    console.error('Error extracting Word text:', error);
    throw new Error('Failed to extract text from Word document');
  }
}

/**
 * Extract text from plain text files
 */
export function extractTextFromPlainText(buffer: Buffer): string {
  // Convert buffer to string
  let text = buffer.toString('utf-8');

  // Remove BOM if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Trim but preserve internal formatting
  text = text.trim();

  return text;
}

/**
 * Split text into chunks for embedding
 */
export function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];

  // First, try to split by paragraphs
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the limit
    if ((currentChunk + '\n\n' + paragraph).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + paragraph : paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // If we got no chunks or very few, fall back to sentence splitting
  if (chunks.length === 0 || (chunks.length === 1 && chunks[0].length > maxChunkSize * 2)) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    chunks.length = 0;
    currentChunk = '';

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

  console.log(`Processing document: ${filename} (${mimeType})`);

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
      content = extractTextFromPlainText(buffer);
      format = 'text';
      break;

    case 'application/json':
      try {
        const jsonData = JSON.parse(buffer.toString('utf-8'));
        content = JSON.stringify(jsonData, null, 2);
      } catch {
        content = buffer.toString('utf-8');
      }
      format = 'json';
      break;

    default:
      // Try to extract as plain text
      content = extractTextFromPlainText(buffer);
      format = 'text';
  }

  // Validate content
  if (!content || content.length < 5) {
    throw new Error(`No readable content found in ${filename}`);
  }

  console.log(`Extracted ${content.length} characters from ${filename}`);

  // Generate chunks for vector embedding
  const chunks = chunkText(content);

  // Calculate metadata
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

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
