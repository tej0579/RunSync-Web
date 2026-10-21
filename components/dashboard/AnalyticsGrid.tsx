"use client";

import React, { useMemo } from "react";
import { ArrowUpRight, Activity, BarChart2 } from "lucide-react";
import { SpeedDataPoint } from "@/types/telemetry";
import { formatBytes } from "@/lib/utils";

interface AnalyticsGridProps {
  speedHistory?: SpeedDataPoint[];
  currentSpeed?: string;
  bytes24h?: number;
  hourlyData?: Record<string, number>;
}

export const AnalyticsGrid: React.FC<AnalyticsGridProps> = ({
  speedHistory = [],
  currentSpeed = "0.00 MB/s",
  bytes24h = 0,
  hourlyData,
}) => {
  const chartPoints = useMemo(() => {
    const width = 300;
    const height = 90;
    const padding = 6;

    if (!speedHistory || speedHistory.length === 0) {
      return {
        path: `M 0 ${height - padding} L ${width} ${height - padding}`,
        area: `M 0 ${height - padding} L ${width} ${height - padding} L ${width} ${height} L 0 ${height} Z`,
      };
    }

    const maxSpeed = Math.max(
      ...speedHistory.map((d) => Number(d.speed) || 0),
      50
    );

    const safePoints =
      speedHistory.length === 1
        ? [speedHistory[0], speedHistory[0]]
        : speedHistory;

    const stepX = width / Math.max(safePoints.length - 1, 1);

    const coords = safePoints.map((d, index) => {
      const speedVal = Number(d.speed) || 0;
      const x = index * stepX;
      const normalizedY = (speedVal / maxSpeed) * (height - padding * 2);
      const y = height - padding - normalizedY;
      return { x, y };
    });

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const midX = (prev.x + curr.x) / 2;
      d += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const areaD = `${d} L ${width} ${height} L 0 ${height} Z`;

    return { path: d, area: areaD };
  }, [speedHistory]);

  const hourlyBars = useMemo(() => {
    const slots = ["00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22"];
    return slots.map((hour) => {
      const nextHour = String(Number(hour) + 1).padStart(2, "0");
      const bytes1 = hourlyData?.[hour] || 0;
      const bytes2 = hourlyData?.[nextHour] || 0;
      const slotBytes = bytes1 + bytes2;
      const slotGb = slotBytes / (1024 * 1024 * 1024);
      return {
        hour: `${hour}:00`,
        dl: Number(slotGb.toFixed(2)),
        ul: Number((slotGb * 0.1).toFixed(2)),
      };
    });
  }, [hourlyData]);

  const maxBar = useMemo(() => {
    return Math.max(...hourlyBars.map((b) => b.dl), 0.5);
  }, [hourlyBars]);

  const display24hString = bytes24h > 0 ? formatBytes(bytes24h) : "0 B";

  return (
    <>
      {/* Card 1: Live Transfer Speed Wave Curve */}
      <div className="p-4 sm:p-5 md:p-6 rounded-2xl bg-white dark:bg-[#0c111e] border border-slate-200 dark:border-white/[0.08] shadow-xs flex flex-col justify-between group hover:border-slate-300 dark:hover:border-white/[0.12] transition-all">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Throughput Curve
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Realtime Stream</span>
          </div>

          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight tabular-nums">
              {currentSpeed.includes("MB/s") ? currentSpeed : `${currentSpeed} MB/s`}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Current telemetry throughput
            </div>
          </div>
        </div>

        <div className="w-full h-20 sm:h-24 mt-4 relative overflow-hidden rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-white/[0.05] p-1.5">
          <svg
            viewBox="0 0 300 90"
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <linearGradient id="speedGlowCosmic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {chartPoints.area && (
              <path d={chartPoints.area} fill="url(#speedGlowCosmic)" />
            )}

            {chartPoints.path && (
              <path
                d={chartPoints.path}
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="dark:stroke-[#38bdf8]"
              />
            )}
          </svg>

          <div className="absolute right-2 top-1 bottom-1 flex flex-col justify-between text-[8px] font-mono text-slate-400 pointer-events-none pr-1">
            <span>PEAK</span>
            <span>AVG</span>
            <span>0</span>
          </div>
        </div>
      </div>

      {/* Card 2: 24h Data Transfer Historical Graph */}
      <div className="p-4 sm:p-5 md:p-6 rounded-2xl bg-white dark:bg-[#0c111e] border border-slate-200 dark:border-white/[0.08] shadow-xs flex flex-col justify-between group hover:border-slate-300 dark:hover:border-white/[0.12] transition-all">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Bandwidth Window (24h)
            </span>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
                DL
              </span>
              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                UL
              </span>
            </div>
          </div>

          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight tabular-nums">
              {display24hString}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Aggregated cloud bandwidth
            </div>
          </div>
        </div>

        {/* Scaled Bar Chart for 24h rolling activity */}
        <div className="mt-4 p-2 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-white/[0.05]">
          <div className="flex items-end justify-between h-16 sm:h-20 gap-1 px-1">
            {hourlyBars.map((bar, index) => {
              const heightPercent = bar.dl > 0
                ? Math.max(Math.min((bar.dl / maxBar) * 100, 100), 10)
                : 6;
              const ulHeightPercent = bar.ul > 0
                ? Math.max(Math.min((bar.ul / maxBar) * 100, 50), 6)
                : 3;

              return (
                <div
                  key={index}
                  className="flex-1 flex items-end justify-center gap-0.5 h-full group relative"
                  title={`${bar.hour}: ${bar.dl} GB`}
                >
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[6px] rounded-t-sm bg-sky-500 dark:bg-sky-400/80 group-hover:bg-sky-400 dark:group-hover:bg-sky-300 transition-all"
                  />
                  <div
                    style={{ height: `${ulHeightPercent}%` }}
                    className="w-full max-w-[4px] rounded-t-sm bg-indigo-500/70 dark:bg-indigo-500/60 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-400 transition-all"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[8px] font-mono text-slate-400 dark:text-slate-500 mt-2 px-1 border-t border-slate-200 dark:border-white/[0.04] pt-1">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>22:00</span>
          </div>
        </div>
      </div>
    </>
  );
};
