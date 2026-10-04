"use client";

import React, { useState, useEffect } from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { ShieldAlert, LogIn, Loader2, Zap } from "lucide-react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  const allowedEmails = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email) {
        const email = currentUser.email.toLowerCase();
        if (allowedEmails.includes(email)) {
          setUser(currentUser);
          setAccessDenied(null);
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
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login failed:", err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#080C14] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-xs font-mono">Verifying authorization...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen bg-[#080C14] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm p-6 sm:p-8 rounded-2xl bg-[#0D1424] border border-[#1A263D] shadow-2xl flex flex-col items-center text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Zap className="w-6 h-6 fill-current" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">RunSync 2.0</h1>
            <p className="text-xs text-slate-400 mt-1">
              Private Cloud Extraction & Swarm Pipeline
            </p>
          </div>

          {accessDenied && (
            <div className="w-full p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 text-left">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>
                Access Denied for <strong>{accessDenied}</strong>. Email is not whitelisted.
              </span>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}