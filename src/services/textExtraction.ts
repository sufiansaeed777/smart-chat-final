/**
 * Text Extraction Service
 * Extracts text content from various file types (PDF, CSV, TXT)
 */

// @ts-ignore - pdf-parse has inconsistent type definitions
import pdf from 'pdf-parse';
import { parse } from 'csv-parse/sync';

export interface ExtractionResult {
  text: string;
  metadata: {
    pages?: number;
    words?: number;
    format: string;
  };
}

/**
 * Extract text from PDF buffer
 */
export async function extractFromPDF(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const data = await (pdf as any)(buffer);

    return {
      text: data.text,
      metadata: {
        pages: data.numpages,
        words: data.text.split(/\s+/).length,
        format: 'pdf',
      },
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from CSV buffer
 */
export async function extractFromCSV(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const csvContent = buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Convert CSV rows to readable text
    let text = '';
    for (const record of records) {
      const row = Object.entries(record)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      text += row + '\n';
    }

    return {
      text: text.trim(),
      metadata: {
        words: text.split(/\s+/).length,
        format: 'csv',
      },
    };
  } catch (error) {
    console.error('CSV extraction error:', error);
    throw new Error('Failed to extract text from CSV');
  }
}

/**
 * Extract text from plain text buffer
 */
export async function extractFromText(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const text = buffer.toString('utf-8');

    return {
      text: text.trim(),
      metadata: {
        words: text.split(/\s+/).length,
        format: 'text',
      },
    };
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to extract text from file');
  }
}

/**
 * Main extraction function - auto-detects file type
 */
export async function extractText(
  buffer: Buffer,
  fileType: string
): Promise<ExtractionResult> {
  const type = fileType.toLowerCase();

  if (type === 'pdf' || type === 'application/pdf') {
    return extractFromPDF(buffer);
  }

  if (type === 'csv' || type === 'text/csv') {
    return extractFromCSV(buffer);
  }

  if (
    type === 'txt' ||
    type === 'text/plain' ||
    type === 'md' ||
    type === 'markdown'
  ) {
    return extractFromText(buffer);
  }

  // Default to text extraction for unknown types
  return extractFromText(buffer);
}
