import { db } from "./db";
import { resources, type InsertResource } from "./db/schema";
import { eq, sql, count, min, desc } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";

/**
 * RAG Pipeline: Find relevant content from the knowledge base.
 * (PRD Section 6 - Retrieval Pipeline)
 *
 * Flow:
 * 1. Vectorize user query using Nvidia Embedding
 * 2. Cosine similarity search in Neon pgvector (HNSW index)
 * 3. Return top N most relevant chunks
 */

export interface RelevantChunk {
  id: number;
  content: string;
  sourceName: string;
  sourceType: string;
  similarity: number;
}

/**
 * Find the most relevant content chunks for a given query.
 *
 * @param query - User's question text
 * @param limit - Maximum number of chunks to return (default: 3 per PRD)
 * @param minSimilarity - Minimum cosine similarity threshold (default: 0.3)
 * @returns Array of relevant chunks sorted by similarity
 */
export async function findRelevantContent(
  query: string,
  limit: number = 3,
  minSimilarity: number = 0.3
): Promise<RelevantChunk[]> {
  try {
    // Step 1: Vectorize the query (PRD Section 6, Step 1)
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Step 2: Cosine similarity search using pgvector <=> operator
    // Note: pgvector operators require raw SQL via db.execute()
    const results = await db.execute<{
      id: number;
      content: string;
      source_name: string;
      source_type: string;
      similarity: number;
    }>(sql`
      SELECT 
        id,
        content,
        source_name,
        source_type,
        1 - (embedding <=> ${embeddingStr}::halfvec(2048)) AS similarity
      FROM resources
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingStr}::halfvec(2048)
      LIMIT ${limit}
    `);

    // Filter by minimum similarity
    return results.rows
      .filter((row) => Number(row.similarity) >= minSimilarity)
      .map((row) => ({
        id: row.id,
        content: row.content,
        sourceName: row.source_name,
        sourceType: row.source_type,
        similarity: Number(row.similarity),
      }));
  } catch (error) {
    console.error("RAG retrieval failed:", error);
    // Return empty array so chat still works without RAG
    return [];
  }
}

/**
 * Build the context injection string from retrieved chunks. (PRD Section 6, Step 3)
 * This gets appended to the system prompt for the LLM.
 */
export function buildContextPrompt(chunks: RelevantChunk[]): string {
  if (chunks.length === 0) {
    return "";
  }

  const contextParts = chunks.map(
    (chunk, i) =>
      `[Sumber ${i + 1}: ${chunk.sourceName} (relevansi: ${(chunk.similarity * 100).toFixed(0)}%)]\n${chunk.content}`
  );

  return `\n\n--- DOKUMEN REFERENSI ---\nBerikut adalah potongan dokumen resmi sekolah yang relevan dengan pertanyaan pengguna. Gunakan HANYA informasi dari dokumen ini untuk menjawab:\n\n${contextParts.join("\n\n")}\n\n--- AKHIR DOKUMEN ---`;
}

/**
 * Store a text chunk with its embedding in the database.
 * Uses Drizzle ORM insert.
 */
export async function storeChunkWithEmbedding(
  content: string,
  sourceName: string,
  sourceType: string,
  chunkIndex: number
): Promise<void> {
  const embedding = await generateEmbedding(content);
  const embeddingStr = `[${embedding.join(",")}]`;

  await db.execute(sql`
    INSERT INTO resources (content, source_name, source_type, chunk_index, embedding)
    VALUES (${content}, ${sourceName}, ${sourceType}, ${chunkIndex}, ${embeddingStr}::halfvec(2048))
  `);
}

/**
 * Store a text chunk WITHOUT embedding (for seeding — embeddings added separately).
 * Uses Drizzle typed insert.
 */
export async function storeChunk(
  data: Omit<InsertResource, "id" | "createdAt" | "updatedAt" | "embedding">
): Promise<void> {
  await db.insert(resources).values(data);
}

/**
 * Get all unique sources in the knowledge base.
 * Uses Drizzle query builder with groupBy.
 */
export async function listSources(): Promise<
  { sourceName: string; sourceType: string; chunkCount: number; createdAt: string }[]
> {
  const results = await db
    .select({
      sourceName: resources.sourceName,
      sourceType: resources.sourceType,
      chunkCount: count(resources.id),
      createdAt: min(resources.createdAt),
    })
    .from(resources)
    .groupBy(resources.sourceName, resources.sourceType)
    .orderBy(desc(min(resources.createdAt)));

  return results.map((row) => ({
    sourceName: row.sourceName,
    sourceType: row.sourceType,
    chunkCount: row.chunkCount,
    createdAt: row.createdAt?.toISOString() ?? "",
  }));
}

/**
 * Delete all chunks from a specific source.
 * Uses Drizzle delete with where clause.
 */
export async function deleteSource(sourceName: string): Promise<void> {
  await db.delete(resources).where(eq(resources.sourceName, sourceName));
}
