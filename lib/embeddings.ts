import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { embed } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Generate embeddings for a text string using Nvidia Nemotron Embed.
 * Returns a 2048-dimensional vector. (PRD S-02.4)
 *
 * Model: nvidia/llama-nemotron-embed-vl-1b-v2:free
 * - Free tier via OpenRouter
 * - 2048 dimensions (halfvec in pgvector)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openrouter.textEmbeddingModel(
      "nvidia/llama-nemotron-embed-vl-1b-v2:free"
    ),
    value: text,
  });

  return embedding;
}

/**
 * Generate embeddings for multiple texts in batch.
 * Processes sequentially to respect rate limits on free tier.
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);

    // Small delay to avoid rate limiting on free tier
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return embeddings;
}
