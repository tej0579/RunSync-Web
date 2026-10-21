"use client";

import React, { useState } from "react";
import {
  FileText,
  Pause,
  X,
  HardDrive,
  DownloadCloud,
  CheckCircle2,
  Clock,
  Zap,
  Radio,
  Layers,
} from "lucide-react";
import { ActiveTaskItem } from "@/types/telemetry";
import { cn } from "@/lib/utils";

interface ActiveTransfersProps {
  tasks: ActiveTaskItem[];
  onPause: (taskId: string) => void;
  onResume: (taskId: string) => void;
  onCancel: (taskId: string) => void;
}

export const ActiveTransfers: React.FC<ActiveTransfersProps> = ({
  tasks = [],
  onCancel,
}) => {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const handleConfirmCancel = async (taskId: string) => {
    setCancellingId(taskId);
    setConfirmCancelId(null);
    try {
      await onCancel(taskId);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 rounded-2xl bg-[#0c111e] border border-white/[0.08] shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-semibold text-white tracking-wide whitespace-nowrap">
              Active Stream Pipeline
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0 font-bold">
              {tasks.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono">
          {tasks.length > 0 ? (
            <span className="flex items-center gap-2 text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="hidden sm:inline text-[11px] font-medium">Real-time Stream Pipeline</span>
              <span className="sm:hidden text-[10px] font-medium">Streaming</span>
            </span>
          ) : (
            <span className="text-slate-400 font-mono text-[11px]">Worker Idle</span>
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        /* Empty State */
        <div className="py-10 px-4 rounded-xl border border-dashed border-white/[0.07] bg-[#070b14]/50 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-2.5 text-slate-500">
            <Radio className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-xs font-semibold text-slate-300">
            No Active Stream Operations
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm mt-1 leading-relaxed">
            Dispatch a model or dataset link above to establish a live pipeline into Google Drive.
          </p>
        </div>
      ) : (
        /* Active Task List */
        <div className="space-y-3">
          {tasks.map((task) => {
            const rawProgress = Number(task.progress || 0);
            const safeProgress = isNaN(rawProgress)
              ? 0
              : Math.min(Math.max(rawProgress, 0), 100);
            const isTransferring = task.status === "transferring";
            const isComplete = safeProgress >= 100;
            const isCancelling = cancellingId === task.id;
            const isConfirming = confirmCancelId === task.id;

            return (
              <div
                key={task.id}
                className="p-3.5 sm:p-4 rounded-xl bg-[#070b14] border border-white/[0.07] hover:border-white/[0.12] transition-all space-y-3"
              >
                {/* File Row */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                    {isTransferring ? (
                      <DownloadCloud className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-semibold text-slate-200 truncate font-mono"
                      title={task.name}
                    >
                      {task.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {task.source || "Cloud Stream"}
                      </span>
                      <span className="text-[10px] text-slate-700">•</span>
                      <span className="text-[10px] text-emerald-400/90 font-mono flex items-center gap-1">
                        <HardDrive className="w-2.5 h-2.5" />
                        Google Drive: RunSync-Storage
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status, Speed & Action Controls Row */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 pt-2.5 border-t border-white/[0.05]">
                  {/* Status Badge */}
                  <div className="shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-medium font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1.5",
                        isComplete
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : isTransferring
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                          : "bg-purple-500/10 text-purple-300 border border-purple-500/25"
                      )}
                    >
                      {isComplete ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Committed to Drive</span>
                        </>
                      ) : isTransferring ? (
                        <>
                          <Zap className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
                          <span>Drive Sync</span>
                        </>
                      ) : (
                        <>
                          <DownloadCloud className="w-3 h-3 text-purple-400 animate-pulse shrink-0" />
                          <span>Streaming</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Speed, ETA & Controls */}
                  <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 ml-auto">
                    {/* Speed indicator */}
                    <div className="text-right font-mono leading-tight">
                      <div className="text-xs font-semibold text-slate-200 tabular-nums">
                        {task.speed || "0.00 MB/s"}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        <span>ETA {task.eta || "-"}</span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-1.5 pl-2.5 border-l border-white/[0.08]">
                      {/* Disabled Pause Button with disclaimer */}
                      <button
                        type="button"
                        disabled
                        title="Pause/resume is unsupported by the current worker engine"
                        className="w-7 h-7 rounded-lg bg-[#0c111e] border border-white/[0.08] flex items-center justify-center text-slate-600 cursor-not-allowed opacity-40"
                        aria-label="Pause (unsupported)"
                      >
                        <Pause className="w-3 h-3 fill-current" />
                      </button>

                      {/* Cancel Button with Confirmation Prompt */}
                      {isConfirming ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleConfirmCancel(task.id)}
                            className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-semibold hover:bg-rose-500 transition-colors"
                          >
                            Confirm Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmCancelId(null)}
                            className="px-1.5 py-1 rounded bg-[#172036] text-slate-300 text-[10px] hover:text-white"
                          >
                            Back
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmCancelId(task.id)}
                          disabled={isCancelling}
                          title="Cancel stream operation"
                          className="w-7 h-7 rounded-lg bg-[#0c111e] border border-white/[0.08] hover:border-rose-500/40 hover:bg-rose-500/15 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                          aria-label="Cancel task"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar row */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Stream Progress</span>
                    <span className="text-indigo-400 font-semibold tabular-nums">
                      {safeProgress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0c111e] rounded-full overflow-hidden border border-white/[0.06]">
                    <div
                      className={cn(
                        "h-full transition-all duration-300 rounded-full",
                        isTransferring
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                          : "bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                      )}
                      style={{ width: `${safeProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
