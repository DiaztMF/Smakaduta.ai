"use client";

import { useEffect, useState } from "react";
import { Info, Moon, RotateCcw, Sparkles, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SchoolInfoDialog } from "@/components/chat/school-info-dialog";
import { ResetChatDialog } from "@/components/chat/reset-chat-dialog";

export interface ChatHeaderProps {
  onReset?: () => void;
  hasMessages?: boolean;
}

export function ChatHeader({ onReset, hasMessages = false }: ChatHeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkTheme =
      localStorage.getItem("smakaduta-theme") === "dark" ||
      document.documentElement.classList.contains("dark");
    if (isDarkTheme) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("smakaduta-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("smakaduta-theme", "light");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 w-full items-center justify-between px-4 md:px-6">
        {/* Brand & Persona */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Kak Duta avatar with glowing emerald pulse dot */}
          <div className="relative flex shrink-0 items-center justify-center">
            <Avatar className="size-8 sm:size-9 rounded-xl border-0 bg-gradient-to-br from-primary to-accent text-white shadow-sm shadow-primary/25 after:hidden">
              <AvatarFallback className="rounded-xl bg-transparent text-white">
                <Sparkles className="size-4" />
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 flex size-2.5 z-10">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full border-2 border-background bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
            </span>
          </div>

          {/* Titles & Badge */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-sm font-bold tracking-tight text-foreground sm:text-base select-none">
                Smakaduta.ai
              </span>
              <Badge
                variant="secondary"
                className="hidden sm:inline-flex text-[10px] font-semibold"
              >
                PPDB 2026
              </Badge>
            </div>
            <span className="text-[11px] leading-tight text-muted-foreground select-none">
              Kak Duta
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* School Info Dialog */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <SchoolInfoDialog
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 cursor-pointer rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
                      aria-label="Informasi & Kontak Sekolah"
                    >
                      <Info className="size-4" />
                    </Button>
                  }
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Informasi & Kontak Sekolah
            </TooltipContent>
          </Tooltip>

          {/* Reset Chat Dialog */}
          {onReset && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <ResetChatDialog
                    onReset={onReset}
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={!hasMessages}
                        className="size-8 cursor-pointer rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                        aria-label="Mulai Percakapan Baru"
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                    }
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Mulai Percakapan Baru
              </TooltipContent>
            </Tooltip>
          )}

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="size-8 cursor-pointer rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
                aria-label="Ubah Tema"
                id="theme-toggle"
              >
                {isDark ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Ubah Tema</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
