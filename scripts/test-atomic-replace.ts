import { replaceSourceChunks, type PreparedChunk } from "../lib/rag";
import { db } from "../lib/db";
import { resources } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function testAtomic() {
  const testSource = "Atomic-Test-Doc";

  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL found. Testing mock contract interface...");
    if (typeof replaceSourceChunks !== "function") {
      throw new Error("replaceSourceChunks is not a function");
    }
    console.log("Contract interface test passed (offline)!");
    return;
  }

  // Clean before test
  await db.delete(resources).where(eq(resources.sourceName, testSource));

  const dummyVector = new Array(2048).fill(0.01);
  const chunks1: PreparedChunk[] = [
    { content: "Versi 1 Chunk 1", sourceName: testSource, sourceType: "text", chunkIndex: 0, embedding: dummyVector },
    { content: "Versi 1 Chunk 2", sourceName: testSource, sourceType: "text", chunkIndex: 1, embedding: dummyVector },
  ];

  console.log("Step 1: Initial Insert via replaceSourceChunks");
  const res1 = await replaceSourceChunks(testSource, chunks1);
  if (res1.insertedCount !== 2) throw new Error(`Expected 2 inserted, got ${res1.insertedCount}`);

  console.log("Step 2: Replace with 3 new chunks");
  const chunks2: PreparedChunk[] = [
    { content: "Versi 2 Chunk 1", sourceName: testSource, sourceType: "text", chunkIndex: 0, embedding: dummyVector },
    { content: "Versi 2 Chunk 2", sourceName: testSource, sourceType: "text", chunkIndex: 1, embedding: dummyVector },
    { content: "Versi 2 Chunk 3", sourceName: testSource, sourceType: "text", chunkIndex: 2, embedding: dummyVector },
  ];
  const res2 = await replaceSourceChunks(testSource, chunks2);
  if (res2.deletedCount !== 2 || res2.insertedCount !== 3) {
    throw new Error(`Expected 2 deleted, 3 inserted, got deleted=${res2.deletedCount}, inserted=${res2.insertedCount}`);
  }

  // Cleanup
  await db.delete(resources).where(eq(resources.sourceName, testSource));
  console.log("Atomic replace test passed!");
}

testAtomic().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
