"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "pill" | "icon";
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  variant = "icon",
}) => {
  const { theme, toggleTheme, isMounted } = useTheme();

  if (!isMounted) {
    return <div className="w-8 h-8 rounded-xl bg-slate-200/50 dark:bg-white/[0.05]" />;
  }

  const isDark = theme === "dark";

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-all select-none",
          "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200",
          "dark:bg-[#080c16] dark:hover:bg-[#121828] dark:text-slate-300 dark:border-white/[0.06]",
          className
        )}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        <span className="flex items-center gap-2">
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span>{isDark ? "Dark Theme" : "Light Theme"}</span>
        </span>
        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] font-bold">
          {theme}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center select-none active:scale-95",
        "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm",
        "dark:bg-[#0c111e] dark:hover:bg-[#141b2e] dark:text-slate-300 dark:border-white/[0.08]",
        className
      )}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
      )}
    </button>
  );
};
