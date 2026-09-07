# Smakaduta.ai UI Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate Smakaduta.ai's chat interface with AI SDK Elements (Reasoning collapsible, interactive RAG sources, voice speech input) and Shadcn UI (School info modal, reset chat dialog, Kak Duta avatar persona, and comprehensive tooltips).

**Architecture:** Client-side components built on Next.js 16 (App Router) and React 19. Chat message stream components parse reasoning and source references to display rich interactive widgets. The header is equipped with accessible dialog modals and badge indicators.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, AI SDK v6 (`@ai-sdk/react`), Radix UI / Shadcn UI primitives, Lucide React icons.

## Global Constraints

- Preserve all existing Next.js App Router and React 19 conventions ("use client" directives where state/browser APIs are required).
- Maintain 9router streaming compatibility and custom SSE normalizer.
- Strict typing with zero TypeScript errors on `pnpm build`.
- Zero secrets committed to the repository.

---

### Task 1: Add Interactive Reasoning and RAG Sources to Chat Messages

**Files:**
- Modify: `components/chat/chat-messages.tsx`
- Test: Verify with `pnpm build` and interactive preview

**Interfaces:**
- Consumes: `Reasoning`, `ReasoningTrigger`, `ReasoningContent` from `@/components/ai-elements/reasoning`
- Consumes: `Sources`, `SourcesTrigger`, `SourcesContent`, `Source` from `@/components/ai-elements/sources`
- Produces: Enhanced `ChatMessages` component rendering reasoning collapsibles and parsed RAG sources.

- [ ] **Step 1: Update `components/chat/chat-messages.tsx` with Reasoning and Sources rendering**

Enhance `ChatMessages` to:
1. Extract and render `part.type === "reasoning"` using `<Reasoning>` and `<ReasoningContent>`.
2. Parse cited documents (`--- DOKUMEN REFERENSI ---` or `[Sumber X: ...]`) from assistant message text or custom data to render `<Sources>`.
3. Keep the clean copy and retry actions.

- [ ] **Step 2: Run typecheck to verify Task 1**

Run: `npx tsc --noEmit`
Expected: `TypeScript: No errors found`

- [ ] **Step 3: Commit Task 1**

```bash
git add components/chat/chat-messages.tsx
git commit -m "feat(ui): add reasoning accordion and rag sources display in chat messages"
```

---

### Task 2: Integrate Speech-to-Text Voice Input in Chat Page

**Files:**
- Modify: `app/page.tsx`
- Test: Verify speech input toggle, microphone permission, and text appending

**Interfaces:**
- Consumes: `SpeechInput` from `@/components/ai-elements/speech-input`
- Produces: Voice input capability in prompt textarea with `lang="id-ID"`.

- [ ] **Step 1: Update `app/page.tsx` to include `<SpeechInput>`**

Integrate `<SpeechInput>` inside `PromptInputFooter`:
1. Pass `lang="id-ID"`.
2. When voice transcript is recognized (`onTranscriptionChange`), append or set to `input` state.
3. Add a tooltip or badge indicating voice search.

- [ ] **Step 2: Run typecheck to verify Task 2**

Run: `npx tsc --noEmit`
Expected: `TypeScript: No errors found`

- [ ] **Step 3: Commit Task 2**

```bash
git add app/page.tsx
git commit -m "feat(ui): integrate indonesian speech-to-text input in prompt footer"
```

---

### Task 3: Create School Info & Hotline Modal Component

**Files:**
- Create: `components/chat/school-info-dialog.tsx`
- Test: Verify dialog opening, closing, and copyable hotline information

**Interfaces:**
- Consumes: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger` from `@/components/ui/dialog`
- Produces: `<SchoolInfoDialog>` component with official school contacts, PPDB links, and location.

- [ ] **Step 1: Write `components/chat/school-info-dialog.tsx`**

Include:
- School address: Jl. LU. Adisucipto No. 33, Manahan, Banjarsari, Surakarta
- Hotline: (0271) 714901
- External links to PPDB Jateng (`https://ppdb.jatengprov.go.id`) and official website (`https://smkn2surakarta.sch.id`)

- [ ] **Step 2: Run typecheck to verify Task 3**

Run: `npx tsc --noEmit`
Expected: `TypeScript: No errors found`

- [ ] **Step 3: Commit Task 3**

```bash
git add components/chat/school-info-dialog.tsx
git commit -m "feat(ui): add school info and ppdb hotline dialog"
```

---

### Task 4: Create Reset / Clear Conversation Confirmation Dialog

**Files:**
- Create: `components/chat/reset-chat-dialog.tsx`
- Test: Verify confirmation prompt and chat clearing

**Interfaces:**
- Consumes: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` from `@/components/ui/dialog`
- Produces: `<ResetChatDialog onReset={...}>` component.

- [ ] **Step 1: Write `components/chat/reset-chat-dialog.tsx`**

Include confirmation warning before clearing active messages.

- [ ] **Step 2: Run typecheck to verify Task 4**

Run: `npx tsc --noEmit`
Expected: `TypeScript: No errors found`

- [ ] **Step 3: Commit Task 4**

```bash
git add components/chat/reset-chat-dialog.tsx
git commit -m "feat(ui): add reset conversation confirmation dialog"
```

---

### Task 5: Enhance Header with Kak Duta Persona, Badges, and Dialogs

**Files:**
- Modify: `components/chat/chat-header.tsx`
- Modify: `app/page.tsx` (pass `onReset` to `ChatHeader` or use window reload / state reset)
- Test: Verify responsive navigation, avatar, online dot, theme toggle, and modals

**Interfaces:**
- Consumes: `SchoolInfoDialog`, `ResetChatDialog`, `Tooltip`, `Badge`, `Avatar`
- Produces: Polished, responsive `ChatHeader`.

- [ ] **Step 1: Update `components/chat/chat-header.tsx` and integrate in `app/page.tsx`**

Add:
- Avatar with "KD" / bot icon with glowing emerald status indicator
- Title "Smakaduta.ai" + Badge "PPDB 2026"
- Actions: School Info button, Reset Chat button, Theme toggle
- Wrap action buttons in `<Tooltip>` for accessibility.

- [ ] **Step 2: Run typecheck and production build**

Run: `pnpm build`
Expected: Build passes with zero errors

- [ ] **Step 3: Commit Task 5**

```bash
git add components/chat/chat-header.tsx app/page.tsx
git commit -m "feat(ui): upgrade header with kak duta persona, status badge, and action dialogs"
```
