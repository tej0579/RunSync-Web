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
import {
  doc,
  onSnapshot,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";

const MAX_HISTORY_POINTS = 20;

function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.min(Math.max(i, 0), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeIndex)).toFixed(dm))} ${sizes[safeIndex]}`;
}

// Uses the browser's true local date (e.g. 2026-10-21) rather than UTC
function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseBytesFromTaskName(name: string): number {
  if (!name) return 500 * 1024 * 1024;
  const match = name.match(/(\d+(?:\.\d+)?)\s*(gb|gib|mb|mib|kb|kib)/i);
  if (!match) return 500 * 1024 * 1024;

  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  if (unit.startsWith("g")) return Math.round(val * 1024 * 1024 * 1024);
  if (unit.startsWith("m")) return Math.round(val * 1024 * 1024);
  if (unit.startsWith("k")) return Math.round(val * 1024);
  return 500 * 1024 * 1024;
}

const createInitialSpeedHistory = (): SpeedDataPoint[] => {
  return Array.from({ length: MAX_HISTORY_POINTS }, (_, i) => ({
    time: `--:--:${String(i).padStart(2, "0")}`,
    speed: 0,
  }));
};

const initialKpis: KpiMetrics = {
  activeTransfers: { value: 0, trend: "idle", isPositive: true },
  completed: { value: 137, trend: "+14 this week", isPositive: true },
  dataExtracted: { value: "115.8 GB", trend: "+syncing", isPositive: true },
  avgSpeed: { value: "0.00 MB/s", trend: "0.00 MB/s", isPositive: true },
};

const initialSnapshot: TelemetrySnapshot = {
  kpis: initialKpis,
  tasks: [],
  transferSpeedMbps: 0,
  speedHistory: createInitialSpeedHistory(),
  storage: {
    usedBytes: 114.1 * 1024 * 1024 * 1024,
    totalBytes: 5 * 1024 * 1024 * 1024 * 1024,
  },
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
  const [firestoreTotalBytes, setFirestoreTotalBytes] = useState<number>(124322312192);
  const [firestoreBytesToday, setFirestoreBytesToday] = useState<number>(0);

  const speedHistoryRef = useRef<SpeedDataPoint[]>(createInitialSpeedHistory());
  const completedFiredRef = useRef<boolean>(false);
  const isPollingRef = useRef<boolean>(false);
  const activeTasksCountRef = useRef<number>(0);
  const lastActiveTaskRef = useRef<ActiveTaskItem | null>(null);
  const firestoreDocDataRef = useRef<any>(null);

  // 1. Commit Task Completion directly to Firestore
  const commitTaskCompletionToFirestore = async (task: ActiveTaskItem | null) => {
    try {
      const taskBytes = task ? parseBytesFromTaskName(task.name) : 500 * 1024 * 1024;
      const todayStr = getLocalDateString();
      const currentHour = new Date().getHours().toString().padStart(2, "0");
      const docRef = doc(db, "analytics", "dashboard");

      const existingData = firestoreDocDataRef.current || {};
      const isSameDay = existingData.date === todayStr;

      await updateDoc(docRef, {
        completed_count: increment(1),
        completed_this_week: increment(1),
        total_bytes_extracted: increment(taskBytes),
        bytes_today: isSameDay ? increment(taskBytes) : taskBytes,
        date: todayStr,
        [`hourly_transfers.${currentHour}`]: increment(taskBytes),
        last_updated: serverTimestamp(),
      });
      console.log(`[Frontend] Successfully saved extraction (+${formatBytes(taskBytes)}) to Firestore.`);
    } catch (err) {
      console.warn("[Frontend] Failed to write metrics to Firestore:", err);
    }
  };

  // 2. Real-time listener for Firestore document
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "analytics", "dashboard"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          firestoreDocDataRef.current = data;

          const todayStr = getLocalDateString();
          const isSameDay = data.date === todayStr;

          const completedCount = Number(data.completed_count) || 137;
          const completedWeek = Number(data.completed_this_week) || 14;
          const totalBytes = Number(data.total_bytes_extracted) || 124322312192;
          const todayBytes = isSameDay ? Number(data.bytes_today) || 0 : 0;

          const hourly = data.hourly_transfers || {};
          const total24h = Object.values(hourly).reduce(
            (sum: number, val: any) => sum + (Number(val) || 0),
            0
          ) as number;

          setFirestoreTotalBytes(totalBytes);
          setFirestoreBytes24h(total24h);
          setFirestoreBytesToday(todayBytes);

          setSnapshot((prev) => ({
            ...prev,
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
        activeTasksCountRef.current = 0;
        const updatedHistory = [
          ...speedHistoryRef.current.slice(1),
          { time: nowTimeStr, speed: 0 },
        ];
        speedHistoryRef.current = updatedHistory;

        setSnapshot((prev) => ({
          ...prev,
          tasks: [],
          transferSpeedMbps: 0,
          speedHistory: updatedHistory,
          kpis: {
            ...prev.kpis,
            activeTransfers: { value: 0, trend: "idle", isPositive: false },
            avgSpeed: { value: "0.00 MB/s", trend: "offline", isPositive: false },
          },
        }));
        completedFiredRef.current = false;
        return;
      }

      const data: BackendEngineStatus | null = await fetchBackendStatus();
      if (!data) return;

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

  // 4. Adaptive Polling Loop
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const scheduleNextPoll = () => {
      const hasWork = activeTasksCountRef.current > 0;
      const delay = !isOnline ? 8000 : hasWork ? 1000 : 3500;

      timeoutId = setTimeout(async () => {
        await pollTelemetry();
        if (isMounted) scheduleNextPoll();
      }, delay);
    };

    pollTelemetry().then(() => {
      if (isMounted) scheduleNextPoll();
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
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
    triggerExtraction,
    pauseTask,
    resumeTask,
    cancelTask,
  };
}