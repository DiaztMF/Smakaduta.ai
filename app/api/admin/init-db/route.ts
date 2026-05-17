import { initializeDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/init-db
 * Initialize the database schema (run once during setup).
 * Protected by ADMIN_SECRET.
 */
export async function POST(req: Request) {
  // Auth check
  const { secret } = await req.json();
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await initializeDatabase();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Database initialization failed:", error);
    return NextResponse.json(
      { error: error.message || "Database initialization failed" },
      { status: 500 }
    );
  }
}
