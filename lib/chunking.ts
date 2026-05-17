/**
 * Text chunking utility for RAG pipeline.
 * Splits documents into overlapping chunks for embedding. (PRD S-02.3)
 *
 * Formula: Chunk Size = 1000 characters, Chunk Overlap = 200 characters
 */

export interface TextChunk {
  content: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
}

/**
 * Split text into overlapping chunks.
 *
 * @param text - The full text to split
 * @param chunkSize - Maximum characters per chunk (default: 1000)
 * @param overlap - Number of overlapping characters between chunks (default: 200)
 * @returns Array of TextChunk objects
 */
export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): TextChunk[] {
  // Clean text: normalize whitespace but preserve paragraph structure
  const cleanedText = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (cleanedText.length === 0) return [];

  // If text fits in a single chunk, return as-is
  if (cleanedText.length <= chunkSize) {
    return [
      {
        content: cleanedText,
        chunkIndex: 0,
        startChar: 0,
        endChar: cleanedText.length,
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < cleanedText.length) {
    let end = Math.min(start + chunkSize, cleanedText.length);

    // Try to break at sentence boundaries for cleaner chunks
    if (end < cleanedText.length) {
      const sentenceBreak = findSentenceBreak(cleanedText, start, end);
      if (sentenceBreak > start + chunkSize * 0.5) {
        end = sentenceBreak;
      }
    }

    const content = cleanedText.slice(start, end).trim();

    if (content.length > 0) {
      chunks.push({
        content,
        chunkIndex,
        startChar: start,
        endChar: end,
      });
      chunkIndex++;
    }

    // Move start forward by (end - overlap), ensuring progress
    const step = Math.max(end - start - overlap, 1);
    start = start + step;
  }

  return chunks;
}

/**
 * Find the best sentence break point within a range.
 * Prefers: period > newline > comma > space
 */
function findSentenceBreak(
  text: string,
  start: number,
  end: number
): number {
  // Look backwards from end for sentence-ending punctuation
  const searchRange = text.slice(start, end);

  // Priority 1: Period followed by space or newline
  const periodMatch = searchRange.lastIndexOf(". ");
  if (periodMatch > searchRange.length * 0.5) {
    return start + periodMatch + 2;
  }

  // Priority 2: Newline (paragraph break)
  const newlineMatch = searchRange.lastIndexOf("\n");
  if (newlineMatch > searchRange.length * 0.5) {
    return start + newlineMatch + 1;
  }

  // Priority 3: Other sentence-ending punctuation
  for (const punct of ["? ", "! ", ".\n"]) {
    const idx = searchRange.lastIndexOf(punct);
    if (idx > searchRange.length * 0.3) {
      return start + idx + punct.length;
    }
  }

  // Fallback: break at last space
  const spaceMatch = searchRange.lastIndexOf(" ");
  if (spaceMatch > searchRange.length * 0.3) {
    return start + spaceMatch + 1;
  }

  return end;
}

/**
 * Estimate token count for a text (rough approximation).
 * Useful for system prompt budget calculations.
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English/Indonesian
  return Math.ceil(text.length / 4);
}
