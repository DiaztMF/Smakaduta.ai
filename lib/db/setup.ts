/**
 * Pre-push setup script.
 * Enables pgvector extension BEFORE Drizzle Kit pushes the schema.
 * This must be run once before `pnpm db:push`.
 *
 * Run: pnpm db:setup
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

async function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL tidak ditemukan di .env.local");
    process.exit(1);
  }

  const sql = neon(url);

  console.log("🔧 Mengaktifkan pgvector extension...");
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  console.log("✅ pgvector extension aktif!");
  console.log('\n👉 Sekarang jalankan: pnpm db:push\n');

  process.exit(0);
}

setup().catch((e) => {
  console.error("❌ Setup gagal:", e.message);
  process.exit(1);
});
