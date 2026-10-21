"use client";

import React from "react";
import { Send, CheckCircle2, Download, Zap } from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";
import { KpiMetrics } from "@/types/telemetry";
import { cn, formatBytes } from "@/lib/utils";

interface MetricsRowProps {
  metrics?: Partial<KpiMetrics>;
  liveExtractedBytes?: number;
  liveBytesToday?: number;
}

const defaultFlatSparkline = [0, 0, 0, 0, 0, 0, 0];

export const MetricsRow: React.FC<MetricsRowProps> = ({
  metrics,
  liveExtractedBytes,
  liveBytesToday,
}) => {
  const calculatedDataExtracted =
    typeof liveExtractedBytes === "number" && liveExtractedBytes > 0
      ? formatBytes(liveExtractedBytes)
      : String(metrics?.dataExtracted?.value ?? "0 B");

  const dynamicTodayTrend =
    typeof liveBytesToday === "number" && liveBytesToday > 0
      ? `+${formatBytes(liveBytesToday)} today`
      : "+0 B today";

  let displaySpeed = String(metrics?.avgSpeed?.value ?? "0.00 MB/s");
  if (
    displaySpeed.toLowerCase().includes("finish") ||
    displaySpeed.toLowerCase().includes("idle") ||
    displaySpeed.toLowerCase().includes("offline")
  ) {
    displaySpeed = "0.00 MB/s";
  }

  const defaultMetrics: KpiMetrics = {
    activeTransfers: {
      value: metrics?.activeTransfers?.value ?? 0,
      trend: metrics?.activeTransfers?.trend ?? "idle",
      isPositive: Number(metrics?.activeTransfers?.value ?? 0) > 0,
    },
    completed: {
      value: metrics?.completed?.value ?? 0,
      trend: metrics?.completed?.trend ?? "0 this week",
      isPositive: Number(metrics?.completed?.value ?? 0) > 0,
    },
    dataExtracted: {
      value: calculatedDataExtracted,
      trend: dynamicTodayTrend,
      isPositive: (liveBytesToday ?? 0) > 0,
    },
    avgSpeed: {
      value: displaySpeed,
      trend: metrics?.avgSpeed?.trend ?? "0.00 MB/s",
      isPositive: Number(displaySpeed.replace(/[^0-9.]/g, "")) > 0,
    },
  };

  const cards = [
    {
      id: "active",
      title: "Active Transfers",
      value: defaultMetrics.activeTransfers.value,
      trend: defaultMetrics.activeTransfers.trend,
      isPositive: defaultMetrics.activeTransfers.isPositive,
      icon: Send,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10 border-blue-500/25",
      sparklineType: "line" as const,
      sparklineColor: "blue" as const,
      sparklineData: Number(defaultMetrics.activeTransfers.value) > 0 ? [0, 1, 1, 1, 2, 1, 1] : defaultFlatSparkline,
    },
    {
      id: "completed",
      title: "Completed",
      value: defaultMetrics.completed.value,
      trend: defaultMetrics.completed.trend,
      isPositive: defaultMetrics.completed.isPositive,
      icon: CheckCircle2,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10 border-emerald-500/25",
      sparklineType: "bars" as const,
      sparklineColor: "emerald" as const,
      sparklineData: Number(defaultMetrics.completed.value) > 0 ? [1, 2, 3, 4, 5, 5, 6] : defaultFlatSparkline,
    },
    {
      id: "extracted",
      title: "Data Extracted",
      value: defaultMetrics.dataExtracted.value,
      trend: defaultMetrics.dataExtracted.trend,
      isPositive: defaultMetrics.dataExtracted.isPositive,
      icon: Download,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/10 border-purple-500/25",
      sparklineType: "line" as const,
      sparklineColor: "purple" as const,
      sparklineData: (liveExtractedBytes ?? 0) > 0 ? [10, 20, 35, 50, 70, 85, 100] : defaultFlatSparkline,
    },
    {
      id: "speed",
      title: "Avg Speed",
      value: defaultMetrics.avgSpeed.value,
      trend: defaultMetrics.avgSpeed.trend,
      isPositive: defaultMetrics.avgSpeed.isPositive,
      icon: Zap,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10 border-amber-500/25",
      sparklineType: "line" as const,
      sparklineColor: "amber" as const,
      sparklineData: defaultMetrics.avgSpeed.isPositive ? [5, 15, 25, 40, 50, 35, 45] : defaultFlatSparkline,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 select-none">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[#0D1424] border border-[#1A263D] shadow-xl hover:border-slate-700/70 transition-all flex flex-col justify-between"
          >
            {/* Top row: Title + Icon */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">
                {card.title}
              </span>
              <div
                className={cn(
                  "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border shrink-0",
                  card.iconBg
                )}
              >
                <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", card.iconColor)} />
              </div>
            </div>

            {/* Middle row: Big Metric Value */}
            <div className="mt-2.5 sm:mt-3">
              <div className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white font-sans tracking-tight truncate">
                {card.value}
              </div>
            </div>

            {/* Bottom row: Trend subtitle + Sparkline */}
            <div className="flex items-end justify-between gap-1 mt-2.5 sm:mt-3 pt-2.5 border-t border-[#151D2E]/80">
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono truncate">
                <span
                  className={cn(
                    "font-medium",
                    card.isPositive ? "text-emerald-400" : "text-slate-500"
                  )}
                >
                  {card.trend}
                </span>
              </div>

              <div className="w-14 sm:w-16 h-5 shrink-0 opacity-80">
                <Sparkline
                  data={card.sparklineData}
                  type={card.sparklineType}
                  color={card.sparklineColor}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
