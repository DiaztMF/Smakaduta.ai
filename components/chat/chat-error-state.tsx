"use client";

import { AlertTriangle, RefreshCw, WifiOff, Zap } from "lucide-react";

type ErrorType = "rate_limit" | "network" | "all_models_failed" | "generic";

interface ChatErrorStateProps {
  error: Error | unknown;
  onRetry?: () => void;
}

function detectErrorType(error: unknown): ErrorType {
  if (!error) return "generic";
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (msg.includes("429") || msg.includes("rate limit") || msg.includes("too many requests")) {
    return "rate_limit";
  }
  if (msg.includes("503") || msg.includes("semua model") || msg.includes("all models")) {
    return "all_models_failed";
  }
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch")) {
    return "network";
  }
  return "generic";
}

const ERROR_CONFIG: Record<ErrorType, {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  description: string;
  tip: string;
}> = {
  rate_limit: {
    icon: Zap,
    iconClass: "text-yellow-500",
    title: "Batas Permintaan Tercapai",
    description: "Kak Duta sedang sangat sibuk! Layanan AI memiliki batas permintaan per menit.",
    tip: "Coba lagi dalam beberapa detik ya, Kak 😊",
  },
  all_models_failed: {
    icon: AlertTriangle,
    iconClass: "text-red-500",
    title: "Semua Model AI Tidak Tersedia",
    description: "Semua layanan AI yang digunakan sedang mengalami gangguan sementara.",
    tip: "Mohon bersabar dan coba lagi dalam beberapa menit.",
  },
  network: {
    icon: WifiOff,
    iconClass: "text-blue-500",
    title: "Gagal Terhubung ke Server",
    description: "Tidak dapat menghubungi server. Periksa koneksi internet kamu.",
    tip: "Pastikan koneksi internet stabil, lalu coba lagi.",
  },
  generic: {
    icon: AlertTriangle,
    iconClass: "text-muted-foreground",
    title: "Terjadi Kesalahan",
    description: "Maaf, ada sesuatu yang tidak berjalan dengan baik.",
    tip: "Coba kirim pesan kembali atau muat ulang halaman.",
  },
};

export function ChatErrorState({ error, onRetry }: ChatErrorStateProps) {
  const type = detectErrorType(error);
  const config = ERROR_CONFIG[type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
      <div className="mt-0.5 shrink-0">
        <Icon className={`h-4 w-4 ${config.iconClass}`} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-medium text-foreground">{config.title}</span>
        <span className="text-muted-foreground">{config.description}</span>
        <span className="text-muted-foreground/70 text-xs">{config.tip}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <RefreshCw className="h-3 w-3" />
          Coba Lagi
        </button>
      )}
    </div>
  );
}
