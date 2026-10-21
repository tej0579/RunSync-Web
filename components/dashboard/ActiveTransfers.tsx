"use client";

import React from "react";
import {
  FileText,
  Pause,
  Play,
  X,
  HardDrive,
  DownloadCloud,
  CheckCircle2,
  Clock,
  Zap,
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
  onPause,
  onResume,
  onCancel,
}) => {
  return (
    <div className="p-4 sm:p-5 md:p-6 rounded-2xl bg-[#0D1424] border border-[#1A263D] shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-white tracking-wide whitespace-nowrap">
            Active Transfers
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono">
          {tasks.length > 0 ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="hidden sm:inline">Real-time streaming pipeline</span>
              <span className="sm:hidden font-medium">Live Stream</span>
            </span>
          ) : (
            <span className="text-slate-500">Idle</span>
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        /* Empty State */
        <div className="py-10 px-4 rounded-xl border border-dashed border-[#1A263D] bg-[#070B14]/40 flex flex-col items-center justify-center text-center">
          <HardDrive className="w-8 h-8 text-slate-600 mb-2.5 animate-pulse" />
          <p className="text-xs font-medium text-slate-300">
            No active stream jobs running
          </p>
          <p className="text-[11px] text-slate-500 max-w-sm mt-1 leading-relaxed">
            Submit a Hugging Face repo or torrent magnet link above to stream files directly into Google Drive.
          </p>
        </div>
      ) : (
        /* Active Task List */
        <div className="space-y-3">
          {tasks.map((task) => {
            const rawProgress = Number(task.progress || 0);
            const safeProgress = isNaN(rawProgress) ? 0 : Math.min(Math.max(rawProgress, 0), 100);
            const isTransferring = task.status === "transferring";
            const isComplete = safeProgress >= 100;

            return (
              <div
                key={task.id}
                className="p-3.5 sm:p-4 rounded-xl bg-[#070B14] border border-[#1A263D] hover:border-slate-700/80 transition-all space-y-3"
              >
                {/* File Row */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    {isTransferring ? (
                      <DownloadCloud className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-medium text-slate-200 truncate font-mono"
                      title={task.name}
                    >
                      {task.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {task.source || "Cloud Stream"}
                      </span>
                      <span className="text-[10px] text-slate-600">•</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Direct Pipe
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status, Speed & Action Controls Row */}
                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#151D2E]/80">
                  {/* Status Badge */}
                  <div className="shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-medium font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1.5",
                        isComplete
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : isTransferring
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-purple-500/10 text-purple-300 border border-purple-500/30"
                      )}
                    >
                      {isComplete ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Committed</span>
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
                  <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
                    {/* Speed indicator */}
                    <div className="text-right font-mono leading-tight">
                      <div className="text-xs font-semibold text-slate-200">
                        {task.speed || "0.00 MB/s"}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        <span>ETA {task.eta || "-"}</span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-1.5 pl-2.5 border-l border-[#1A263D]">
                      <button
                        type="button"
                        onClick={() =>
                          task.status === "downloading"
                            ? onPause(task.id)
                            : onResume(task.id)
                        }
                        title={task.status === "downloading" ? "Pause task" : "Resume task"}
                        className="w-7 h-7 rounded-lg bg-[#0D1424] border border-[#1E2C48] hover:border-blue-500/50 hover:bg-[#111A30] flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 shadow-sm"
                        aria-label={task.status === "downloading" ? "Pause task" : "Resume task"}
                      >
                        {task.status === "downloading" ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onCancel(task.id)}
                        title="Cancel task"
                        className="w-7 h-7 rounded-lg bg-[#0D1424] border border-[#1E2C48] hover:border-rose-500/50 hover:bg-rose-500/15 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-all active:scale-95 shadow-sm"
                        aria-label="Cancel task"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress bar row */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-blue-400 font-semibold">
                      {safeProgress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0D1424] rounded-full overflow-hidden border border-[#1A263D]">
                    <div
                      className={cn(
                        "h-full transition-all duration-300 rounded-full",
                        isTransferring
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : "bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400"
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
