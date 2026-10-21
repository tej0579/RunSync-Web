"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  MoreVertical,
  UploadCloud,
  AlertCircle,
  Database,
  Download,
  CheckCircle2,
} from "lucide-react";
import { RecentActivityItem, ActivityStatus } from "@/types/telemetry";
import { cn } from "@/lib/utils";

interface RecentActivityProps {
  activities?: RecentActivityItem[];
}

const defaultActivities: RecentActivityItem[] = [
  {
    id: "act-1",
    title: "meta-llama/Llama-3.2-1B-Instruct",
    subtitle: "Cloud stream to Drive",
    timestamp: "Just now",
    status: "completed",
  },
  {
    id: "act-2",
    title: "Academic Torrent Swarm",
    subtitle: "Direct disk ingest",
    timestamp: "18m ago",
    status: "downloaded",
  },
  {
    id: "act-3",
    title: "common_crawl/raw-data",
    subtitle: "Direct Google Drive stream",
    timestamp: "1h ago",
    status: "transferred",
  },
];

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities = defaultActivities,
}) => {
  const router = useRouter();

  const getStatusIconConfig = (status: ActivityStatus) => {
    switch (status) {
      case "preparing":
        return {
          icon: UploadCloud,
          wrapperClass: "bg-blue-500/10 border-blue-500/30 text-blue-400",
        };
      case "failed":
        return {
          icon: AlertCircle,
          wrapperClass: "bg-rose-500/10 border-rose-500/30 text-rose-400",
        };
      case "transferred":
        return {
          icon: Database,
          wrapperClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        };
      case "downloaded":
        return {
          icon: Download,
          wrapperClass: "bg-sky-500/10 border-sky-500/30 text-sky-400",
        };
      case "completed":
        return {
          icon: CheckCircle2,
          wrapperClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        };
      default:
        return {
          icon: CheckCircle2,
          wrapperClass: "bg-slate-500/10 border-slate-500/30 text-slate-400",
        };
    }
  };

  return (
    <div className="p-5 md:p-6 rounded-2xl bg-[#0c111e] border border-white/[0.08] shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm md:text-base font-semibold text-slate-100 tracking-tight">
          Recent Activity
        </h2>
        <button
          type="button"
          onClick={() => router.push("/storage")}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
        >
          <span>View Storage</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3.5">
        {activities.map((item) => {
          const config = getStatusIconConfig(item.status);
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 group"
            >
              {/* Left: Indicator Icon, Title & Status Detail */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center border shrink-0",
                    config.wrapperClass
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div
                    className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors"
                    title={item.title}
                  >
                    {item.title}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {/* Right: Timestamp */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-slate-500">
                  {item.timestamp}
                </span>
                <button
                  type="button"
                  className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-[#151E33] transition-colors"
                  aria-label="Item actions"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};