"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { checkBackendHealth, wakeCodespaceInstance } from "@/lib/api";

export type CodespaceStatusType = "online" | "booting" | "standby" | "degraded";

export function useCodespaceStatus(pollIntervalMs: number = 5000) {
  const [status, setStatus] = useState<CodespaceStatusType>("standby");
  const [cluster, setCluster] = useState<string>("Codespace • US-West");
  const [isBooting, setIsBooting] = useState<boolean>(false);
  const [engineState, setEngineState] = useState<string>("idle");
  const [lastCheckedTime, setLastCheckedTime] = useState<string>("");

  const isBootingRef = useRef(isBooting);
  isBootingRef.current = isBooting;

  const isCheckingRef = useRef(false);

  const checkStatus = useCallback(async (): Promise<boolean> => {
    if (isCheckingRef.current) return false;
    isCheckingRef.current = true;

    try {
      const health = await checkBackendHealth();
      setLastCheckedTime(new Date().toLocaleTimeString());

      if (health && health.status === "online") {
        setStatus("online");
        setIsBooting(false);
        if (health.cluster) setCluster(health.cluster);
        if (health.engine) setEngineState(health.engine);
        return true;
      } else if (health && health.status === "standby") {
        if (!isBootingRef.current) {
          setStatus("standby");
          setEngineState("idle");
        }
        return false;
      } else {
        // Outage or degraded response
        if (!isBootingRef.current) {
          setStatus((prev) => (prev === "online" ? "degraded" : "standby"));
        }
        return false;
      }
    } catch {
      if (!isBootingRef.current) {
        setStatus((prev) => (prev === "online" ? "degraded" : "standby"));
      }
      return false;
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  // Main unified polling loop using recursive timeout (no overlapping requests)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const schedulePoll = () => {
      const isHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      const delay = isHidden ? 15000 : isBooting ? 2500 : pollIntervalMs;

      timeoutId = setTimeout(async () => {
        if (isMounted) {
          await checkStatus();
          if (isMounted) schedulePoll();
        }
      }, delay);
    };

    checkStatus().then(() => {
      if (isMounted) schedulePoll();
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkStatus();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [checkStatus, pollIntervalMs, isBooting]);

  /**
   * Dispatches GitHub Action to wake up Codespace
   */
  const wakeUpCodespace = useCallback(async (): Promise<boolean> => {
    setIsBooting(true);
    setStatus("booting");

    const dispatched = await wakeCodespaceInstance();
    if (!dispatched) {
      setIsBooting(false);
      setStatus("standby");
      return false;
    }

    // Immediately trigger status check
    await checkStatus();
    return true;
  }, [checkStatus]);

  return {
    status,
    isOnline: status === "online",
    isBooting,
    cluster,
    engineState,
    lastCheckedTime,
    checkStatus,
    wakeUpCodespace,
  };
}
