import { batchGenerateEmbeddings } from "../lib/embeddings";

async function main() {
  console.log("Testing batchGenerateEmbeddings...");
  
  if (typeof batchGenerateEmbeddings !== "function") {
    throw new Error("batchGenerateEmbeddings is not exported as a function");
  }

  // Check if API key is configured. If not, test mock/offline or real run.
  const apiKey =
    process.env.EMBEDDING_API_KEY ||
    process.env.NVIDIA_API_KEY ||
    process.env.AI_API_KEY;

  if (!apiKey) {
    console.log("No embedding API key in environment, mocking global fetch for test...");
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            data: [{ embedding: new Array(2048).fill(0.01) }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      };

      const dummyTexts = ["Tes 1", "Tes 2", "Tes 3"];
      const embeddings = await batchGenerateEmbeddings(dummyTexts, "passage", 2, 10);
      if (embeddings.length !== 3) {
        throw new Error(`Expected 3 embeddings, got ${embeddings.length}`);
      }
      if (!Array.isArray(embeddings[0]) || embeddings[0].length !== 2048) {
        throw new Error(`Expected vector dimension 2048, got ${embeddings[0]?.length}`);
      }
      console.log("Mock verification passed!");
    } finally {
      globalThis.fetch = originalFetch;
    }
  } else {
    const dummyTexts = ["Tes 1", "Tes 2", "Tes 3"];
    const embeddings = await batchGenerateEmbeddings(dummyTexts, "passage", 2, 100);
    if (embeddings.length !== 3) {
      throw new Error(`Expected 3 embeddings, got ${embeddings.length}`);
    }
    if (!Array.isArray(embeddings[0]) || embeddings[0].length !== 2048) {
      throw new Error(`Expected vector dimension 2048, got ${embeddings[0]?.length}`);
    }
    console.log("Live API verification passed!");
  }
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
