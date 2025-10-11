/**
 * Text Chunking Service
 * Implements RecursiveCharacterTextSplitter logic similar to LangChain
 * Splits text into chunks while preserving context
 */

export interface ChunkingOptions {
  chunkSize: number; // Characters per chunk
  chunkOverlap: number; // Overlap between chunks
  separators?: string[]; // Separators to try (in order)
}

const DEFAULT_SEPARATORS = [
  '\n\n', // Paragraph breaks
  '\n', // Line breaks
  '. ', // Sentence ends
  ', ', // Clause breaks
  ' ', // Word breaks
  '', // Character level
];

/**
 * Recursive Character Text Splitter
 * Splits text intelligently at natural boundaries
 */
export class RecursiveCharacterTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(options: ChunkingOptions) {
    this.chunkSize = options.chunkSize;
    this.chunkOverlap = options.chunkOverlap;
    this.separators = options.separators || DEFAULT_SEPARATORS;
  }

  /**
   * Split text into chunks
   */
  splitText(text: string): string[] {
    if (!text || text.length === 0) {
      return [];
    }

    // If text is smaller than chunk size, return as-is
    if (text.length <= this.chunkSize) {
      return [text];
    }

    // Try each separator
    for (const separator of this.separators) {
      if (separator === '') {
        // Character level split (last resort)
        return this.splitByCharacter(text);
      }

      if (text.includes(separator)) {
        return this.splitBySeparator(text, separator);
      }
    }

    // Fallback to character split
    return this.splitByCharacter(text);
  }

  /**
   * Split text by a specific separator
   */
  private splitBySeparator(text: string, separator: string): string[] {
    const splits = text.split(separator);
    const chunks: string[] = [];
    let currentChunk = '';

    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];

      // Add separator back (except for last split)
      const piece = i < splits.length - 1 ? split + separator : split;

      // If adding this piece would exceed chunk size
      if (currentChunk.length + piece.length > this.chunkSize) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());

          // Start new chunk with overlap
          const overlapText = this.getOverlap(currentChunk);
          currentChunk = overlapText + piece;
        } else {
          // Piece itself is too large, need to split it further
          if (piece.length > this.chunkSize) {
            // Try next separator
            const subChunks = this.recursiveSplit(piece);
            chunks.push(...subChunks);
            currentChunk = '';
          } else {
            currentChunk = piece;
          }
        }
      } else {
        currentChunk += piece;
      }
    }

    // Add remaining chunk
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Recursively split with next separator
   */
  private recursiveSplit(text: string): string[] {
    const currentIndex = this.separators.indexOf(
      this.separators.find((s) => text.includes(s)) || ''
    );
    const nextSeparators = this.separators.slice(currentIndex + 1);

    if (nextSeparators.length === 0) {
      return this.splitByCharacter(text);
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
      separators: nextSeparators,
    });

    return splitter.splitText(text);
  }

  /**
   * Split by character (last resort)
   */
  private splitByCharacter(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start = end - this.chunkOverlap;
    }

    return chunks;
  }

  /**
   * Get overlap text from end of chunk
   */
  private getOverlap(chunk: string): string {
    if (this.chunkOverlap === 0 || chunk.length <= this.chunkOverlap) {
      return '';
    }

    return chunk.slice(-this.chunkOverlap);
  }
}

/**
 * Convenience function to split text
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = 1000,
  chunkOverlap: number = 200
): string[] {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  return splitter.splitText(text);
}
