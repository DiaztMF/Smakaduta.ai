/**
 * Generate embeddings for a text string using Nvidia Nemotron Embed or configured model.
 * Returns a 2048-dimensional vector matching pgvector schema. (PRD S-02.4)
 */
export async function generateEmbedding(
  text: string,
  inputType: "query" | "passage" = "query"
): Promise<number[]> {
  const baseURL =
    process.env.EMBEDDING_BASE_URL ||
    "https://integrate.api.nvidia.com/v1";

  const apiKey =
    process.env.EMBEDDING_API_KEY ||
    process.env.NVIDIA_API_KEY ||
    process.env.AI_API_KEY ||
    "";

  const model =
    process.env.EMBEDDING_MODEL ||
    "nvidia/llama-nemotron-embed-vl-1b-v2";

  const isNvidia =
    baseURL.includes("nvidia.com") ||
    apiKey.startsWith("nvapi-") ||
    model.startsWith("nvidia/");

  const url = `${baseURL.replace(/\/$/, "")}/embeddings`;

  const payload: Record<string, unknown> = {
    model,
    input: [text],
  };

  if (isNvidia) {
    payload.input_type = inputType;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Embedding API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (!data.data?.[0]?.embedding) {
      throw new Error("Invalid embedding response: missing embedding vector");
    }

    return data.data[0].embedding;
  } finally {
    clearTimeout(timeoutId);
  }
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
    const embedding = await generateEmbedding(text, "passage");
    embeddings.push(embedding);

    // Small delay to avoid rate limiting on free tier
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return embeddings;
}

/**
 * Generate embeddings for multiple texts in throttled batches with retry logic.
 */
export async function batchGenerateEmbeddings(
  texts: string[],
  inputType: "query" | "passage" = "passage",
  batchSize: number = 3,
  delayMs: number = 250
): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const chunkBatch = texts.slice(i, i + batchSize);

    // Process batch with retry
    const batchResults = await Promise.all(
      chunkBatch.map(async (text, index) => {
        let attempts = 0;
        const maxAttempts = 3;
        while (attempts < maxAttempts) {
          try {
            return await generateEmbedding(text, inputType);
          } catch (error) {
            attempts++;
            if (attempts >= maxAttempts) {
              throw new Error(
                `Failed embedding chunk ${i + index} after ${maxAttempts} attempts: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`
              );
            }
            // Exponential backoff delay
            await new Promise((resolve) => setTimeout(resolve, delayMs * attempts * 2));
          }
        }
        throw new Error(`Failed embedding chunk ${i + index}`);
      })
    );

    allEmbeddings.push(...batchResults);

    if (i + batchSize < texts.length && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return allEmbeddings;
}
