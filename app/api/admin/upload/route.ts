import { NextResponse } from "next/server";
import { chunkText } from "@/lib/chunking";
import { replaceSourceChunks, type PreparedChunk } from "@/lib/rag";
import { batchGenerateEmbeddings } from "@/lib/embeddings";
import {
  getBearerSecret,
  isValidAdminSecret,
  unauthorizedResponse,
  misconfiguredResponse,
} from "@/lib/admin-auth";

/**
 * POST /api/admin/upload
 * Upload and process a document for the RAG knowledge base. (PRD S-02.2)
 *
 * Accepts:
 * - PDF files (parsed via pdf-parse)
 * - Plain text (via form field)
 *
 * Pipeline:
 * 1. Extract text from PDF or use raw text
 * 2. Chunk text (1000 chars, 200 overlap) — PRD S-02.3
 * 3. Generate embeddings for each chunk — PRD S-02.4
 * 4. Store in Neon DB with HNSW index
 */
export async function POST(req: Request) {
  if (!process.env.ADMIN_SECRET) return misconfiguredResponse();

  // formData() throws on non-multipart bodies -> JSON 400, never 500 HTML.
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Body harus multipart/form-data." },
      { status: 400 }
    );
  }

  // Auth: Bearer header utama, field form sebagai fallback kompatibilitas.
  const secret = getBearerSecret(req) ?? (formData.get("secret") as string | null);
  if (!isValidAdminSecret(secret)) return unauthorizedResponse();

  const sourceName = (formData.get("sourceName") as string) || "Unnamed Source";
  const textContent = formData.get("text") as string | null;
  const file = formData.get("file") as File | null;

  let fullText = "";
  let sourceType = "text";

  try {
    // Extract text from PDF or use raw text input
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      // Lazy import: modul pdf-parse v2 crash saat load di Edge/route context,
      // yang dulu bikin route ini 500 HTML sebelum sempat cek auth.
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const pdfData = await parser.getText();
      fullText = pdfData.text;
      sourceType = "pdf";
    } else if (textContent && textContent.trim()) {
      fullText = textContent.trim();
      sourceType = "text";
    } else {
      return NextResponse.json(
        { error: "No content provided. Upload a PDF or enter text." },
        { status: 400 }
      );
    }

    // Chunk the text (PRD S-02.3)
    const chunks = chunkText(fullText);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No content could be extracted from the document." },
        { status: 400 }
      );
    }

    // Sanitize chunk text (remove null bytes)
    const sanitizedContents = chunks.map((chunk) =>
      chunk.content.replace(/\u0000/g, "")
    );

    // Generate embeddings in throttled batches with retry logic
    const embeddings = await batchGenerateEmbeddings(
      sanitizedContents,
      "passage",
      3,
      200
    );

    const preparedChunks: PreparedChunk[] = chunks.map((chunk, index) => ({
      content: sanitizedContents[index],
      sourceName,
      sourceType,
      chunkIndex: chunk.chunkIndex,
      embedding: embeddings[index],
    }));

    // Atomically replace all chunks for this source
    const { deletedCount, insertedCount } = await replaceSourceChunks(
      sourceName,
      preparedChunks
    );

    return NextResponse.json({
      success: true,
      action: deletedCount > 0 ? "replaced" : "created",
      sourceName,
      sourceType,
      totalChunks: chunks.length,
      processedChunks: insertedCount,
      deletedOldChunks: deletedCount,
    });
  } catch (error: unknown) {
    console.error("Upload processing failed:", error);
    const errMsg = error instanceof Error ? error.message : "Upload processing failed";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
