import { NextResponse } from "next/server";
import { chunkText } from "@/lib/chunking";
import { storeChunkWithEmbedding } from "@/lib/rag";
import { PDFParse } from "pdf-parse";

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
  // Auth check
  const formData = await req.formData();
  const secret = formData.get("secret") as string;

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sourceName = (formData.get("sourceName") as string) || "Unnamed Source";
  const textContent = formData.get("text") as string | null;
  const file = formData.get("file") as File | null;

  let fullText = "";
  let sourceType = "text";

  try {
    // Extract text from PDF or use raw text input
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
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

    // Process each chunk: embed + store (PRD S-02.4)
    let processedCount = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      try {
        await storeChunkWithEmbedding(
          chunk.content,
          sourceName,
          sourceType,
          chunk.chunkIndex
        );
        processedCount++;
      } catch (error: any) {
        errors.push(
          `Chunk ${chunk.chunkIndex}: ${error.message || "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      sourceName,
      sourceType,
      totalChunks: chunks.length,
      processedChunks: processedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Upload processing failed:", error);
    return NextResponse.json(
      { error: error.message || "Upload processing failed" },
      { status: 500 }
    );
  }
}
