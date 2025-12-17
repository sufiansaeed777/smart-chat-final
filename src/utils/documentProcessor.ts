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
 * Uses raw text extraction for serverless environment (avoids pdfjs-dist DOMMatrix issues)
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // In serverless environments, pdf-parse uses pdfjs-dist which requires DOMMatrix
  // We use a simple raw text extraction method instead
  try {
    console.log('Extracting PDF text using serverless-compatible method...');

    // Use raw text extraction that doesn't require pdfjs-dist/canvas
    const text = extractRawTextFromPDFBuffer(buffer);

    if (text && text.length >= 10) {
      console.log(`Successfully extracted ${text.length} characters from PDF`);
      return text;
    }

    // If raw extraction didn't work, the PDF might be image-based or encrypted
    throw new Error('No readable text found in PDF (may be image-based or encrypted)');
  } catch (error: any) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Extract raw text from PDF buffer without external dependencies
 * Handles both uncompressed and some compressed PDF streams
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

    // Extract from ' operator (move to next line and show text)
    const quoteRegex = /\(([^)]*)\)\s*'/g;
    let quoteMatch;
    while ((quoteMatch = quoteRegex.exec(textBlock)) !== null) {
      const text = decodePDFString(quoteMatch[1]);
      if (text.trim()) {
        textChunks.push('\n' + text);
      }
    }
  }

  // Method 2: Also try to find hex-encoded strings
  const hexStringRegex = /<([0-9A-Fa-f]+)>/g;
  let hexMatch;
  while ((hexMatch = hexStringRegex.exec(content)) !== null) {
    const hexStr = hexMatch[1];
    if (hexStr.length >= 4 && hexStr.length % 2 === 0) {
      try {
        let text = '';
        for (let i = 0; i < hexStr.length; i += 2) {
          const charCode = parseInt(hexStr.substr(i, 2), 16);
          if (charCode >= 32 && charCode < 127) {
            text += String.fromCharCode(charCode);
          }
        }
        if (text.length >= 3 && /[a-zA-Z]/.test(text)) {
          textChunks.push(text);
        }
      } catch {}
    }
  }

  // Method 3: Extract any readable text sequences (fallback)
  if (textChunks.length === 0) {
    // Find sequences of readable ASCII characters
    const readableRegex = /[\x20-\x7E]{10,}/g;
    let readableMatch;
    while ((readableMatch = readableRegex.exec(content)) !== null) {
      const text = readableMatch[0];
      // Filter out PDF keywords and binary sequences
      if (!text.match(/^(stream|endstream|obj|endobj|xref|trailer|startxref)/i) &&
          text.match(/[a-zA-Z]{3,}/)) {
        textChunks.push(text);
      }
    }
  }

  // Join and clean up
  let result = textChunks.join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
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