"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Link2,
  Sparkles,
  Database,
  Globe,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateExtractionInput } from "@/lib/validation";

export type SourceBadge = "auto" | "hf" | "academic";
export type ExecutionMode = "cloud" | "local";

interface ExtractionCardProps {
  onExtract: (payload: {
    url: string;
    source: SourceBadge;
    mode: ExecutionMode;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const ExtractionCard: React.FC<ExtractionCardProps> = ({
  onExtract,
  isSubmitting = false,
}) => {
  const [url, setUrl] = useState("");
  const [source, setSource] = useState<SourceBadge>("auto");
  const [mode, setMode] = useState<ExecutionMode>("cloud");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Quick preset helper
  const handleQuickPreset = (presetUrl: string, badge: SourceBadge) => {
    setUrl(presetUrl);
    setSource(badge);
    setValidationError(null);
  };

  // Listen for QuickActions clipboard/preset injection
  useEffect(() => {
    const handleSetUrl = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        const val = customEvent.detail.trim();
        setUrl(val);
        setValidationError(null);

        if (val.includes("huggingface.co") || val.includes("hf.co")) {
          setSource("hf");
        } else if (
          val.startsWith("magnet:?") ||
          val.includes("academictorrents") ||
          val.endsWith(".torrent")
        ) {
          setSource("academic");
        }
      }
    };

    window.addEventListener("runsync:set_url", handleSetUrl);
    return () => window.removeEventListener("runsync:set_url", handleSetUrl);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isSubmitting) return;

    // Validate using strict schema
    const validation = validateExtractionInput(url, source);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid extraction input.");
      return;
    }

    setValidationError(null);

    await onExtract({
      url: validation.normalizedInput || url.trim(),
      source,
      mode,
    });

    setUrl("");
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 rounded-2xl bg-white dark:bg-[#0c111e] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-3.5 transition-colors">
      {/* Title & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 tracking-wide">
            Extraction Composer
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]">
            Target & Swarm Input
          </span>
        </div>

        {isSubmitting && (
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-[11px] sm:text-xs font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="truncate">Arming pipeline...</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Main Command Input Bar */}
        <div className="relative flex items-center group">
          <Link2 className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 shrink-0 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400" />
          <input
            type="text"
            value={url}
            onChange={handleInputChange}
            disabled={isSubmitting}
            placeholder="Paste Hugging Face repo (e.g. org/model), dataset, or BitTorrent magnet link..."
            className="w-full bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 rounded-xl pl-10 pr-24 sm:pr-28 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all font-mono disabled:opacity-50"
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!url.trim() || isSubmitting}
            className="absolute right-1.5 h-7 sm:h-8 px-3 text-xs flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">Sending</span>
              </>
            ) : (
              <>
                <span>Extract</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs px-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Source Badges & Execution Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
          {/* Scrollable Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none no-scrollbar">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setSource("auto");
                setValidationError(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
                source === "auto"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold dark:bg-indigo-600/20 dark:text-indigo-300 dark:border-indigo-500/40"
                  : "bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900 hover:border-slate-300 dark:bg-[#070b14] dark:text-slate-400 dark:border-white/[0.06] dark:hover:text-slate-200 dark:hover:border-white/[0.1]"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto (Detection)</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setSource("hf");
                setValidationError(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
                source === "hf"
                  ? "bg-amber-50 text-amber-700 border border-amber-200 font-semibold dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
                  : "bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900 hover:border-slate-300 dark:bg-[#070b14] dark:text-slate-400 dark:border-white/[0.06] dark:hover:text-slate-200 dark:hover:border-white/[0.1]"
              }`}
            >
              <span>🤗 Hugging Face</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setSource("academic");
                setValidationError(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
                source === "academic"
                  ? "bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40"
                  : "bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900 hover:border-slate-300 dark:bg-[#070b14] dark:text-slate-400 dark:border-white/[0.06] dark:hover:text-slate-200 dark:hover:border-white/[0.1]"
              }`}
            >
              <span>🧲 Academic Torrents</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center self-start sm:self-auto bg-slate-100 dark:bg-[#070b14] p-1 rounded-xl border border-slate-200 dark:border-white/[0.06] shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setMode("cloud")}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all ${
                mode === "cloud"
                  ? "bg-indigo-600 text-white shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Database className="w-3 h-3" />
              <span>Cloud Extract</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setMode("local")}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all ${
                mode === "local"
                  ? "bg-indigo-600 text-white shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Local Fetch</span>
            </button>
          </div>
        </div>

        {/* Quick Example Presets (Discreet Helper Row) */}
        <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono overflow-x-auto no-scrollbar">
          <span className="shrink-0 text-slate-400 dark:text-slate-500">Presets:</span>
          <button
            type="button"
            onClick={() => handleQuickPreset("https://huggingface.co/openai/gpt-oss-20b", "hf")}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline shrink-0"
          >
            openai/gpt-oss-20b
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <button
            type="button"
            onClick={() => handleQuickPreset("https://huggingface.co/datasets/allenai/c4", "hf")}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline shrink-0"
          >
            allenai/c4
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <button
            type="button"
            onClick={() => handleQuickPreset("magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567&dn=Ubuntu-24.04", "academic")}
            className="hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline shrink-0"
          >
            Academic Torrent Demo
          </button>
        </div>
      </form>
    </div>
  );
};
