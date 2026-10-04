import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "pillActive"
    | "pillInactive"
    | "ghost"
    | "dangerCircle"
    | "iconCircle";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none";

    const variantStyles = {
      // Primary blue accent
      primary:
        "bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 active:scale-[0.98]",
      // Dark elevated panel button
      secondary:
        "bg-[#0D1424] hover:bg-[#151E33] text-slate-200 border border-[#1A263D] hover:border-slate-600 rounded-xl active:scale-[0.98]",
      // Selected pill toggle
      pillActive:
        "bg-white text-slate-900 rounded-full shadow-md font-semibold active:scale-[0.98]",
      // Inactive pill toggle
      pillInactive:
        "bg-[#070B14] hover:bg-[#0D1424] text-slate-400 hover:text-slate-200 border border-[#1A263D] rounded-full",
      // Ghost button
      ghost:
        "text-slate-400 hover:text-slate-100 hover:bg-[#0D1424] rounded-lg",
      // Red circular action button
      dangerCircle:
        "w-8 h-8 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/40 p-0 flex items-center justify-center active:scale-95",
      // Dark circular control button
      iconCircle:
        "w-8 h-8 rounded-full bg-[#0D1424] hover:bg-[#151E33] text-slate-300 border border-[#1A263D] p-0 flex items-center justify-center active:scale-95",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5",
      md: "text-sm px-4 py-2",
      lg: "text-base px-6 py-3",
      icon: "w-9 h-9 p-0",
    };

    const isCircle = variant === "dangerCircle" || variant === "iconCircle";

    return (
      <button
        ref={ref}
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