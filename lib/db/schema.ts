import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  index,
  halfvec,
} from "drizzle-orm/pg-core";

/**
 * Resources table — stores chunked knowledge base documents with embeddings.
 * Uses pgvector halfvec(2048) for Nvidia Nemotron Embed vectors.
 * (PRD S-02.4)
 */
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
    // HNSW index for fast cosine similarity search (PRD S-02.4)
    index("resources_embedding_idx")
      .using("hnsw", table.embedding.op("halfvec_cosine_ops")),
    // Index for admin dashboard source lookups
    index("resources_source_name_idx").on(table.sourceName),
  ]
);

// Inferred types for insert and select operations
export type InsertResource = typeof resources.$inferInsert;
export type SelectResource = typeof resources.$inferSelect;
