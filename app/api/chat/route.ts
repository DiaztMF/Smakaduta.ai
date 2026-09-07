import { streamText, UIMessage, convertToModelMessages } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { findRelevantContent, buildContextPrompt } from "@/lib/rag";
import { findCachedAnswer } from "@/lib/answer-cache";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const baseURL = process.env.AI_BASE_URL || "https://9router.menoo.my.id/v1";
const apiKey =
  process.env.AI_API_KEY ||
  process.env.OPENROUTER_API_KEY ||
  "";

const customFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (!response.body) return response;

  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      // Normalize prompt_tokens_details: {} to prevent Zod validation errors in @openrouter/ai-sdk-provider
      const fixed = text.replace(
        /"prompt_tokens_details"\s*:\s*\{\s*\}/g,
        '"prompt_tokens_details":{"cached_tokens":0}'
      );
      controller.enqueue(new TextEncoder().encode(fixed));
    },
  });

  return new Response(response.body.pipeThrough(transformStream), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

const aiProvider = createOpenRouter({
  baseURL,
  apiKey,
  fetch: customFetch,
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

const MAX_OUTPUT_TOKENS = 8192;

// Ordered list of models for chat with failover (S-04.1, S-04.2)
const ACTIVE_MODEL = process.env.AI_MODEL || "oc/big-pickle";
const FALLBACK_MODELS = (
  process.env.AI_FALLBACK_MODELS ||
  "oc/mimo-v2.5-free,oc/ling-3.0-flash-fin-free,oc/muse-spark-1.3-contributor-free"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const MODELS = Array.from(new Set([ACTIVE_MODEL, ...FALLBACK_MODELS]));

export async function POST(req: Request) {
  if (MODELS.length === 0) {
    return new Response(
      JSON.stringify({
        error:
          "Model AI belum dikonfigurasi. Silakan tentukan nama model AI terlebih dahulu.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  // Get the latest user message for RAG query
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  // RAG: Find relevant content from knowledge base (PRD Section 6)
  let contextPrompt = "";
  let userText = "";

  if (lastUserMessage) {
    userText = lastUserMessage.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join(" ");

    // ─── Cache Check: Bypass RAG untuk pertanyaan template ───────────
    // Jika pertanyaan cocok dengan template yang sudah diketahui (preset suggestions),
    // stream jawaban langsung dengan penanganan failover yang aman.
    const cached = findCachedAnswer(userText);
    if (cached) {
      const cachedSystemPrompt = `${BASE_SYSTEM_PROMPT}\n\nJAWABAN REFERENSI (gunakan ini sebagai basis, boleh ditambah sapaan hangat):\n${cached.answer}`;
      const convertedMessages = await convertToModelMessages(messages);

      for (const modelId of MODELS) {
        try {
          const result = streamText({
            model: aiProvider(modelId),
            system: cachedSystemPrompt,
            messages: convertedMessages,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            onError({ error }) {
              console.error(`Stream error on cached model ${modelId}:`, error);
            },
          });

          return result.toUIMessageStreamResponse();
        } catch (error: unknown) {
          const errMsg = error instanceof Error ? error.message : String(error);
          const isRateLimit =
            errMsg.includes("429") || errMsg.toLowerCase().includes("rate limit");

          if (isRateLimit) {
            console.warn(`Rate limit hit on ${modelId} for cached answer, switching to next fallback model...`);
            continue;
          }

          console.error(`Model ${modelId} failed for cached query, trying next...`, error);
          continue;
        }
      }
    }
    // ──────────────────────────────────────────────────────────────────

    try {
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
  let hitRateLimit = false;

  for (const modelId of MODELS) {
    try {
      const result = streamText({
        model: aiProvider(modelId),
        system: systemPrompt,
        messages: modelMessages,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        onError({ error }) {
          console.error(`Stream error on model ${modelId}:`, error);
        },
      });

      return result.toUIMessageStreamResponse();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const isRateLimit =
        errMsg.includes("429") || errMsg.toLowerCase().includes("rate limit");

      if (isRateLimit) {
        hitRateLimit = true;
        console.warn(`Rate limit hit on ${modelId}, switching to next fallback model...`);
        continue;
      }

      lastError = error;
      console.error(`Model ${modelId} failed, trying next...`, error);
      continue;
    }
  }

  // All models failed
  console.error("All models failed:", lastError);
  if (hitRateLimit) {
    return new Response(
      JSON.stringify({
        error:
          "Layanan AI sedang sibuk (semua model mencapai limit rate). Silakan coba lagi beberapa saat lagi.",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      error:
        "Semua model AI sedang tidak tersedia. Silakan coba lagi nanti.",
    }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}
