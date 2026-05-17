/**
 * db:migrate-manual — Directly create the resources table using raw SQL.
 * Bypass drizzle-kit limitations with @neondatabase/serverless driver.
 *
 * Run: pnpm db:migrate-manual
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL tidak ditemukan di .env.local");
    process.exit(1);
  }

  const sql = neon(url);

  console.log("🚀 Menjalankan migrasi manual...\n");

  // Step 1: Enable pgvector
  console.log("1️⃣  Mengaktifkan pgvector extension...");
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  console.log("   ✅ pgvector aktif!\n");

  // Step 2: Drop & recreate resources table (clean state, no production data yet)
  console.log("2️⃣  Membuat ulang tabel resources dengan schema lengkap...");
  await sql`DROP TABLE IF EXISTS resources CASCADE`;
  await sql`
    CREATE TABLE resources (
      id          SERIAL PRIMARY KEY,
      content     TEXT NOT NULL,
      source_name VARCHAR(255) NOT NULL DEFAULT 'unknown',
      source_type VARCHAR(50)  NOT NULL DEFAULT 'text',
      chunk_index INTEGER      NOT NULL DEFAULT 0,
      embedding   halfvec(2048),
      created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  console.log("   ✅ Tabel resources siap!\n");

  // Step 3: Create HNSW index for cosine similarity (PRD S-02.4)
  console.log("3️⃣  Membuat HNSW index untuk vector search...");
  await sql`
    CREATE INDEX resources_embedding_idx
    ON resources
    USING hnsw (embedding halfvec_cosine_ops)
  `;
  console.log("   ✅ HNSW index siap!\n");

  // Step 4: Create source_name index for admin dashboard
  console.log("4️⃣  Membuat index untuk source_name...");
  await sql`
    CREATE INDEX resources_source_name_idx
    ON resources (source_name)
  `;
  console.log("   ✅ source_name index siap!\n");

  console.log("═".repeat(40));
  console.log("🎉 Migrasi selesai! Sekarang jalankan:");
  console.log("   pnpm db:seed");
  console.log("═".repeat(40));

  process.exit(0);
}

migrate().catch((e) => {
  console.error("❌ Migrasi gagal:", e.message);
  process.exit(1);
});
