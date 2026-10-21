"use client";

import React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="h-14 border-b border-white/[0.07] bg-[#070a12]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Brand icon / subtle breadcrumb */}
      <Link href="/" className="flex items-center gap-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
          <Zap className="w-3.5 h-3.5 fill-current" />
        </div>
        <span className="font-mono text-slate-400">RunSync</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200">Cloud Pipeline</span>
      </Link>

      {/* User profile avatar on the right */}
      <div className="flex items-center gap-3">
        <div
          title="Operator — RunSync"
          className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-[11px] font-bold font-mono shadow-md shadow-indigo-500/20 cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all"
        >
          S
        </div>
      </div>
    </header>
  );
};
