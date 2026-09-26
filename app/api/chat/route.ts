import {
  streamText,
  UIMessage,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
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

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const fixChunkObject = (obj: unknown): unknown => {
    if (obj && typeof obj === "object") {
      const record = obj as Record<string, unknown>;
      // Fix choices[].delta and choices[].message
      if (Array.isArray(record.choices)) {
        for (const choice of record.choices as Record<string, unknown>[]) {
          const delta = choice.delta as Record<string, unknown> | null | undefined;
          if (delta && typeof delta === "object") {
            if (delta.role === null) {
              delta.role = "assistant";
            }
            if ("reasoning_content" in delta) {
              if (delta.reasoning == null) {
                delta.reasoning = delta.reasoning_content as unknown;
              }
              delete delta.reasoning_content;
            }
          }
          const message = choice.message as Record<string, unknown> | null | undefined;
          if (message && typeof message === "object") {
            if (message.role === null) {
              message.role = "assistant";
            }
            if ("reasoning_content" in message) {
              if (message.reasoning == null) {
                message.reasoning = message.reasoning_content as unknown;
              }
              delete message.reasoning_content;
            }
          }
        }
      }
      // Fix usage.prompt_tokens_details: {} -> {"cached_tokens":0}
      const usage = record.usage as Record<string, unknown> | undefined;
      if (
        usage &&
        typeof usage.prompt_tokens_details === "object" &&
        usage.prompt_tokens_details !== null &&
        Object.keys(usage.prompt_tokens_details as object).length === 0
      ) {
        usage.prompt_tokens_details = { cached_tokens: 0 };
      }
    }
    return obj;
  };

  const fallbackStringFix = (text: string) =>
    text
      .replace(
        /"prompt_tokens_details"\s*:\s*\{\s*\}/g,
        '"prompt_tokens_details":{"cached_tokens":0}'
      )
      .replace(/"role"\s*:\s*null/g, '"role":"assistant"')
      .replace(/"reasoning_content"\s*:/g, '"reasoning":');

  const processLine = (line: string): string => {
    if (line.startsWith("data: ")) {
      const jsonStr = line.slice(6);
      const trimmed = jsonStr.trim();
      if (trimmed === "" || trimmed === "[DONE]") {
        return line;
      }
      try {
        const obj = JSON.parse(jsonStr) as unknown;
        fixChunkObject(obj);
        return "data: " + JSON.stringify(obj);
      } catch {
        return fallbackStringFix(line);
      }
    }
    return fallbackStringFix(line);
  };

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      buffer += text;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const out = processLine(line);
        controller.enqueue(encoder.encode(out + "\n"));
      }
    },
    flush(controller) {
      // Flush decoder remainder
      const tail = decoder.decode();
      if (tail) buffer += tail;
      if (buffer) {
        const out = processLine(buffer);
        controller.enqueue(encoder.encode(out));
        buffer = "";
      }
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
const ACTIVE_MODEL = process.env.AI_MODEL || "kc/kilo-auto/free";
const FALLBACK_MODELS = (
  process.env.AI_FALLBACK_MODELS || "kc/openrouter/free"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const MODELS = Array.from(new Set([ACTIVE_MODEL, ...FALLBACK_MODELS]));

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const rateBuckets = new Map<string, number[]>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateBuckets.set(ip, hits);
  return false;
}

function streamStaticAnswer(answer: string, sourceName: string): Response {
  const text = `Halo Kak! Senang bisa membantu 😊\n\n${answer}\n\n*Sumber: ${sourceName}*`;
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const id = "cached-answer";
      writer.write({ type: "start" });
      writer.write({ type: "text-start", id });
      writer.write({ type: "text-delta", id, delta: text });
      writer.write({ type: "text-end", id });
      writer.write({ type: "finish" });
    },
    onError: (error) => (error instanceof Error ? error.message : String(error)),
  });
  return createUIMessageStreamResponse({ stream });
}

export async function POST(req: Request) {
  if (isRateLimited(getClientIp(req))) {
    return Response.json(
      {
        error:
          "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi ya.",
      },
      { status: 429 }
    );
  }

  if (MODELS.length === 0) {
    return new Response(
      JSON.stringify({
        error:
          "Model AI belum dikonfigurasi. Silakan tentukan nama model AI terlebih dahulu.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let messages: UIMessage[];
  try {
    const body = await req.json();
    messages = body.messages;
  } catch {
    return Response.json({ error: "Body harus JSON valid." }, { status: 400 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "Pesan tidak boleh kosong. Tulis pertanyaan dulu ya." },
      { status: 400 }
    );
  }

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
    // Cached answer disajikan statis tanpa panggil LLM: 0 kuota, 0 latency,
    // tetap jalan saat semua model outage. Model AI hanya dipakai untuk
    // pertanyaan non-template di bawah.
    const cached = findCachedAnswer(userText);
    if (cached) {
      return streamStaticAnswer(cached.answer, cached.sourceName);
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
