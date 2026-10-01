# Design Specification: RAG Document Update & Knowledge Refresh Architecture

**File:** `docs/superpowers/specs/2026-10-01-rag-document-update-architecture-design.md`  
**Date:** 2026-10-01  
**Project:** Smakaduta.ai  
**Author:** Sisyphus (Agent) & Diazt Muhammad Firmansyah  
**Status:** Ready for Review  

---

## 1. Problem Statement & Motivation

Saat ini, sistem RAG Smakaduta.ai hanya mendukung penambahan potongan teks (`INSERT INTO resources`) dan penghapusan seluruh potongan berdasarkan sumber (`DELETE FROM resources WHERE source_name = $sourceName`). 

Ketika admin mengunggah versi terbaru dari dokumen yang sudah ada (misalnya perubahan panduan PPDB atau penyesuaian kuota zonasi), alur lama berisiko:
1. **In-place append duplikasi**: Jika nama sumber sama diunggah ulang tanpa hapus manual, potongan lama dan baru bercampur sehingga menghasilkan jawaban kontradiktif pada vector similarity search.
2. **In-place delete-then-insert tidak aman**: Jika dokumen lama dihapus sebelum proses embedding selesai, kegagalan jaringan atau limitasi rate-limit (HTTP 429) pada API embedding Nvidia/OpenRouter akan menyebabkan hilangnya dokumen lama tanpa menghasilkan dokumen baru yang utuh (data corrupt / partial state).

## 2. Goals & Non-Goals

### Goals
- **Atomic Replacement (Zero-Downtime Swap)**: Seluruh potongan teks dokumen baru harus selesai di-embed terlebih dahulu di memori sebelum memodifikasi basis data Neon.
- **Transaksional Database**: Operasi penghapusan potongan lama dan penyisipan potongan baru dieksekusi dalam satu transaksi atomik (`db.transaction`).
- **Deteksi Sumber Otomatis**: Endpoint `POST /api/admin/upload` secara otomatis mendeteksi apakah `sourceName` sudah ada di database dan melaporkan aksi (`created` vs `replaced`).
- **Throttled Batch Embedding**: Menangani lonjakan potongan teks (dokumen tebal) dengan batch kecil (3–5 chunk secara sekuensial atau throttled concurrent) untuk mencegah limit kuota embedding gratis.
- **UI Feedback Transparan**: Halaman admin memberikan indikator visual saat nama dokumen yang dimasukkan akan menimpa data yang telah ada.

### Non-Goals
- Tidak mengimplementasikan version control dokumen penuh (seperti tabel `document_versions` / git-like branching).
- Tidak mengimplementasikan granular chunk-level text editor manual di fase ini (fokus pada penggantian dokumen utuh).

---

## 3. System Architecture & Data Flow

### 3.1 Data Flow Sequence

```
[Admin UI] ──(Upload PDF / Text dengan sourceName)──> [POST /api/admin/upload]
                                                              │
                                                     (Chunking: 1000/200)
                                                              │
                                                              ▼
                                                   [In-Memory Chunks]
                                                              │
                                            (Throttled Batch Embeddings)
                                                              │
                                                              ▼
                                            [Embeddings Buffer Lengkap]
                                            (Jika gagal: abort & keep DB)
                                                              │
                                                              ▼
                                                   [Neon DB Transaction]
                                                 ┌────────────────────────┐
                                                 │ 1. DELETE old chunks   │
                                                 │ 2. INSERT new chunks   │
                                                 │ 3. COMMIT              │
                                                 └────────────────────────┘
                                                              │
                                                              ▼
                                                  [Response: Action Replaced]
```

### 3.2 Database Schema Compatibility

Tabel `resources` tetap mempertahankan skema yang kompatibel penuh dengan `PRD.md` (pgvector `halfvec(2048)`):

```typescript
export const resources = pgTable(
  "resources",
  {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    sourceName: varchar("source_name", { length: 255 }).notNull().default("unknown"),
    sourceType: varchar("source_type", { length: 50 }).notNull().default("text"),
    chunkIndex: integer("chunk_index").notNull().default(0),
    embedding: halfvec("embedding", { dimensions: 2048 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("resources_embedding_idx").using("hnsw", table.embedding.op("halfvec_cosine_ops")),
    index("resources_source_name_idx").on(table.sourceName),
  ]
);
```

---

## 4. Component & Module Design

### 4.1 RAG Module (`lib/rag.ts`)

Menambahkan fungsi transaksional untuk atomic replacement:

```typescript
export interface ChunkToStore {
  content: string;
  sourceName: string;
  sourceType: string;
  chunkIndex: number;
  embedding: number[];
}

/**
 * Mengganti semua chunk dari suatu sumber secara atomik.
 * Menghapus chunk lama dan memasukkan chunk baru dalam satu transaksi database.
 */
export async function replaceSourceChunks(
  sourceName: string,
  newChunks: ChunkToStore[]
): Promise<{ deletedCount: number; insertedCount: number }>;
```

Implementasi transaksi menggunakan transaksi Postgres Neon via Drizzle SQL / transaction client:
1. Menghitung jumlah record lama yang memiliki `source_name = sourceName`.
2. Menjalankan statement `DELETE FROM resources WHERE source_name = sourceName`.
3. Menjalankan multi-row batch insert dengan cast `::halfvec(2048)` untuk embedding.

### 4.2 Throttled Embedding Batcher (`lib/embeddings.ts`)

Untuk mencegah kegagalan HTTP 429 ketika memproses dokumen berukuran besar:
- Implementasi fungsi `batchGenerateEmbeddings(chunks: string[], batchSize: number = 3, delayMs: number = 250)`.
- Jika sebuah batch gagal, dilakukan retry otomatis maksimal 2 kali dengan exponential backoff sebelum melempar error kegagalan.

### 4.3 API Route Update (`app/api/admin/upload/route.ts`)

Alur endpoint disesuaikan:
1. Autentikasi Bearer / token admin.
2. Parse teks dari input atau PDF.
3. Potong teks menggunakan `chunkText(fullText)`.
4. Periksa eksistensi `sourceName`:
   ```typescript
   const existing = await db
     .select({ count: count(resources.id) })
     .from(resources)
     .where(eq(resources.sourceName, sourceName));
   const isExisting = (existing[0]?.count ?? 0) > 0;
   ```
5. Generate embedding untuk semua chunk ke dalam array in-memory `preparedChunks`.
6. Eksekusi `replaceSourceChunks(sourceName, preparedChunks)`.
7. Return payload terstruktur:
   ```json
   {
     "success": true,
     "action": isExisting ? "replaced" : "created",
     "sourceName": "Jadwal PPDB 2026",
     "totalChunks": 12,
     "processedChunks": 12,
     "deletedOldChunks": isExisting ? 8 : 0
   }
   ```

---

## 5. Error Handling & Edge Cases

1. **Embedding Failure di Tengah Jalan**:
   - Jika embedding chunk ke-5 gagal setelah retry, proses langsung melempar exception `EmbeddingGenerationError`.
   - Transaksi database belum dipanggil sama sekali. Potongan teks lama di database tidak terhapus.
2. **Karakter Khusus / Encoding PDF**:
   - Teks dibersihkan dari null bytes `\u0000` sebelum dimasukkan ke database Postgres untuk mencegah error PostgreSQL string termination.
3. **Dokumen Kosong / Hasil Parse 0 Chunk**:
   - Ditolak di layer validasi awal dengan status HTTP 400 tanpa menyentuh database.
4. **Ukuran File Terlalu Besar**:
   - Proteksi batas ukuran file input (maksimal 10MB) untuk menjaga batas waktu eksekusi serverless runtime.

---

## 6. Verification & Testing Plan

1. **Uji Kasus Normal (Creation)**:
   - Upload dokumen dengan nama baru: `sourceName = "Test Dokumen Baru"`.
   - Pastikan response mengembalikan `action: "created"`.
   - Verifikasi melalui kueri database bahwa record tersimpan dengan embeddings valid.
2. **Uji Kasus Update (Atomic Replace)**:
   - Upload dokumen pengganti dengan `sourceName` yang sama namun konten berbeda (misal 5 chunk diganti dengan 8 chunk).
   - Pastikan response mengembalikan `action: "replaced"` dan `deletedOldChunks: 5`.
   - Verifikasi jumlah chunk di database persis 8, dan chunk lama sudah tidak ada.
3. **Uji Simulasi Rollback (Failure Resilience)**:
   - Simulasikan error pada API embedding saat update.
   - Verifikasi bahwa 5 chunk lama tetap utuh di database (zero data loss).
