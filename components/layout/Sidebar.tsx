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
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isConfirmingSignOut, setIsConfirmingSignOut] = useState<boolean>(false);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
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
    setIsConfirmingSignOut(false);
  }, [pathname]);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isConfirmingSignOut) {
          setIsConfirmingSignOut(false);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isConfirmingSignOut]);

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

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
      setIsSigningOut(false);
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
              "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all select-none group border",
              item.active
                ? "bg-slate-100 text-slate-900 border-slate-200 shadow-xs dark:bg-white/[0.08] dark:text-white dark:border-white/[0.1]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.04]"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors",
                  item.active
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300"
                )}
              />
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span
                className={cn(
                  "text-[9px] font-mono px-1.5 py-0.5 rounded-md border",
                  item.active
                    ? "bg-slate-200/80 text-slate-700 border-slate-300 dark:bg-white/[0.08] dark:text-slate-300 dark:border-white/[0.1]"
                    : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-[#070b14] dark:text-slate-500 dark:border-white/[0.05]"
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

  const renderUserProfile = () => {
    if (isConfirmingSignOut) {
      return (
        <div className="p-3 rounded-2xl bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 space-y-2.5 animate-in fade-in duration-150 select-none">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold leading-tight">Confirm Sign Out?</span>
          </div>
          <p className="text-[10px] text-rose-600/90 dark:text-rose-300/80 leading-relaxed">
            End active session. Background streams will continue running.
          </p>
          <div className="flex items-center justify-end gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setIsConfirmingSignOut(false)}
              disabled={isSigningOut}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 dark:text-slate-300 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:border-white/[0.08] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSignOut}
              disabled={isSigningOut}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Signing out...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-[#080c16] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white flex items-center justify-center text-xs font-bold font-mono shadow-sm shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate leading-tight">
              {userName}
            </span>
            <span
              className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate leading-tight mt-0.5"
              title={userEmail}
            >
              {userEmail || "Operator"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsConfirmingSignOut(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors shrink-0"
          title="Sign out session"
          aria-label="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <>

      {/* ================================================================= */}
      {/* MOBILE TOP BAR                                                    */}
      {/* ================================================================= */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-[#070a12]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.07] shrink-0 z-40 sticky top-0 transition-colors">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white font-sans">
            RunSync
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-semibold">
            2.0
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Button in Mobile Header */}
          <ThemeToggle variant="icon" />

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-[#0c111e] dark:hover:bg-[#141b2e] dark:border-white/[0.08] dark:text-slate-300 transition-colors"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
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
          "fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#070b14] border-r border-slate-200 dark:border-white/[0.08] z-50 flex flex-col justify-between md:hidden shadow-2xl transition-transform duration-200 ease-in-out p-4",
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
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                RunSync 2.0
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {renderNavLinks(() => setIsOpen(false))}
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06] space-y-3">
          <ThemeToggle variant="pill" />
          {renderUserProfile()}
        </div>
      </aside>

      {/* ================================================================= */}
      {/* DESKTOP PERMANENT SIDEBAR                                         */}
      {/* ================================================================= */}
      <aside
        className={cn(
          "hidden md:flex w-60 lg:w-64 bg-white/95 dark:bg-[#070a12]/95 backdrop-blur-md border-r border-slate-200 dark:border-white/[0.07] flex-col justify-between shrink-0 select-none h-screen sticky top-0 z-30 p-4 transition-colors",
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
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-sans">
                RunSync
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-semibold">
                2.0
              </span>
            </div>
          </Link>

          {renderNavLinks()}
        </div>

        {/* Bottom: Theme Switcher & User Profile Info */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06] space-y-3">
          <ThemeToggle variant="pill" />
          {renderUserProfile()}
        </div>
      </aside>
    </>
  );
};
