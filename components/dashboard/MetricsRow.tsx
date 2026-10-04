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

const activeTransfersSparkline = [0, 1, 2, 2, 3, 2, 1, 2, 1];
const completedSparkline = [110, 114, 118, 120, 122, 125, 128];
const dataExtractedSparkline = [40, 65, 80, 95, 120, 145, 156];
const avgSpeedSparkline = [0, 25, 60, 45, 90, 140, 186];

export const MetricsRow: React.FC<MetricsRowProps> = ({
  metrics,
  liveExtractedBytes,
  liveBytesToday,
}) => {
  const calculatedDataExtracted =
    typeof liveExtractedBytes === "number" && liveExtractedBytes > 0
      ? formatBytes(liveExtractedBytes)
      : metrics?.dataExtracted?.value ?? "156.9 GB";

  const dynamicTodayTrend =
    typeof liveBytesToday === "number"
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
      value: metrics?.completed?.value ?? 135,
      trend: metrics?.completed?.trend ?? "+12 this week",
      isPositive: true,
    },
    dataExtracted: {
      value: calculatedDataExtracted,
      trend: dynamicTodayTrend,
      isPositive: true,
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
      sparklineData: activeTransfersSparkline,
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
      sparklineData: completedSparkline,
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
      sparklineType: "bars" as const,
      sparklineColor: "purple" as const,
      sparklineData: dataExtractedSparkline,
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
      sparklineData: avgSpeedSparkline,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isTrendActive = card.isPositive && !String(card.trend).toLowerCase().includes("idle");

        return (
          <div
            key={card.id}
            className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[#0D1424]/90 border border-[#1A263D] hover:border-slate-600/60 shadow-lg shadow-black/40 flex flex-col justify-between transition-all duration-200 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={cn(
                  "w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border",
                  card.iconBg,
                  card.iconColor
                )}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-300 truncate select-none">
                {card.title}
              </span>
            </div>

            <div className="flex items-end justify-between mt-3 sm:mt-4">
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-extrabold text-white tracking-tight font-sans truncate">
                  {card.value}
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] font-medium font-mono truncate",
                    isTrendActive ? "text-emerald-400" : "text-slate-500"
                  )}
                >
                  {isTrendActive && <span>▲</span>}
                  <span className="truncate">{card.trend}</span>
                </div>
              </div>

              {/* Sparkline visible on desktop/tablet, hidden on compact mobile viewports */}
              <div className="hidden sm:block shrink-0 mb-1">
                <Sparkline
                  type={card.sparklineType}
                  color={card.sparklineColor}
                  data={card.sparklineData}
                  width={90}
                  height={32}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};