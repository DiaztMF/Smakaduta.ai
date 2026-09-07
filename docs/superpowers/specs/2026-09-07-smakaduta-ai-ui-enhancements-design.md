# Design Document: Smakaduta.ai UI Enhancements

**Date:** 2026-09-07  
**Topic:** Chat UI Enhancements with AI SDK Elements & Shadcn UI  
**Target Project:** SMKADUTA AI (`smakaduta-ai`)  

---

## 1. Overview & Objectives

Smakaduta.ai is the official RAG-based AI chatbot for SMK Negeri 2 Surakarta (Stemsa/Smakaduta), providing prospective students and parents with instant, authoritative information regarding PPDB 2026, academic programs, facilities, and school policies.

This design document specifies the UI and interaction upgrade using **AI SDK Elements** and **shadcn/ui** to transform the interface into a modern, accessible, and polished conversational experience.

The improvements are structured into two synchronized phases:
1. **Phase 1: Chat Stream & AI Interaction Enhancements (AI SDK Elements)**
2. **Phase 2: Header Persona, Controls, & Dialogue Polish (shadcn/ui)**

---

## 2. Phase 1: Chat Stream & AI Interaction Enhancements

### 2.1. Reasoning Collapsible (`<Reasoning>` & `<ReasoningContent>`)
* **Component Location:** `components/ai-elements/reasoning.tsx`
* **Purpose:** Render real-time and post-stream reasoning tokens (*chain-of-thought*) produced by reasoning-capable models (such as `oc/mimo-v2.5-free` and `oc/ling-3.0-flash-fin-free`).
* **Behavior:**
  * Opens automatically while the model is actively outputting reasoning chunks.
  * Shows animated Shimmer text: `"Kak Duta sedang menganalisis..."` with a brain icon.
  * Measures thinking duration (in seconds).
  * Automatically collapses into an accordion once regular response tokens begin streaming.
  * Users can expand/collapse the reasoning section at any time to inspect the model's rationale.

### 2.2. Interactive RAG Sources (`<Sources>` & `<Source>`)
* **Component Location:** `components/ai-elements/sources.tsx`
* **Data Flow:**
  * The backend (`app/api/chat/route.ts`) retrieves relevant chunks via `findRelevantContent(userText, 3)`.
  * The system prompt embeds document source headers (e.g. `[Sumber 1: Profil Sekolah SMKN 2 Surakarta (relevansi: 65%)]`).
  * In the frontend (`components/chat/chat-messages.tsx`), assistant messages that cite school documents parse and display a dedicated `<Sources>` badge and expandable drawer.
* **Visual Presentation:**
  * Displays a count badge: `"Digunakan X dokumen referensi"`.
  * On expand, lists each cited document title, badge type (`Text` / `PDF`), and relevance badge (e.g. `65% relevan`).

### 2.3. Speech-to-Text Voice Input (`<SpeechInput>`)
* **Component Location:** `components/ai-elements/speech-input.tsx`
* **Integration Location:** Mounted inside `PromptInputFooter` in `app/page.tsx`.
* **Configuration:**
  * `lang="id-ID"` for accurate Indonesian speech recognition (including terms like PPDB, Zonasi, Rekayasa Perangkat Lunak, Stemsa).
  * On transcript receipt, updates `input` state directly, allowing the user to review or edit before sending.
  * Displays active recording animation (`animate-ping` pulsing rings in red) while listening.
  * Gracefully hides or disables if the browser environment does not support `SpeechRecognition`.

---

## 3. Phase 2: Header Persona, Controls, & Dialogue Polish

### 3.1. Header Persona & Status
* **Component Location:** `components/chat/chat-header.tsx`
* **Features:**
  * School brand logo / avatar of "Kak Duta" with a green pulse dot indicating `Online`.
  * Badge tag: `PPDB 2026`.
  * Responsive layout: clean on mobile smartphones and full desktop screens.

### 3.2. School Info & Hotline Dialog (`<Dialog>`)
* **Components Used:** `components/ui/dialog.tsx`
* **Trigger:** "Info & Kontak" button in the header.
* **Content:**
  * Posko PPDB address: Jl. LU. Adisucipto No. 33, Manahan, Kec. Banjarsari, Kota Surakarta.
  * Hotline telepon & WhatsApp: (0271) 714901.
  * Quick links to official portal: `https://ppdb.jatengprov.go.id` and `https://smkn2surakarta.sch.id`.

### 3.3. Clear / Reset Conversation Dialog (`<AlertDialog>`)
* **Components Used:** `components/ui/dialog.tsx` / `components/ui/button.tsx`
* **Trigger:** Reset icon button in the header.
* **Behavior:** Confirms whether user wants to clear the chat history, then resets messages state and returns to `ChatEmptyState`.

### 3.4. Refined Tooltips (`<Tooltip>`)
* **Components Used:** `components/ui/tooltip.tsx`
* **Coverage:**
  * Send button ("Kirim pertanyaan (Enter)")
  * Mic button ("Tanya lewat suara")
  * Stop generation button ("Hentikan respon")
  * Theme toggle ("Mode Gelap / Terang")
  * Copy message & Regenerate action buttons

---

## 4. Technical Constraints & Compatibility

1. **Next.js 16 + React 19:** All components must adhere to client component boundaries (`"use client"`), avoid deprecated hooks, and maintain strict typing.
2. **Streaming Resilience:** The custom fetch normalizer in `app/api/chat/route.ts` remains intact to sanitize 9router SSE chunks.
3. **No External Secret Leaks:** No API keys are committed or exposed client-side.
4. **Tailwind CSS v4:** Styling uses existing semantic variables (`bg-primary`, `text-muted-foreground`, `border-border/50`).

---

## 5. Testing & Verification Plan

1. **Voice Input Verification:** Verify mic permission dialog, Indonesian speech transcription into input textarea, and cancel/stop behavior.
2. **Reasoning Verification:** Trigger reasoning model test (e.g. `oc/ling-3.0-flash-fin-free`) and ensure collapsible accordion behaves smoothly.
3. **Sources Verification:** Verify RAG questions display the interactive source drawer with school document metadata.
4. **Header Action Verification:** Test Info dialog pop-up, Reset chat action, and theme switcher toggle.
5. **Production Build:** Run `pnpm build` to verify zero TypeScript errors and successful static/dynamic bundle compilation.
