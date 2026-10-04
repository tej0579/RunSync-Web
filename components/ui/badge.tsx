import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowRightLeft, CheckCircle2, AlertCircle, Pause } from "lucide-react";

export type BadgeVariant =
  | "downloading"
  | "transferring"
  | "completed"
  | "failed"
  | "paused"
  | "default"
  | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  children,
  icon = true,
  className,
  ...props
}) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case "downloading":
        return "bg-purple-950/70 text-purple-300 border border-purple-700/60 shadow-[0_0_12px_-3px_rgba(168,85,247,0.3)]";
      case "transferring":
        return "bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 shadow-[0_0_12px_-3px_rgba(16,185,129,0.3)]";
      case "completed":
        return "bg-emerald-950/50 text-emerald-400 border border-emerald-800/40";
      case "failed":
        return "bg-rose-950/70 text-rose-400 border border-rose-800/60";
      case "paused":
        return "bg-amber-950/70 text-amber-300 border border-amber-800/60";
      case "outline":
        return "bg-[#070B14] text-slate-300 border border-[#1A263D]";
      default:
        return "bg-[#0D1424] text-slate-200 border border-[#1A263D]";
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    const iconClass = "w-3 h-3 mr-1.5 shrink-0";
    switch (variant) {
      case "downloading":
        return <Sparkles className={iconClass} />;
      case "transferring":
        return <ArrowRightLeft className={iconClass} />;
      case "completed":
        return <CheckCircle2 className={iconClass} />;
      case "failed":
        return <AlertCircle className={iconClass} />;
      case "paused":
        return <Pause className={iconClass} />;
      default:
        return null;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors font-mono",
        getBadgeStyle(),
        className
      )}
      {...props}
    >
      {renderIcon()}
      {children}
    </span>
  );
};