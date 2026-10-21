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
  | "outline"
  | "cyan";

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
        return "bg-purple-500/10 text-purple-300 border border-purple-500/30 shadow-[0_0_12px_-3px_rgba(168,85,247,0.25)]";
      case "transferring":
        return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_-3px_rgba(16,185,129,0.25)]";
      case "completed":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "failed":
        return "bg-rose-500/10 text-rose-300 border border-rose-500/30";
      case "paused":
        return "bg-amber-500/10 text-amber-300 border border-amber-500/30";
      case "cyan":
        return "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_-3px_rgba(6,182,212,0.25)]";
      case "outline":
        return "bg-[#080c16] text-slate-300 border border-white/[0.08]";
      default:
        return "bg-[#0c111e] text-slate-300 border border-white/[0.08]";
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
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors font-mono tracking-tight",
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
