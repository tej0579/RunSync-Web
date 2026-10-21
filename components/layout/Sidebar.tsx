"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, HardDrive, Zap, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Close drawer automatically on route navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      name: "Storage",
      href: "/storage",
      icon: HardDrive,
      active: pathname.startsWith("/storage"),
    },
  ];

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
              item.active
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#0D1424]"
            )}
          >
            <Icon className={cn("w-4 h-4", item.active ? "text-white" : "text-slate-400")} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  const renderUserProfile = () => (
    <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-[#0D1424] transition-colors cursor-pointer">
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold font-mono shadow-sm shrink-0">
        S
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-slate-200 truncate">Saiteja</span>
        <span className="text-[10px] text-slate-500 font-mono">RunSync Admin</span>
      </div>
    </div>
  );

  return (
    <>
      {/* ================================================================= */}
      {/* MOBILE TOP BAR (Visible on small screens only)                     */}
      {/* ================================================================= */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#080D1A] border-b border-[#151D2E] shrink-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">
            RunSync
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
            2.0
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-2 rounded-lg bg-[#0D1424] border border-[#1E2C48] text-slate-300 hover:text-white transition-colors"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </header>

      {/* ================================================================= */}
      {/* MOBILE SLIDE-OVER DRAWER OVERLAY                                  */}
      {/* ================================================================= */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-[#080D1A] border-r border-[#151D2E] z-50 flex flex-col justify-between md:hidden shadow-2xl transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
                <Zap className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-white">
                RunSync
              </span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {renderNavLinks(() => setIsOpen(false))}
        </div>

        <div className="p-4 border-t border-[#151D2E]">
          {renderUserProfile()}
        </div>
      </aside>

      {/* ================================================================= */}
      {/* DESKTOP PERMANENT SIDEBAR (Hidden on mobile)                       */}
      {/* ================================================================= */}
      <aside
        className={cn(
          "hidden md:flex w-64 bg-[#080D1A] border-r border-[#151D2E] flex-col justify-between shrink-0 select-none h-screen sticky top-0 z-30",
          className
        )}
      >
        {/* Top: Logo & Navigation */}
        <div className="p-4 space-y-6">
          <Link href="/" className="flex items-center gap-2.5 px-2 py-1 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                RunSync
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                2.0
              </span>
            </div>
          </Link>

          {renderNavLinks()}
        </div>

        {/* Bottom: User Profile Info */}
        <div className="p-4 border-t border-[#151D2E]">
          {renderUserProfile()}
        </div>
      </aside>
    </>
  );
};