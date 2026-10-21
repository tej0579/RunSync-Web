"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  TelemetrySnapshot,
  ActiveTaskItem,
  KpiMetrics,
  SpeedDataPoint,
} from "@/types/telemetry";
import {
  fetchBackendStatus,
  enqueueExtraction,
  sendTaskAction,
} from "@/lib/api";
import { EnqueueTaskRequest, BackendEngineStatus } from "@/types/api";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { getAuthHeaders } from "@/lib/clientAuth";
import { formatBytes } from "@/lib/utils";

const MAX_HISTORY_POINTS = 20;

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseBytesFromTaskName(name: string): number {
  if (!name) return 0;
  const match = name.match(/(\d+(?:\.\d+)?)\s*(gb|gib|mb|mib|kb|kib)/i);
  if (!match) return 0;

  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  if (unit.startsWith("g")) return Math.round(val * 1024 * 1024 * 1024);
  if (unit.startsWith("m")) return Math.round(val * 1024 * 1024);
  if (unit.startsWith("k")) return Math.round(val * 1024);
  return 0;
}

const createInitialSpeedHistory = (): SpeedDataPoint[] => {
  return Array.from({ length: MAX_HISTORY_POINTS }, (_, i) => ({
    time: `--:--:${String(i).padStart(2, "0")}`,
    speed: 0,
  }));
};

const initialKpis: KpiMetrics = {
  activeTransfers: { value: 0, trend: "idle", isPositive: false },
  completed: { value: 0, trend: "0 this week", isPositive: true },
  dataExtracted: { value: "0 B", trend: "+0 B today", isPositive: true },
  avgSpeed: { value: "0.00 MB/s", trend: "0.00 MB/s", isPositive: false },
};

const initialSnapshot: TelemetrySnapshot = {
  kpis: initialKpis,
  tasks: [],
  transferSpeedMbps: 0,
  speedHistory: createInitialSpeedHistory(),
  storage: {
    usedBytes: 0,
    totalBytes: 5 * 1024 * 1024 * 1024 * 1024,
  },
  isStale: false,
};

export function parseSpeedStringToMbps(speedStr: string | undefined): number {
  if (!speedStr) return 0;
  const cleaned = speedStr.trim().toLowerCase();
  if (
    cleaned.includes("finish") ||
    cleaned.includes("idle") ||
    cleaned.includes("done") ||
    cleaned.includes("offline") ||
    cleaned.includes("calculating")
  ) {
    return 0;
  }

  const numericMatch = cleaned.match(/([\d.]+)/);
  if (!numericMatch) return 0;

  const rawVal = parseFloat(numericMatch[1]);
  if (isNaN(rawVal)) return 0;

  if (cleaned.includes("gb/s") || cleaned.includes("gib/s") || cleaned.includes("gbyte/s")) {
    return rawVal * 1024;
  }
  if (cleaned.includes("mb/s") || cleaned.includes("mib/s") || cleaned.includes("mbyte/s")) {
    return rawVal;
  }
  if (cleaned.includes("kb/s") || cleaned.includes("kib/s") || cleaned.includes("kbyte/s")) {
    return rawVal / 1024;
  }
  if (cleaned.includes("b/s") || cleaned.includes("byte/s")) {
    return rawVal / (1024 * 1024);
  }
  return rawVal;
}

export function useTelemetry(isOnline: boolean, onJobCompleted?: () => void) {
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot>(initialSnapshot);
  const [firestoreBytes24h, setFirestoreBytes24h] = useState<number>(0);
  const [firestoreTotalBytes, setFirestoreTotalBytes] = useState<number>(0);
  const [firestoreBytesToday, setFirestoreBytesToday] = useState<number>(0);
  const [hourlyTransfers, setHourlyTransfers] = useState<Record<string, number>>({});

  const speedHistoryRef = useRef<SpeedDataPoint[]>(createInitialSpeedHistory());
  const completedFiredRef = useRef<boolean>(false);
  const isPollingRef = useRef<boolean>(false);
  const activeTasksCountRef = useRef<number>(0);
  const lastActiveTaskRef = useRef<ActiveTaskItem | null>(null);

  // 1. Commit Task Completion via Server API (Strict idempotency & validation)
  const commitTaskCompletionToFirestore = async (task: ActiveTaskItem | null) => {
    try {
      const taskId = task?.id || `task_${Date.now()}`;
      const taskBytes = task ? parseBytesFromTaskName(task.name) : 0;
      const headers = await getAuthHeaders();

      const res = await fetch("/api/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          taskId,
          bytes: taskBytes,
          name: task?.name || "Completed Stream",
          source: task?.source || "huggingface",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn("[Metrics Sync] Failed to record completion:", errJson);
      } else {
        console.log(`[Metrics Sync] Task completion recorded via authenticated API: ${taskId}`);
      }
    } catch (err) {
      console.warn("[Metrics Sync] Error calling /api/metrics:", err);
    }
  };

  // 2. Real-time listener for Firestore analytics document
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "analytics", "dashboard"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const todayStr = getLocalDateString();
          const isSameDay = data.date === todayStr;

          const completedCount = Number(data.completed_count) || 0;
          const completedWeek = Number(data.completed_this_week) || 0;
          const totalBytes = Number(data.total_bytes_extracted) || 0;
          const todayBytes = isSameDay ? Number(data.bytes_today) || 0 : 0;

          const hourly: Record<string, number> = data.hourly_transfers || {};
          const total24h = Object.values(hourly).reduce(
            (sum: number, val: any) => sum + (Number(val) || 0),
            0
          ) as number;

          setFirestoreTotalBytes(totalBytes);
          setFirestoreBytes24h(total24h);
          setFirestoreBytesToday(todayBytes);
          setHourlyTransfers(hourly);

          setSnapshot((prev) => ({
            ...prev,
            hourlyTransfers: hourly,
            kpis: {
              ...prev.kpis,
              completed: {
                ...prev.kpis.completed,
                value: completedCount,
                trend: `+${completedWeek} this week`,
              },
              dataExtracted: {
                ...prev.kpis.dataExtracted,
                value: formatBytes(totalBytes),
                trend: `+${formatBytes(todayBytes)} today`,
              },
            },
          }));
        }
      },
      (err) => console.warn("[Firestore Telemetry Sync Error]", err)
    );

    return () => unsub();
  }, []);

  // 3. Telemetry Poller & Completion Watcher
  const pollTelemetry = useCallback(async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      const nowTimeStr = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      if (!isOnline) {
        // When offline, preserve previous task list but label as stale
        const updatedHistory = [
          ...speedHistoryRef.current.slice(1),
          { time: nowTimeStr, speed: 0 },
        ];
        speedHistoryRef.current = updatedHistory;

        setSnapshot((prev) => ({
          ...prev,
          isStale: true,
          transferSpeedMbps: 0,
          speedHistory: updatedHistory,
          kpis: {
            ...prev.kpis,
            avgSpeed: { value: "0.00 MB/s", trend: "offline", isPositive: false },
          },
        }));
        completedFiredRef.current = false;
        return;
      }

      const data: BackendEngineStatus | null = await fetchBackendStatus();
      if (!data) {
        // Backend temporarily unreachable; preserve state and set stale flag
        setSnapshot((prev) => ({ ...prev, isStale: true }));
        return;
      }

      const statusStr = (data.status || "").toLowerCase();
      const isFinished =
        statusStr.includes("complete") ||
        statusStr.includes("finish") ||
        statusStr.includes("success") ||
        (data as any).completed === true;

      if (isFinished && !completedFiredRef.current) {
        completedFiredRef.current = true;
        commitTaskCompletionToFirestore(lastActiveTaskRef.current);
        if (onJobCompleted) onJobCompleted();
      }

      const tasks: ActiveTaskItem[] = [];
      let maxTaskSpeedMb = 0;

      if (Array.isArray(data.active_tasks) && data.active_tasks.length > 0) {
        data.active_tasks.forEach((t) => {
          const taskSpeedNum = parseSpeedStringToMbps(t.speed);
          if (taskSpeedNum > maxTaskSpeedMb) maxTaskSpeedMb = taskSpeedNum;

          tasks.push({
            id: t.id,
            name: t.name,
            source: t.type === "huggingface" ? "HuggingFace" : "Torrent",
            status: t.status === "transferring" ? "transferring" : "downloading",
            progress: Number(t.progress) || 0,
            speed: t.speed || "0.00 MB/s",
            eta: t.eta || "-",
          });
        });
      } else if (
        data.name &&
        (statusStr === "downloading" || statusStr === "transferring" || statusStr === "streaming")
      ) {
        // Support single-task root response formats
        const rootProgress = parseFloat(data.progress || "0") || 0;
        const rootSpeed = parseSpeedStringToMbps(data.speed || data.upload_speed);
        if (rootSpeed > maxTaskSpeedMb) maxTaskSpeedMb = rootSpeed;

        tasks.push({
          id: "active-stream",
          name: data.name,
          source: data.name.toLowerCase().includes("hf") ? "HuggingFace" : "Torrent",
          status: statusStr === "transferring" ? "transferring" : "downloading",
          progress: rootProgress,
          speed: data.speed || data.upload_speed || "0.00 MB/s",
          eta: data.upload_eta || "-",
        });
      }

      if (tasks.length > 0) {
        lastActiveTaskRef.current = tasks[0];
        completedFiredRef.current = false;
      }

      activeTasksCountRef.current = tasks.length;

      const downloadSpeedNum = parseSpeedStringToMbps(data.speed);
      const uploadSpeedNum = parseSpeedStringToMbps(data.upload_speed);
      const activeSpeedValue = Math.max(uploadSpeedNum, downloadSpeedNum, maxTaskSpeedMb);

      const nextHistory = [
        ...speedHistoryRef.current.slice(1),
        { time: nowTimeStr, speed: Number(activeSpeedValue.toFixed(2)) },
      ];
      speedHistoryRef.current = nextHistory;

      let displaySpeedString = "0.00 MB/s";
      if (tasks.length > 0 && activeSpeedValue > 0) {
        displaySpeedString = `${activeSpeedValue.toFixed(2)} MB/s`;
      }

      setSnapshot((prev) => ({
        ...prev,
        isStale: false,
        tasks,
        transferSpeedMbps: Number(activeSpeedValue.toFixed(2)),
        speedHistory: nextHistory,
        kpis: {
          ...prev.kpis,
          activeTransfers: {
            value: tasks.length,
            trend: tasks.length > 0 ? `+${tasks.length} running` : "idle",
            isPositive: tasks.length > 0,
          },
          avgSpeed: {
            value: displaySpeedString,
            trend: tasks.length > 0 ? "+active stream" : "0.00 MB/s",
            isPositive: tasks.length > 0,
          },
        },
      }));
    } finally {
      isPollingRef.current = false;
    }
  }, [isOnline, onJobCompleted]);

  // 4. Adaptive Polling Loop (Pauses/throttles when tab is backgrounded)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const scheduleNextPoll = () => {
      const isHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      const hasWork = activeTasksCountRef.current > 0;

      // Adaptive interval: 1s while active, 3.5s while idle, 10s while offline, 15s while tab is hidden
      const delay = isHidden ? 15000 : !isOnline ? 10000 : hasWork ? 1000 : 3500;

      timeoutId = setTimeout(async () => {
        if (isMounted) {
          await pollTelemetry();
          if (isMounted) scheduleNextPoll();
        }
      }, delay);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        pollTelemetry();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    pollTelemetry().then(() => {
      if (isMounted) scheduleNextPoll();
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [isOnline, pollTelemetry]);

  const triggerExtraction = async (req: EnqueueTaskRequest) => {
    completedFiredRef.current = false;
    const res = await enqueueExtraction(req);
    await pollTelemetry();
    return res;
  };

  const pauseTask = async (taskId: string) => {
    await sendTaskAction(taskId, "pause");
  };

  const resumeTask = async (taskId: string) => {
    await sendTaskAction(taskId, "resume");
  };

  const cancelTask = async (taskId: string) => {
    await sendTaskAction(taskId, "cancel");
    await pollTelemetry();
  };

  return {
    snapshot,
    firestoreBytes24h,
    firestoreTotalBytes,
    firestoreBytesToday,
    hourlyTransfers,
    triggerExtraction,
    pauseTask,
    resumeTask,
    cancelTask,
  };
}
