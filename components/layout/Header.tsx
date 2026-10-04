"use client";

import React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="h-14 border-b border-[#151D2E]/80 bg-[#080C14]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Brand icon / subtle breadcrumb */}
      <Link href="/" className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors">
        <Zap className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
        <span className="font-mono text-slate-400">RunSync</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200">Cloud Pipeline</span>
      </Link>

      {/* User profile avatar on the right */}
      <div className="flex items-center gap-3">
        <div
          title="Saiteja — RunSync Admin"
          className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white text-[11px] font-bold font-mono shadow-md shadow-purple-600/30 cursor-pointer hover:ring-2 hover:ring-purple-500/50 transition-all"
        >
          S
        </div>
      </div>
    </header>
  );
};