"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Loader2, Power } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";

interface WelcomeBannerProps {
  userName?: string;
  isOnline: boolean;
  isBooting?: boolean;
  cluster?: string;
  onWake?: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  userName: fallbackName = "Saiteja",
  isOnline,
  isBooting = false,
  cluster = "Codespace • US-West",
  onWake,
}) => {
  const [currentDate, setCurrentDate] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("Good afternoon");
  const [displayName, setDisplayName] = useState<string>(fallbackName);

  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.displayName) {
      setDisplayName(user.displayName.split(" ")[0]);
    } else if (user && user.email) {
      setDisplayName(user.email.split("@")[0]);
    }
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const hours = now.getHours();

      if (hours < 12) setGreeting("Good morning");
      else if (hours < 17) setGreeting("Good afternoon");
      else setGreeting("Good evening");

      const dateFormatted = now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
        year: "numeric",
      });

      const timeFormatted = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      setCurrentDate(dateFormatted);
      setCurrentTime(timeFormatted);
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 select-none pt-1">
      {/* Left: User Welcome Greeting */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans flex items-center gap-2">
          <span>{greeting}, {displayName}</span>
          <span className="inline-block animate-wave text-xl sm:text-2xl">👋</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Swarm telemetry, cloud extraction, and synchronized Drive vault.
        </p>
      </div>

      {/* Right: Real-time Status Pill & Live Clock (Pixel-perfect matching dimensions) */}
      <div className="grid grid-cols-2 gap-2.5 w-full sm:flex sm:w-auto sm:items-center sm:gap-3 shrink-0">
        {/* Status Pill Card */}
        <div
          onClick={!isOnline && !isBooting && onWake ? onWake : undefined}
          title={!isOnline && !isBooting ? "Click to trigger cloud worker wake sequence" : undefined}
          className={cn(
            "h-[52px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#0c111e] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2.5 transition-all min-w-0 select-none shadow-xs",
            !isOnline && !isBooting && onWake && "cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-[#111728] group"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#070b14] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center shrink-0">
            {isBooting ? (
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            ) : isOnline ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
              </span>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500" />
            )}
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <div className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 leading-tight truncate">
              <span className="truncate">
                {isBooting
                  ? "Booting Node..."
                  : isOnline
                  ? "System Online"
                  : "System Standby"}
              </span>
              {!isOnline && !isBooting && onWake && (
                <Power className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 transition-colors" />
              )}
            </div>
            <div className="text-[9px] sm:text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-tight">
              {isBooting ? "Spawning..." : cluster}
            </div>
          </div>
        </div>

        {/* Date / Time Card */}
        <div className="h-[52px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#0c111e] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2.5 min-w-0 select-none shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#070b14] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <div className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">
              {currentDate || "Loading..."}
            </div>
            <div className="text-[9px] sm:text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-tight">
              {currentTime || "--:--"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
