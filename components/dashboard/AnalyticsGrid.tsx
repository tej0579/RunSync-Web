"use client";

import React, { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
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
    const padding = 5;

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
      <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-[#0D1424] border border-[#1A263D] shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Transfer Speed</span>
            <ArrowUpRight className="w-4 h-4 text-slate-500" />
          </div>

          <div className="mt-2">
            <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-sans tracking-tight">
              {currentSpeed.includes("MB/s") ? currentSpeed : `${currentSpeed} MB/s`}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono mt-0.5">
              Current throughput
            </div>
          </div>
        </div>

        <div className="w-full h-20 sm:h-24 mt-3 sm:mt-4 relative overflow-hidden">
          <svg
            viewBox="0 0 300 90"
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <linearGradient id="speedGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {chartPoints.area && (
              <path d={chartPoints.area} fill="url(#speedGlow)" />
            )}

            {chartPoints.path && (
              <path
                d={chartPoints.path}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>

          <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[9px] font-mono text-slate-500 pointer-events-none pr-1">
            <span>peak</span>
            <span>avg</span>
            <span>0</span>
          </div>
        </div>
      </div>

      {/* Card 2: 24h Data Transfer Historical Graph */}
      <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-[#0D1424] border border-[#1A263D] shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Data Transfer (24h)</span>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                DL
              </span>
              <span className="flex items-center gap-1 text-blue-500">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                UL
              </span>
            </div>
          </div>

          <div className="mt-2">
            <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-sans tracking-tight">
              {display24hString}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono mt-0.5">
              Aggregated cloud bandwidth
            </div>
          </div>
        </div>

        {/* Scaled Bar Chart for 24h rolling activity */}
        <div className="mt-4">
          <div className="flex items-end justify-between h-20 sm:h-24 gap-1 px-1">
            {hourlyBars.map((bar, index) => {
              const heightPercent = bar.dl > 0
                ? Math.max(Math.min((bar.dl / maxBar) * 100, 100), 8)
                : 4;
              const ulHeightPercent = bar.ul > 0
                ? Math.max(Math.min((bar.ul / maxBar) * 100, 50), 4)
                : 2;

              return (
                <div
                  key={index}
                  className="flex-1 flex items-end justify-center gap-0.5 h-full group relative"
                  title={`${bar.hour}: ${bar.dl} GB`}
                >
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[6px] rounded-t-sm bg-sky-400/80 group-hover:bg-sky-300 transition-all"
                  />
                  <div
                    style={{ height: `${ulHeightPercent}%` }}
                    className="w-full max-w-[4px] rounded-t-sm bg-blue-600/60 group-hover:bg-blue-500 transition-all"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-2 px-1 border-t border-[#151D2E]/80 pt-1.5">
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
