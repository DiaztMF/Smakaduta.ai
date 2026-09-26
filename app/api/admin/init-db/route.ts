import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  getBearerSecret,
  isValidAdminSecret,
  unauthorizedResponse,
  misconfiguredResponse,
} from "@/lib/admin-auth";

/**
 * POST /api/admin/init-db
 * Initialize the database schema (run once during setup).
 * - Enables pgvector extension
 * - Schema is managed by Drizzle Kit (`pnpm db:push`)
 * Protected by ADMIN_SECRET.
 */
export async function POST(req: Request) {
  if (!process.env.ADMIN_SECRET) return misconfiguredResponse();

  let body: { secret?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON valid." }, { status: 400 });
  }

  const secret = getBearerSecret(req) ?? body.secret;
  if (!isValidAdminSecret(secret)) return unauthorizedResponse();

  try {
    // Enable pgvector extension (must be done before schema push)
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);

    return NextResponse.json({
      success: true,
      message:
        "pgvector extension enabled. Run `pnpm db:push` to sync the schema.",
    });
  } catch (error: unknown) {
    console.error("Database initialization failed:", error);
    const errMsg = error instanceof Error ? error.message : "Database initialization failed";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
