"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Clipboard,
  FileText,
  Boxes,
  Layers,
  BarChart2,
  HardDrive,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionItem {
  id: string;
  label: string;
  icon: React.ElementType;
  iconColor?: string;
  onClick?: () => void;
}

export const QuickActions: React.FC = () => {
  const router = useRouter();

  const actions: ActionItem[] = [
    {
      id: "paste",
      label: "Paste from Clipboard",
      icon: Clipboard,
      iconColor: "text-blue-400",
      onClick: async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            window.dispatchEvent(
              new CustomEvent("runsync:set_url", { detail: text.trim() })
            );
          }
        } catch (err) {
          console.error("Clipboard access denied:", err);
        }
      },
    },
    {
      id: "torrent",
      label: "Open .torrent File",
      icon: FileText,
      iconColor: "text-slate-300",
      onClick: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".torrent";
        input.onchange = (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          if (file) {
            window.dispatchEvent(
              new CustomEvent("runsync:set_url", { detail: file.name })
            );
          }
        };
        input.click();
      },
    },
    {
      id: "hf",
      label: "HF Dataset",
      icon: Boxes,
      iconColor: "text-amber-400",
      onClick: () => {
        window.dispatchEvent(
          new CustomEvent("runsync:set_url", {
            detail: "https://huggingface.co/datasets/common-crawl/raw-data",
          })
        );
      },
    },
    {
      id: "batch",
      label: "Batch Links",
      icon: Layers,
      iconColor: "text-purple-400",
      onClick: () => {
        window.dispatchEvent(
          new CustomEvent("runsync:set_url", {
            detail: "https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct",
          })
        );
      },
    },
    {
      id: "status",
      label: "Check Status",
      icon: BarChart2,
      iconColor: "text-emerald-400",
      onClick: () => {
        window.dispatchEvent(new CustomEvent("runsync:refresh_telemetry"));
      },
    },
    {
      id: "storage",
      label: "Manage Storage",
      icon: HardDrive,
      iconColor: "text-sky-400",
      onClick: () => {
        router.push("/storage");
      },
    },
  ];

  return (
    <div className="p-5 md:p-6 rounded-2xl bg-[#0D1424] border border-[#1A263D] shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm md:text-base font-semibold text-slate-100 tracking-tight">
          Quick Actions
        </h2>
        <span className="text-xs text-slate-500 font-mono">RunSync Tools</span>
      </div>

      {/* 2x3 Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 md:gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-xl bg-[#070B14] hover:bg-[#121B30]",
                "border border-[#1A263D] hover:border-blue-500/40 text-slate-300 hover:text-white",
                "transition-all text-xs font-medium cursor-pointer shadow-sm active:scale-[0.98] text-left"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", act.iconColor)} />
              <span className="truncate">{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};