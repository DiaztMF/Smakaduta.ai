import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Drizzle ORM client — lazy singleton.
 * DATABASE_URL is resolved at call-time, not module load time,
 * so dotenv.config() in scripts can run before the client is created.
 */
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL tidak ditemukan. Tambahkan ke .env.local"
      );
    }
    const sql = neon(process.env.DATABASE_URL);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

/**
 * Export `db` as a Proxy so it lazily initializes on first use.
 * This allows dotenv.config() to run before database is accessed.
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});
