"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Loader2, Power } from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeBannerProps {
  userName?: string;
  isOnline: boolean;
  isBooting?: boolean;
  cluster?: string;
  onWake?: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  userName = "Saiteja",
  isOnline,
  isBooting = false,
  cluster = "Codespace • US-West",
  onWake,
}) => {
  const [currentDate, setCurrentDate] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("Good afternoon");

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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 select-none">
      {/* Left: User Welcome Greeting */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          {greeting}, {userName} <span className="inline-block animate-wave">👋</span>
        </h1>
        <p className="text-[11px] sm:text-xs md:text-sm text-slate-400 mt-0.5 sm:mt-1">
          Extract, manage, and transfer your files seamlessly.
        </p>
      </div>

      {/* Right: Real-time Status Pill & Live Clock */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Status Pill Card */}
        <div
          onClick={!isOnline && !isBooting && onWake ? onWake : undefined}
          title={!isOnline && !isBooting ? "Click to boot cloud worker" : undefined}
          className={cn(
            "px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#0D1424] border border-[#1A263D] flex items-center gap-2 transition-all",
            !isOnline && !isBooting && onWake && "cursor-pointer hover:border-blue-500/50 hover:bg-[#111A30]"
          )}
        >
          {isBooting ? (
            <Loader2 className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
          ) : (
            <span
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                isOnline
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                  : "bg-slate-500"
              )}
            />
          )}

          <div className="flex flex-col leading-tight">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-200 flex items-center gap-1">
              {isBooting
                ? "Booting..."
                : isOnline
                ? "System Online"
                : "System Standby"}
              {!isOnline && !isBooting && onWake && (
                <Power className="w-2.5 h-2.5 text-slate-400 hover:text-blue-400" />
              )}
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 truncate max-w-[100px] sm:max-w-none">
              {isBooting ? "Spawning..." : cluster}
            </span>
          </div>
        </div>

        {/* Date / Time Card */}
        <div className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#0D1424] border border-[#1A263D] flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex flex-col leading-tight font-mono text-right">
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-200">
              {currentDate || "Loading..."}
            </span>
            <span className="text-[8px] sm:text-[9px] text-slate-400">
              {currentTime || "--:--"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};