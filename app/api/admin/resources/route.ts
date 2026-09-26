import { NextResponse } from "next/server";
import { listSources, deleteSource } from "@/lib/rag";
import {
  getBearerSecret,
  isValidAdminSecret,
  unauthorizedResponse,
  misconfiguredResponse,
} from "@/lib/admin-auth";

/**
 * GET /api/admin/resources
 * List all sources in the knowledge base.
 * Auth via Authorization: Bearer <ADMIN_SECRET> header.
 */
export async function GET(req: Request) {
  if (!process.env.ADMIN_SECRET) return misconfiguredResponse();
  if (!isValidAdminSecret(getBearerSecret(req))) return unauthorizedResponse();

  try {
    const sources = await listSources();
    return NextResponse.json({ sources });
  } catch (error: unknown) {
    console.error("Failed to list resources:", error);
    const errMsg = error instanceof Error ? error.message : "Failed to list resources";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/resources
 * Delete all chunks for a specific source.
 */
export async function DELETE(req: Request) {
  if (!process.env.ADMIN_SECRET) return misconfiguredResponse();

  let body: { secret?: string; sourceName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON valid." }, { status: 400 });
  }

  const secret = getBearerSecret(req) ?? body.secret;
  if (!isValidAdminSecret(secret)) return unauthorizedResponse();

  const { sourceName } = body;

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
  } catch (error: unknown) {
    console.error("Failed to delete resource:", error);
    const errMsg = error instanceof Error ? error.message : "Failed to delete resource";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
