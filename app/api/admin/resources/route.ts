import { NextResponse } from "next/server";
import { listSources, deleteSource } from "@/lib/rag";

/**
 * GET /api/admin/resources
 * List all sources in the knowledge base.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sources = await listSources();
    return NextResponse.json({ sources });
  } catch (error: any) {
    console.error("Failed to list resources:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list resources" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/resources
 * Delete all chunks for a specific source.
 */
export async function DELETE(req: Request) {
  const { secret, sourceName } = await req.json();

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!sourceName) {
    return NextResponse.json(
      { error: "sourceName is required" },
      { status: 400 }
    );
  }

  try {
    await deleteSource(sourceName);
    return NextResponse.json({
      success: true,
      message: `Deleted all chunks from "${sourceName}"`,
    });
  } catch (error: any) {
    console.error("Failed to delete resource:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete resource" },
      { status: 500 }
    );
  }
}
