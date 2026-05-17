"use client";

import { Moon, Sun, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

export function ChatHeader() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("smakaduta-theme");
    if (stored === "dark") {
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
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="size-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold font-heading leading-none tracking-tight">
              Smakaduta.ai
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              SMKN 2 Surakarta
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
            aria-label="Toggle theme"
            id="theme-toggle"
          >
            {isDark ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
