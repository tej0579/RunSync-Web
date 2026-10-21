"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HardDrive,
  Zap,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("Saiteja");

  // Read current authenticated user details
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      if (user.displayName) setUserName(user.displayName);
      if (user.email) setUserEmail(user.email);
    }
  }, []);

  // Close drawer automatically on route navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
      badge: "Live",
    },
    {
      name: "Storage",
      href: "/storage",
      icon: HardDrive,
      active: pathname.startsWith("/storage"),
      badge: "5 TB",
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="space-y-1.5" aria-label="Main Navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all select-none group",
              item.active
                ? "bg-gradient-to-r from-indigo-600/30 to-indigo-500/10 text-white border border-indigo-500/40 shadow-[0_0_15px_-3px_rgba(99,102,241,0.25)] font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors",
                  item.active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span
                className={cn(
                  "text-[9px] font-mono px-1.5 py-0.5 rounded-md",
                  item.active
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "bg-[#070b14] text-slate-500 border border-white/[0.05]"
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const renderUserProfile = () => (
    <div className="p-3 rounded-2xl bg-[#080c16] border border-white/[0.06] flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white flex items-center justify-center text-xs font-bold font-mono shadow-sm shrink-0">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-slate-200 truncate leading-tight">
            {userName}
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate leading-tight mt-0.5" title={userEmail}>
            {userEmail || "Operator"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
        title="Sign out session"
        aria-label="Sign out"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <>
      {/* ================================================================= */}
      {/* MOBILE TOP BAR                                                    */}
      {/* ================================================================= */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#070a12]/90 backdrop-blur-md border-b border-white/[0.07] shrink-0 z-40 sticky top-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white font-sans">
            RunSync
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
            2.0
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-2 rounded-xl bg-[#0c111e] border border-white/[0.08] text-slate-300 hover:text-white transition-colors"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </header>

      {/* ================================================================= */}
      {/* MOBILE SLIDE-OVER DRAWER OVERLAY                                  */}
      {/* ================================================================= */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-72 bg-[#070b14] border-r border-white/[0.08] z-50 flex flex-col justify-between md:hidden shadow-2xl transition-transform duration-200 ease-in-out p-4",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 pt-1">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                <Zap className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-white">
                RunSync 2.0
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05]"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {renderNavLinks(() => setIsOpen(false))}
        </div>

        <div className="pt-4 border-t border-white/[0.06]">
          {renderUserProfile()}
        </div>
      </aside>

      {/* ================================================================= */}
      {/* DESKTOP PERMANENT SIDEBAR                                         */}
      {/* ================================================================= */}
      <aside
        className={cn(
          "hidden md:flex w-60 lg:w-64 bg-[#070a12]/95 backdrop-blur-md border-r border-white/[0.07] flex-col justify-between shrink-0 select-none h-screen sticky top-0 z-30 p-4",
          className
        )}
      >
        {/* Top: Logo & Navigation */}
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2.5 px-2 py-1.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white font-sans">
                RunSync
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
                2.0
              </span>
            </div>
          </Link>

          {renderNavLinks()}
        </div>

        {/* Bottom: User Profile Info & Sign Out */}
        <div className="pt-4 border-t border-white/[0.06]">
          {renderUserProfile()}
        </div>
      </aside>
    </>
  );
};
