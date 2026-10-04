"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, Link2, Sparkles, Database, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Listen for QuickActions clipboard/preset injection
  useEffect(() => {
    const handleSetUrl = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        const val = customEvent.detail.trim();
        setUrl(val);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isSubmitting) return;

    await onExtract({
      url: url.trim(),
      source,
      mode,
    });

    setUrl("");
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-[#0D1424] border border-[#1A263D] shadow-xl space-y-3.5 sm:space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">New Extraction</span>
        {isSubmitting && (
          <div className="flex items-center gap-1.5 text-blue-400 text-[11px] sm:text-xs font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="truncate">Dispatching...</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Main URL Input Bar */}
        <div className="relative flex items-center">
          <Link2 className="w-4 h-4 text-slate-500 absolute left-3" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isSubmitting}
            placeholder="Paste infohash, magnet, or Hugging Face repository link..."
            className="w-full bg-[#070B14] border border-[#1A263D] focus:border-blue-500 rounded-xl pl-9 pr-24 sm:pr-28 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all font-mono disabled:opacity-60"
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!url.trim() || isSubmitting}
            className="absolute right-1.5 h-7 sm:h-8 px-2.5 sm:px-3.5 text-xs flex items-center gap-1 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
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

        {/* Source Badges & Execution Mode Switcher (Horizontal scroll safe on small phones) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
          {/* Scrollable Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none no-scrollbar">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setSource("auto")}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
                source === "auto"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                  : "bg-[#070B14] text-slate-400 border border-[#1A263D] hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto (Detection)</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setSource("hf")}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
                source === "hf"
                  ? "bg-amber-600/20 text-amber-400 border border-amber-500/40"
                  : "bg-[#070B14] text-slate-400 border border-[#1A263D] hover:text-slate-200"
              }`}
            >
              <span>🤗 Hugging Face</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setSource("academic")}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
                source === "academic"
                  ? "bg-rose-600/20 text-rose-400 border border-rose-500/40"
                  : "bg-[#070B14] text-slate-400 border border-[#1A263D] hover:text-slate-200"
              }`}
            >
              <span>🧲 Academic Torrents</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center self-start sm:self-auto bg-[#070B14] p-0.5 rounded-lg border border-[#1A263D] shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setMode("cloud")}
              className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium flex items-center gap-1.5 transition-all ${
                mode === "cloud"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Database className="w-3 h-3" />
              <span>Cloud Extract</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setMode("local")}
              className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium flex items-center gap-1.5 transition-all ${
                mode === "local"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Local Fetch</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};