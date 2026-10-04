import React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  indicatorColor?: string;
  height?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  indicatorColor,
  height = "h-1.5",
  className,
  ...props
}) => {
  const clampedValue = Math.min(Math.max(Number(value) || 0, 0), 100);

  return (
    <div
      className={cn(
        "w-full bg-[#070B14] rounded-full overflow-hidden border border-[#1A263D]",
        height,
        className
      )}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300 ease-out",
          indicatorColor ||
            "bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
        )}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};