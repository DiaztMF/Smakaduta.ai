"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Database,
  LogOut,
  GraduationCap,
  Loader2,
  CheckCircle,
  AlertCircle,
  File,
} from "lucide-react";

interface Source {
  sourceName: string;
  sourceType: string;
  chunkCount: number;
  createdAt: string;
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | "loading";
    message: string;
  } | null>(null);

  // Upload form state
  const [sourceName, setSourceName] = useState("");
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (secret.trim()) {
      setIsAuthenticated(true);
      fetchSources();
    }
  };

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/resources?secret=${encodeURIComponent(secret)}`
      );
      const data = await res.json();
      if (res.ok) {
        setSources(data.sources || []);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      console.error("Failed to fetch sources");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName.trim()) return;

    setUploadStatus({ type: "loading", message: "Memproses dokumen..." });

    const formData = new FormData();
    formData.append("secret", secret);
    formData.append("sourceName", sourceName);

    if (selectedFile) {
      formData.append("file", selectedFile);
    }
    if (textContent.trim()) {
      formData.append("text", textContent);
    }

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setUploadStatus({
          type: "success",
          message: `Berhasil! ${data.processedChunks}/${data.totalChunks} chunks diproses dari "${data.sourceName}"`,
        });
        setSourceName("");
        setTextContent("");
        setSelectedFile(null);
        fetchSources();
      } else {
        setUploadStatus({
          type: "error",
          message: data.error || "Upload gagal",
        });
      }
    } catch {
      setUploadStatus({ type: "error", message: "Koneksi gagal" });
    }
  };

  const handleDelete = async (sourceName: string) => {
    if (!confirm(`Hapus semua data dari "${sourceName}"?`)) return;

    try {
      const res = await fetch("/api/admin/resources", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, sourceName }),
      });

      if (res.ok) {
        fetchSources();
      }
    } catch {
      console.error("Failed to delete source");
    }
  };

  const handleInitDb = async () => {
    setUploadStatus({ type: "loading", message: "Inisialisasi database..." });
    try {
      const res = await fetch("/api/admin/init-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json();

      if (res.ok) {
        setUploadStatus({
          type: "success",
          message: "Database berhasil diinisialisasi!",
        });
      } else {
        setUploadStatus({
          type: "error",
          message: data.error || "Inisialisasi gagal",
        });
      }
    } catch {
      setUploadStatus({ type: "error", message: "Koneksi gagal" });
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-8 shadow-lg"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary">
              <GraduationCap className="size-7 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Masukkan password admin untuk mengakses dashboard
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="admin-secret"
              className="text-sm font-medium"
            >
              Password Admin
            </label>
            <input
              id="admin-secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Masukkan password..."
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Masuk
          </button>
        </form>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="size-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-sm font-bold">
              Admin Dashboard
            </span>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="size-3.5" />
            Keluar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {/* Status Banner */}
        {uploadStatus && (
          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              uploadStatus.type === "success"
                ? "border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                : uploadStatus.type === "error"
                  ? "border-red-500/20 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                  : "border-primary/20 bg-primary/5 text-primary"
            }`}
          >
            {uploadStatus.type === "success" && (
              <CheckCircle className="size-4 shrink-0" />
            )}
            {uploadStatus.type === "error" && (
              <AlertCircle className="size-4 shrink-0" />
            )}
            {uploadStatus.type === "loading" && (
              <Loader2 className="size-4 shrink-0 animate-spin" />
            )}
            {uploadStatus.message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Upload Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold">
                Unggah Dokumen
              </h2>
              <button
                onClick={handleInitDb}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Database className="size-3.5" />
                Init DB
              </button>
            </div>

            <form
              onSubmit={handleUpload}
              className="space-y-4 rounded-xl border border-border bg-card p-6"
            >
              {/* Source Name */}
              <div className="space-y-1.5">
                <label htmlFor="source-name" className="text-sm font-medium">
                  Nama Sumber
                </label>
                <input
                  id="source-name"
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="Contoh: Buku Panduan PPDB 2026"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              {/* PDF Upload */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">File PDF</label>
                <label
                  htmlFor="file-upload"
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  {selectedFile ? (
                    <>
                      <File className="size-8 text-primary" />
                      <span className="text-sm font-medium">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="size-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Klik untuk memilih file PDF
                      </span>
                    </>
                  )}
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    className="hidden"
                  />
                </label>
              </div>

              {/* Or separator */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">ATAU</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Text Input */}
              <div className="space-y-1.5">
                <label htmlFor="text-input" className="text-sm font-medium">
                  Input Teks Manual
                </label>
                <textarea
                  id="text-input"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Ketik atau paste teks pengumuman, informasi PPDB, dll..."
                  rows={6}
                  className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                type="submit"
                disabled={uploadStatus?.type === "loading"}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadStatus?.type === "loading" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Proses & Simpan
              </button>
            </form>
          </section>

          {/* Knowledge Base Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold">
                Basis Pengetahuan
              </h2>
              <button
                onClick={fetchSources}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Refresh
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : sources.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <FileText className="size-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Belum ada dokumen di basis pengetahuan
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Unggah PDF atau teks di panel kiri
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {sources.map((source) => (
                    <li
                      key={source.sourceName}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                            source.sourceType === "pdf"
                              ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                              : "bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                          }`}
                        >
                          <FileText className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {source.sourceName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {source.chunkCount} chunks ·{" "}
                            {source.sourceType.toUpperCase()} ·{" "}
                            {new Date(source.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(source.sourceName)}
                        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/30"
                        aria-label={`Delete ${source.sourceName}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
