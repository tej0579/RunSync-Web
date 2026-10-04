"use client";

import React, { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import { SpeedDataPoint } from "@/types/telemetry";
import { formatBytes } from "@/lib/utils";

interface AnalyticsGridProps {
  speedHistory?: SpeedDataPoint[];
  currentSpeed?: string;
  bytes24h?: number;
}

export const AnalyticsGrid: React.FC<AnalyticsGridProps> = ({
  speedHistory = [],
  currentSpeed = "0.00 MB/s",
  bytes24h = 0,
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

  const hourlyBars = [
    { hour: "00:00", dl: 2.1, ul: 0.8 },
    { hour: "02:00", dl: 1.4, ul: 0.4 },
    { hour: "04:00", dl: 3.8, ul: 1.2 },
    { hour: "06:00", dl: 6.2, ul: 2.8 },
    { hour: "08:00", dl: 8.5, ul: 3.1 },
    { hour: "10:00", dl: 12.4, ul: 4.5 },
    { hour: "12:00", dl: 15.2, ul: 5.2 },
    { hour: "14:00", dl: 11.8, ul: 3.9 },
    { hour: "16:00", dl: 9.3, ul: 2.7 },
    { hour: "18:00", dl: 7.1, ul: 1.9 },
    { hour: "20:00", dl: 4.8, ul: 1.1 },
    { hour: "22:00", dl: 2.9, ul: 0.9 },
  ];

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

          <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[9px] font-mono text-slate-600 pointer-events-none pr-1">
            <span>peak</span>
            <span>avg</span>
            <span>0</span>
          </div>
        </div>
      </div>

      {/* Card 2: Data Transfer 24h Breakdown */}
      <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-[#0D1424] border border-[#1A263D] shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-400">Data Transfer (24h)</span>
            <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-mono">
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

        <div className="w-full mt-3 sm:mt-4 flex items-end justify-between gap-1 h-16 sm:h-20 pt-2 border-b border-[#1A263D]/60 pb-1">
          {hourlyBars.map((bar, idx) => {
            const dlHeight = (bar.dl / 16) * 100;
            const ulHeight = (bar.ul / 16) * 100;

            return (
              <div
                key={idx}
                className="flex-1 flex items-end justify-center gap-0.5 h-full group relative"
              >
                <div
                  className="w-1 bg-sky-400/80 rounded-t group-hover:bg-sky-300 transition-all"
                  style={{ height: `${dlHeight}%` }}
                />
                <div
                  className="w-1 bg-blue-600/80 rounded-t group-hover:bg-blue-500 transition-all"
                  style={{ height: `${ulHeight}%` }}
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-slate-500 mt-1">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>22:00</span>
        </div>
      </div>
    </>
  );
};