"use client";

import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Sparkles } from "lucide-react";
import Image from "next/image";

export const defaultSuggestions = [
  "Apa syarat daftar PPDB 2026?",
  "Jurusan apa saja di SMKN 2?",
  "Bagaimana cara daftar zonasi?",
  "Kapan jadwal pendaftaran?",
  "Apa saja ekstrakurikuler di SMKN 2?",
  "Berapa kuota jalur prestasi?",
];

interface ChatEmptyStateProps {}

export function ChatEmptyState({}: ChatEmptyStateProps = {}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      {/* Avatar */}
      <div className="relative">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
          <Sparkles className="size-10 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-background bg-emerald-500" />
      </div>

      {/* Welcome Text */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Halo! Saya{" "}
          <span className="gradient-text">Kak Duta</span>
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Asisten virtual SMKN 2 Surakarta. Tanyakan apa saja tentang PPDB
          2026, jurusan, syarat pendaftaran, dan informasi sekolah lainnya.
        </p>
      </div>

      {/* Footnote */}
      <p className="text-[11px] text-muted-foreground/60">
        Jawaban berdasarkan dokumen resmi sekolah · Didukung AI
      </p>
    </div>
  );
}
