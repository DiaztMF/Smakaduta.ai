import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/init-db
 * Initialize the database schema (run once during setup).
 * - Enables pgvector extension
 * - Schema is managed by Drizzle Kit (`pnpm db:push`)
 * Protected by ADMIN_SECRET.
 */
export async function POST(req: Request) {
  // Auth check
  const { secret } = await req.json();
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Enable pgvector extension (must be done before schema push)
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);

    return NextResponse.json({
      success: true,
      message:
        "pgvector extension enabled. Run `pnpm db:push` to sync the schema.",
    });
  } catch (error: any) {
    console.error("Database initialization failed:", error);
    return NextResponse.json(
      { error: error.message || "Database initialization failed" },
      { status: 500 }
    );
  }
}
