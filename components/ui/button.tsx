import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "pillActive"
    | "pillInactive"
    | "dangerCircle"
    | "iconCircle";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", children, disabled, type = "button", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[#060911] disabled:opacity-45 disabled:pointer-events-none select-none";

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-xl shadow-[0_0_20px_-3px_rgba(99,102,241,0.35)] active:scale-[0.98]",
      secondary:
        "bg-[#0c111e] hover:bg-[#121828] text-slate-200 border border-white/[0.08] hover:border-white/[0.14] rounded-xl active:scale-[0.98] shadow-sm",
      outline:
        "bg-transparent hover:bg-white/[0.04] text-slate-300 border border-white/[0.12] hover:border-white/[0.2] rounded-xl active:scale-[0.98]",
      ghost:
        "text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] rounded-lg",
      danger:
        "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl active:scale-[0.98]",
      pillActive:
        "bg-white text-slate-950 font-semibold rounded-full shadow-sm active:scale-[0.98]",
      pillInactive:
        "bg-[#080c16] hover:bg-[#0e1424] text-slate-400 hover:text-slate-200 border border-white/[0.06] rounded-full",
      dangerCircle:
        "w-8 h-8 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 p-0 flex items-center justify-center active:scale-95",
      iconCircle:
        "w-8 h-8 rounded-full bg-[#0c111e] hover:bg-[#121828] text-slate-300 border border-white/[0.08] p-0 flex items-center justify-center active:scale-95",
    };

    const sizeStyles = {
      xs: "text-[11px] px-2.5 py-1 rounded-lg gap-1",
      sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
      md: "text-xs sm:text-sm px-4 py-2 rounded-xl gap-2",
      lg: "text-sm sm:text-base px-5 py-2.5 rounded-xl gap-2.5",
      icon: "w-8 h-8 sm:w-9 sm:h-9 p-0 rounded-xl",
    };

    const isCircle = variant === "dangerCircle" || variant === "iconCircle";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          baseStyles,
          variantStyles[variant],
          !isCircle && sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
