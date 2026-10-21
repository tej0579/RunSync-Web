"use client";

import React, { useState, useEffect } from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { ShieldAlert, Loader2, Zap, AlertCircle, ArrowRight, ShieldCheck, HardDrive, Cpu, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 5c1.54 0 2.93.53 4.02 1.57l3.01-3.01C17.21 1.83 14.79 1 12 1 7.42 1 3.53 3.61 1.63 7.41l3.68 2.85C6.19 7.37 8.87 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.68 2.85c2.14-1.98 3.74-4.89 3.74-8.67z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.74c-.24-.72-.38-1.49-.38-2.28 0-.79.14-1.56.38-2.28L1.63 7.33C.59 9.4 0 11.64 0 14c0 2.36.59 4.6 1.63 6.67l3.68-2.93z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.68-2.85c-1.08.72-2.45 1.16-4.25 1.16-3.13 0-5.81-2.37-6.69-5.26L1.63 16.07C3.53 19.87 7.42 22.5 12 22.5z"
      />
    </svg>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const allowedEmails = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email) {
        const email = currentUser.email.toLowerCase();
        if (allowedEmails.length === 0 || allowedEmails.includes(email)) {
          setUser(currentUser);
          setAccessDenied(null);
          setAuthError(null);
        } else {
          signOut(auth);
          setUser(null);
          setAccessDenied(currentUser.email);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setAccessDenied(null);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login failed:", err);
      setLoading(false);
      setAuthError(err.message || "Google authentication was interrupted. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-50 dark:bg-[#060911] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3 select-none">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400 animate-spin" />
        </div>
        <span className="text-xs font-mono text-slate-600 dark:text-slate-400 tracking-wider">
          Verifying security handshake...
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-[#060911] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 md:p-8 relative select-none transition-colors duration-150">
        {/* Subtle background ambient celestial glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/[0.08] dark:bg-indigo-600/[0.07] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/[0.06] dark:bg-cyan-500/[0.05] rounded-full blur-3xl pointer-events-none" />

        {/* ======================================================== */}
        {/* MOBILE VIEW (< md): Unified, compact, perfectly fitted   */}
        {/* Guaranteed never to overflow on small phone screens       */}
        {/* ======================================================== */}
        <div className="md:hidden w-full max-w-sm bg-white/95 dark:bg-[#0c111e]/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-xl p-5 space-y-4 relative z-10 my-auto">
          {/* Header Row: Perfectly balanced Logo + RunSync & ThemeToggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-sans">
                    RunSync
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-semibold">
                    2.0
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                  Swarm Storage Pipeline
                </span>
              </div>
            </div>

            <ThemeToggle variant="icon" />
          </div>

          {/* Headline */}
          <div className="space-y-1 pt-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
              High-throughput cloud pipeline for model weights & archives.
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Stream multi-gigabyte models into Google Drive without local bottlenecks.
            </p>
          </div>

          {/* 3 Technical Badges (Compact horizontal pill row) */}
          <div className="grid grid-cols-3 gap-1.5 py-0.5">
            <div className="py-1.5 px-2 rounded-lg bg-slate-100/80 dark:bg-[#080d1a] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center gap-1.5 text-center">
              <Cpu className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300">FastAPI</span>
            </div>
            <div className="py-1.5 px-2 rounded-lg bg-slate-100/80 dark:bg-[#080d1a] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center gap-1.5 text-center">
              <HardDrive className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300">5 TB Vault</span>
            </div>
            <div className="py-1.5 px-2 rounded-lg bg-slate-100/80 dark:bg-[#080d1a] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center gap-1.5 text-center">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300">Zero Leak</span>
            </div>
          </div>

          {/* Access Warning / Auth Error */}
          {accessDenied && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
              <div className="leading-tight">
                <strong className="block text-rose-800 dark:text-rose-200 text-[11px]">Account Restricted</strong>
                <span className="text-[10px]">{accessDenied} is not on the whitelist.</span>
              </div>
            </div>
          )}

          {authError && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" />
              <div className="leading-tight">
                <strong className="block text-amber-800 dark:text-amber-200 text-[11px]">Notice</strong>
                <span className="text-[10px]">{authError}</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06] space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-md shadow-indigo-600/30 border border-indigo-400/20 group cursor-pointer"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Security Footnote */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Strict OAuth 2.0
            </span>
            <span>US-West Node</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DESKTOP VIEW (>= md): Dual-Pane High-End Split Card      */}
        {/* ======================================================== */}
        <div className="hidden md:grid md:grid-cols-12 w-full max-w-4xl bg-white/95 dark:bg-[#0c111e]/90 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden relative z-10 my-auto">
          {/* Left Hero Pane */}
          <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between border-r border-slate-200 dark:border-white/[0.07] bg-gradient-to-br from-slate-50/80 to-indigo-50/30 dark:from-[#0e1424] dark:to-[#0a0f1b]">
            <div className="space-y-6">
              {/* Brand Header */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-sans">
                      RunSync
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-semibold">
                      2.0
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                    Cloud Extraction & Swarm Storage
                  </span>
                </div>
              </div>

              {/* Pitch & Mission */}
              <div className="space-y-2 pt-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                  High-throughput cloud pipeline for weights, datasets & archives.
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Stream multi-gigabyte models directly into Google Drive without local network bottlenecks. Powered by isolated scratchpad containers and parallel Rclone pipelines.
                </p>
              </div>

              {/* Technical Feature Chips */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#070b14] border border-slate-200 dark:border-white/[0.05] flex items-center gap-2 shadow-2xs">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate">FastAPI Swarm</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#070b14] border border-slate-200 dark:border-white/[0.05] flex items-center gap-2 shadow-2xs">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate">5 TB Vault</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#070b14] border border-slate-200 dark:border-white/[0.05] flex items-center gap-2 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate">Zero Leak</span>
                </div>
              </div>
            </div>

            {/* Architecture note */}
            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Authorized Access Only
              </span>
              <span>US-West Node</span>
            </div>
          </div>

          {/* Right Authentication Action Pane */}
          <div className="md:col-span-5 p-8 md:p-10 flex flex-col justify-between bg-white dark:bg-[#0b0f1c] space-y-6">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Sign in
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Authenticate to access telemetry and storage.
                  </p>
                </div>
                {/* Theme Toggle aligned top-right of Sign-in pane */}
                <ThemeToggle variant="icon" />
              </div>

              {/* Access Denied Warning */}
              {accessDenied && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="block text-rose-800 dark:text-rose-200">Account Restricted</strong>
                    <span>{accessDenied} is not on the authorized whitelist.</span>
                  </div>
                </div>
              )}

              {/* Interruption or Auth Error */}
              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="block text-amber-800 dark:text-amber-200">Notice</strong>
                    <span>{authError}</span>
                  </div>
                </div>
              )}

              {/* Sign in with Google Button with authentic Google icon */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-indigo-600/30 border border-indigo-400/20 group cursor-pointer"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Bottom Security Disclaimer */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/[0.05] text-[10px] text-slate-500 dark:text-slate-400 font-mono text-center">
              Protected by Firebase Admin Server Verification • Strict OAuth 2.0
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
