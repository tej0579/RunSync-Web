import React from "react";
import { cn } from "@/lib/utils";

export type SparklineType = "line" | "bars";
export type SparklineColor = "blue" | "emerald" | "purple" | "amber";

interface SparklineProps {
  type?: SparklineType;
  color?: SparklineColor;
  data?: number[];
  className?: string;
  width?: number;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  type = "line",
  color = "blue",
  data = [12, 18, 14, 25, 20, 28, 22, 34, 30],
  className,
  width = 96,
  height = 36,
}) => {
  const colorMap = {
    blue: {
      stroke: "#38BDF8",
      fill: "#0284C7",
      bar: "fill-blue-500",
      glow: "drop-shadow(0 0 4px rgba(56,189,248,0.5))",
    },
    emerald: {
      stroke: "#34D399",
      fill: "#059669",
      bar: "fill-emerald-500",
      glow: "drop-shadow(0 0 4px rgba(52,211,153,0.5))",
    },
    purple: {
      stroke: "#C084FC",
      fill: "#7E22CE",
      bar: "fill-purple-500",
      glow: "drop-shadow(0 0 4px rgba(192,132,252,0.5))",
    },
    amber: {
      stroke: "#FBBF24",
      fill: "#D97706",
      bar: "fill-amber-500",
      glow: "drop-shadow(0 0 4px rgba(251,191,36,0.5))",
    },
  };

  const selectedColor = colorMap[color];
  const safeData = data.length > 0 ? data : [0];

  // Renders vertical micro-bars (Completed & Extracted KPIs)
  if (type === "bars") {
    const maxVal = Math.max(...safeData, 1);
    const barWidth = 4;
    const gap = 4;
    const totalBars = safeData.length;
    const svgWidth = totalBars * (barWidth + gap);

    return (
      <svg
        width={svgWidth}
        height={height}
        viewBox={`0 0 ${svgWidth} ${height}`}
        className={cn("overflow-visible", className)}
      >
        {safeData.map((val, index) => {
          const barHeight = Math.max((val / maxVal) * (height - 6), 3);
          const x = index * (barWidth + gap);
          const y = height - barHeight;
          const opacity = 0.4 + (index / totalBars) * 0.6;

          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={2}
              className={selectedColor.bar}
              style={{ opacity }}
            />
          );
        })}
      </svg>
    );
  }

  // Renders smooth SVG wave curves (Active Transfers & Speed KPIs)
  const min = Math.min(...safeData);
  const max = Math.max(...safeData);
  const range = max - min || 1;
  const padding = 4;
  const usableHeight = height - padding * 2;

  // Safe point normalization (prevents divide-by-zero on single-item data)
  const safeDivisor = Math.max(safeData.length - 1, 1);

  const points = safeData.map((val, i) => {
    const x = (i / safeDivisor) * (width - 8) + 4;
    const y = height - padding - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  if (points.length === 1) {
    pathD += ` L ${width - 4} ${points[0].y}`;
  } else {
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX = (curr.x + next.x) / 2;
      pathD += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
    >
      <path
        d={pathD}
        fill="none"
        stroke={selectedColor.stroke}
        strokeWidth={2.2}
        strokeLinecap="round"
        style={{ filter: selectedColor.glow }}
      />
    </svg>
  );
};