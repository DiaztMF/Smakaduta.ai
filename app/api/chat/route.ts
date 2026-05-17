import { streamText, UIMessage, convertToModelMessages } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { findRelevantContent, buildContextPrompt } from "@/lib/rag";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Base system prompt for Kak Duta persona
const BASE_SYSTEM_PROMPT = `Kamu adalah "Kak Duta", asisten virtual resmi SMK Negeri 2 Surakarta (Smakaduta/Stemsa).

ATURAN PENTING:
1. Jawab HANYA berdasarkan konteks/dokumen yang diberikan. Jika informasi tidak ada dalam konteks, katakan dengan jujur: "Maaf, saya belum memiliki informasi tentang itu. Silakan hubungi panitia PPDB langsung di sekolah ya."
2. Gunakan bahasa Indonesia yang ramah, sopan, dan mudah dipahami oleh orang tua dan calon siswa.
3. Gunakan format markdown untuk jawaban yang terstruktur (poin, tabel, heading).
4. Jangan pernah mengarang informasi atau memberikan jawaban spekulatif tentang sekolah.
5. Jika ditanya hal di luar konteks sekolah, arahkan kembali ke topik PPDB dan informasi SMKN 2 Surakarta.
6. Sapa pengguna dengan ramah dan gunakan kata sapaan "Kak" atau "Adik".
7. Jika ada dokumen referensi yang diberikan, SELALU sebutkan sumber informasinya.

IDENTITAS:
- Nama: Kak Duta
- Sekolah: SMKN 2 Surakarta (Stemsa/Smakaduta)
- Fungsi: Menjawab pertanyaan seputar PPDB 2026 dan informasi umum sekolah
- Kepribadian: Ramah, sabar, informatif, profesional`;

// Ordered list of models for failover (S-04.1, S-04.2)
const MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemini-2.5-flash-preview-05-20",
] as const;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Get the latest user message for RAG query
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  // RAG: Find relevant content from knowledge base (PRD Section 6)
  let contextPrompt = "";
  if (lastUserMessage) {
    try {
      const userText = lastUserMessage.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join(" ");

      const relevantChunks = await findRelevantContent(userText, 3);
      contextPrompt = buildContextPrompt(relevantChunks);
    } catch (error) {
      // RAG failure is non-fatal — chat continues without context
      console.error("RAG retrieval failed, proceeding without context:", error);
    }
  }

  const systemPrompt = BASE_SYSTEM_PROMPT + contextPrompt;

  const modelMessages = await convertToModelMessages(messages);

  // Multi-model failover (S-04.1)
  let lastError: unknown;

  for (const modelId of MODELS) {
    try {
      const result = streamText({
        model: openrouter(modelId),
        system: systemPrompt,
        messages: modelMessages,
      });

      return result.toUIMessageStreamResponse();
    } catch (error) {
      lastError = error;
      console.error(`Model ${modelId} failed, trying next...`, error);
      continue;
    }
  }

  // All models failed
  console.error("All models failed:", lastError);
  return new Response(
    JSON.stringify({
      error:
        "Semua model AI sedang tidak tersedia. Silakan coba lagi nanti.",
    }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}
