import { neon } from "@neondatabase/serverless";

/**
 * Get a Neon SQL client for database queries.
 * Uses serverless driver for edge-compatible connections.
 */
export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Please add your Neon connection string to .env.local"
    );
  }
  return neon(process.env.DATABASE_URL);
}

/**
 * Initialize the database schema.
 * Creates the resources table with pgvector support.
 * Should be run once during setup.
 */
export async function initializeDatabase() {
  const sql = getDb();

  // Enable pgvector extension
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  // Create resources table with halfvec(2048) for Nvidia embeddings
  await sql`
    CREATE TABLE IF NOT EXISTS resources (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      source_name VARCHAR(255) NOT NULL DEFAULT 'unknown',
      source_type VARCHAR(50) NOT NULL DEFAULT 'text',
      chunk_index INTEGER NOT NULL DEFAULT 0,
      embedding halfvec(2048),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  // Create HNSW index for fast cosine similarity search (S-02.4)
  await sql`
    CREATE INDEX IF NOT EXISTS resources_embedding_idx 
    ON resources 
    USING hnsw (embedding halfvec_cosine_ops)
  `;

  // Create index for source_name lookups (admin dashboard)
  await sql`
    CREATE INDEX IF NOT EXISTS resources_source_name_idx 
    ON resources (source_name)
  `;

  return { success: true, message: "Database initialized successfully" };
}
