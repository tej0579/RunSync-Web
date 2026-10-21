"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, HardDrive, Database, Shield } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const DEFAULT_CAPACITY_BYTES = 5 * 1024 * 1024 * 1024 * 1024; // 5 TB

interface StorageCardProps {
  storage?: {
    usedBytes?: number;
    totalBytes?: number;
  };
}

export const StorageCard: React.FC<StorageCardProps> = ({ storage }) => {
  const usedBytes = storage?.usedBytes || 0;
  const totalLimit = storage?.totalBytes || DEFAULT_CAPACITY_BYTES;

  const usedPercentage = Math.min(
    parseFloat(((usedBytes / totalLimit) * 100).toFixed(1)),
    100
  );
  const remainingBytes = Math.max(totalLimit - usedBytes, 0);

  return (
    <div className="p-4 sm:p-5 md:p-6 rounded-2xl bg-[#0c111e] border border-white/[0.08] shadow-sm space-y-4 flex flex-col justify-between group hover:border-white/[0.12] transition-all">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            Drive Vault Storage
          </span>
          <Link
            href="/storage"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            title="Open Storage File Explorer"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex items-baseline justify-between mt-2.5">
          <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-sans tabular-nums">
            {formatBytes(usedBytes)}{" "}
            <span className="text-xs sm:text-sm font-normal text-slate-400 font-mono">/ 5 TB</span>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400 tabular-nums">
            {usedPercentage}%
          </span>
        </div>

        <div className="mt-3.5">
          <Progress
            value={usedPercentage}
            height="h-2"
            indicatorColor="bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
          />
        </div>
      </div>

      <div className="space-y-2.5 pt-3.5 border-t border-white/[0.05] text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            Extracted Files
          </span>
          <span className="font-mono text-slate-200 tabular-nums">{formatBytes(usedBytes)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            Remaining Allocation
          </span>
          <span className="font-mono text-emerald-400 tabular-nums">
            {formatBytes(remainingBytes)}
          </span>
        </div>
      </div>
    </div>
  );
};
