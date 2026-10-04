"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
    <div className="p-5 md:p-6 rounded-2xl bg-[#0D1424] border border-[#1A263D] shadow-xl space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Storage Usage</span>
          <Link
            href="/storage"
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex items-baseline justify-between mt-2">
          <div className="text-2xl md:text-3xl font-extrabold text-white font-sans">
            {formatBytes(usedBytes)}{" "}
            <span className="text-sm font-normal text-slate-400">/ 5 TB</span>
          </div>
          <span className="text-xs font-mono font-semibold text-blue-400">
            {usedPercentage}%
          </span>
        </div>

        <div className="mt-3">
          <Progress
            value={usedPercentage}
            height="h-2"
            indicatorColor="bg-gradient-to-r from-sky-400 to-blue-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
          />
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-[#151D2E] text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Extracted Files
          </span>
          <span className="font-mono text-slate-200">{formatBytes(usedBytes)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            Remaining Quota
          </span>
          <span className="font-mono text-emerald-400">
            {formatBytes(remainingBytes)}
          </span>
        </div>
      </div>
    </div>
  );
};