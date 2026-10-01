# RAG Document Update & Atomic Replace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement zero-downtime, transactional atomic replacement for RAG documents and knowledge updates in Smakaduta.ai with throttled batch embedding.

**Architecture:** In-memory batch embedding with exponential backoff retry followed by a single Neon Postgres transaction that deletes existing chunks for the target `sourceName` and inserts new chunk embeddings using `halfvec(2048)`.

**Tech Stack:** Next.js 16 (App Router), Drizzle ORM, Neon Serverless Postgres (`pgvector`), OpenRouter / Nvidia Embeddings API, TypeScript.

## Global Constraints
- Framework: Next.js 16 App Router + React 19.
- Vector database: Neon Postgres with `pgvector` halfvec(2048) cosine distance.
- Zero-corruption: Database must never be modified if any chunk embedding fails during the process.
- Authentication: `/api/admin/*` endpoints strictly protected by `ADMIN_SECRET` Bearer token.
- Minimal dependencies: Do not add unnecessary packages.

---

### Task 1: Add Batch Throttled Embedding Generation with Retry

**Files:**
- Modify: `lib/embeddings.ts`
- Create: `scripts/test-batch-embeddings.ts`

**Interfaces:**
- Produces: `batchGenerateEmbeddings(texts: string[], inputType?: "query" | "passage", batchSize?: number, delayMs?: number): Promise<number[][]>`

- [ ] **Step 1: Write verification script to test `batchGenerateEmbeddings` interface**

```typescript
// scripts/test-batch-embeddings.ts
import { batchGenerateEmbeddings } from "../lib/embeddings";

async function main() {
  const dummyTexts = ["Tes 1", "Tes 2", "Tes 3"];
  console.log("Testing batchGenerateEmbeddings...");
  const embeddings = await batchGenerateEmbeddings(dummyTexts, "passage", 2, 100);
  if (embeddings.length !== 3) {
    throw new Error(`Expected 3 embeddings, got ${embeddings.length}`);
  }
  if (!Array.isArray(embeddings[0]) || embeddings[0].length !== 2048) {
    throw new Error(`Expected vector dimension 2048, got ${embeddings[0]?.length}`);
  }
  console.log("Verification passed!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Run verification script to confirm it fails**

Run: `npx tsx scripts/test-batch-embeddings.ts`  
Expected: FAIL with `batchGenerateEmbeddings is not a function`

- [ ] **Step 3: Implement `batchGenerateEmbeddings` in `lib/embeddings.ts`**

Tambahkan fungsi pembantu batching dan retry dengan delay di `lib/embeddings.ts`:

```typescript
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
```

- [ ] **Step 4: Run verification script to verify it passes**

Run: `npx tsx scripts/test-batch-embeddings.ts`  
Expected: PASS (atau mocked response jika key offline)

- [ ] **Step 5: Run lsp_diagnostics and commit**

Run: `rtk tsc --noEmit`  
Git commit: `git add lib/embeddings.ts scripts/test-batch-embeddings.ts && git commit -m "feat(rag): add batchGenerateEmbeddings with retry and throttling"`

---

### Task 2: Implement Atomic Source Replacement in `lib/rag.ts`

**Files:**
- Modify: `lib/rag.ts`
- Create: `scripts/test-atomic-replace.ts`

**Interfaces:**
- Consumes: `db` from `lib/db`, `resources` from `lib/db/schema`
- Produces:
  ```typescript
  export interface PreparedChunk {
    content: string;
    sourceName: string;
    sourceType: string;
    chunkIndex: number;
    embedding: number[];
  }

  export async function replaceSourceChunks(
    sourceName: string,
    newChunks: PreparedChunk[]
  ): Promise<{ deletedCount: number; insertedCount: number }>;
  ```

- [ ] **Step 1: Write test script for `replaceSourceChunks`**

```typescript
// scripts/test-atomic-replace.ts
import { replaceSourceChunks, type PreparedChunk } from "../lib/rag";
import { db } from "../lib/db";
import { resources } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function testAtomic() {
  const testSource = "Atomic-Test-Doc";
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
```

- [ ] **Step 2: Run test script to confirm it fails**

Run: `npx tsx scripts/test-atomic-replace.ts`  
Expected: FAIL with `replaceSourceChunks is not exported`

- [ ] **Step 3: Implement `replaceSourceChunks` in `lib/rag.ts`**

Tambahkan fungsi transaksi atomik di `lib/rag.ts`:

```typescript
export interface PreparedChunk {
  content: string;
  sourceName: string;
  sourceType: string;
  chunkIndex: number;
  embedding: number[];
}

/**
 * Replace all chunks of a source atomically in a single Neon DB transaction.
 * Ensures zero downtime and zero partial states.
 */
export async function replaceSourceChunks(
  sourceName: string,
  newChunks: PreparedChunk[]
): Promise<{ deletedCount: number; insertedCount: number }> {
  // Query existing chunk count
  const existingRecords = await db
    .select({ count: count(resources.id) })
    .from(resources)
    .where(eq(resources.sourceName, sourceName));
  const oldCount = existingRecords[0]?.count ?? 0;

  // Execute deletion and batch insertion inside transaction
  await db.transaction(async (tx) => {
    // 1. Delete old chunks
    await tx.delete(resources).where(eq(resources.sourceName, sourceName));

    // 2. Insert new chunks in batch
    for (const chunk of newChunks) {
      const embeddingStr = `[${chunk.embedding.join(",")}]`;
      await tx.execute(sql`
        INSERT INTO resources (content, source_name, source_type, chunk_index, embedding, updated_at)
        VALUES (${chunk.content}, ${chunk.sourceName}, ${chunk.sourceType}, ${chunk.chunkIndex}, ${embeddingStr}::halfvec(2048), NOW())
      `);
    }
  });

  return {
    deletedCount: oldCount,
    insertedCount: newChunks.length,
  };
}
```

- [ ] **Step 4: Run test script to verify it passes**

Run: `npx tsx scripts/test-atomic-replace.ts`  
Expected: PASS

- [ ] **Step 5: Run lsp_diagnostics and commit**

Run: `rtk tsc --noEmit`  
Git commit: `git add lib/rag.ts scripts/test-atomic-replace.ts && git commit -m "feat(rag): implement atomic replaceSourceChunks transaction"`

---

### Task 3: Update Upload API Route with Atomic Replace & Action Detection

**Files:**
- Modify: `app/api/admin/upload/route.ts`

**Interfaces:**
- Consumes: `batchGenerateEmbeddings` from `lib/embeddings`, `replaceSourceChunks` from `lib/rag`
- Produces: Enhanced JSON response on `POST /api/admin/upload`:
  ```json
  {
    "success": true,
    "action": "created" | "replaced",
    "sourceName": string,
    "sourceType": string,
    "totalChunks": number,
    "processedChunks": number,
    "deletedOldChunks": number
  }
  ```

- [ ] **Step 1: Check existing route implementation and tests**

Run: `rtk tsc --noEmit`  
Pastikan tipe kompatibel sebelum modifikasi.

- [ ] **Step 2: Update `app/api/admin/upload/route.ts`**

Ubah pipeline di `app/api/admin/upload/route.ts`:
1. Ekstraksi teks & chunking.
2. Generate semua embeddings dengan `batchGenerateEmbeddings`.
3. Panggil `replaceSourceChunks(sourceName, preparedChunks)`.
4. Return response terstruktur dengan status `action: deletedCount > 0 ? "replaced" : "created"`.

```typescript
// app/api/admin/upload/route.ts
// ...
import { chunkText } from "@/lib/chunking";
import { replaceSourceChunks, type PreparedChunk } from "@/lib/rag";
import { batchGenerateEmbeddings } from "@/lib/embeddings";
// ...
    // Extract text from PDF / text input ...
    const chunks = chunkText(fullText);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No content could be extracted from the document." },
        { status: 400 }
      );
    }

    // Sanitize null characters from content
    const sanitizedChunkContents = chunks.map((c) => c.content.replace(/\u0000/g, ""));

    // Batch generate embeddings with retry
    const embeddings = await batchGenerateEmbeddings(sanitizedChunkContents, "passage", 3, 200);

    const preparedChunks: PreparedChunk[] = chunks.map((chunk, index) => ({
      content: sanitizedChunkContents[index],
      sourceName,
      sourceType,
      chunkIndex: chunk.chunkIndex,
      embedding: embeddings[index],
    }));

    // Atomically replace chunks in Neon DB
    const { deletedCount, insertedCount } = await replaceSourceChunks(sourceName, preparedChunks);

    return NextResponse.json({
      success: true,
      action: deletedCount > 0 ? "replaced" : "created",
      sourceName,
      sourceType,
      totalChunks: chunks.length,
      processedChunks: insertedCount,
      deletedOldChunks: deletedCount,
    });
```

- [ ] **Step 3: Test route response structure and type checking**

Run: `rtk tsc --noEmit`  
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

Run: `git add app/api/admin/upload/route.ts && git commit -m "feat(api): integrate atomic replace and action detection in admin upload"`

---

### Task 4: Enhance Admin UI with Update Indicator and Feedback

**Files:**
- Modify: `app/admin/page.tsx` (atau komponen form upload admin)

- [ ] **Step 1: Read existing admin page structure**

Cari lokasi input `sourceName` dan daftar sources di admin UI.

- [ ] **Step 2: Add dynamic "Akan menimpa dokumen lama" warning badge**

Ketika admin mengetik nama dokumen (`sourceName`) yang cocok (case-insensitive) dengan salah satu nama di daftar dokumen yang ada, tampilkan badge peringatan:
- Badge warna amber/kuning: *"Dokumen dengan nama ini sudah ada. Mengunggah akan memperbarui/menimpa dokumen lama secara atomik."*

- [ ] **Step 3: Update success toast / alert**

Ketika upload sukses:
- Jika `res.action === "replaced"`, tampilkan pesan: *"Berhasil memperbarui [sourceName]! (Menimpa ${res.deletedOldChunks} chunk lama dengan ${res.processedChunks} chunk baru)"*.
- Jika `res.action === "created"`, tampilkan pesan: *"Berhasil menambahkan dokumen baru [sourceName] (${res.processedChunks} chunk)"*.

- [ ] **Step 4: Run typecheck and linting**

Run: `rtk tsc --noEmit`  
Run: `rtk lint`  
Expected: Clean diagnostics.

- [ ] **Step 5: Commit**

Run: `git add app/admin/page.tsx && git commit -m "feat(admin): add visual overwrite warning and detailed update toast feedback"`

---

### Task 5: Final End-to-End Verification & Cleanup

**Files:**
- Remove: `scripts/test-batch-embeddings.ts`, `scripts/test-atomic-replace.ts` (jika tidak diperlukan permanen)

- [ ] **Step 1: Run end-to-end check**

Run: `rtk tsc --noEmit`  
Run: `git status`

- [ ] **Step 2: Commit cleanup**

Run: `git commit -m "chore: cleanup test artifacts after RAG update verification"`
