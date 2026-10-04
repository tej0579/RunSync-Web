"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { checkBackendHealth, wakeCodespaceInstance } from "@/lib/api";

export type CodespaceStatusType = "online" | "booting" | "standby";

export function useCodespaceStatus(pollIntervalMs: number = 5000) {
  const [status, setStatus] = useState<CodespaceStatusType>("standby");
  const [cluster, setCluster] = useState<string>("Codespace • US-West");
  const [isBooting, setIsBooting] = useState<boolean>(false);
  const [engineState, setEngineState] = useState<string>("idle");

  const isBootingRef = useRef(isBooting);
  isBootingRef.current = isBooting;

  const activePollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = useCallback(async (): Promise<boolean> => {
    const health = await checkBackendHealth();
    if (health && health.status === "online") {
      setStatus("online");
      setIsBooting(false);
      if (health.cluster) setCluster(health.cluster);
      if (health.engine) setEngineState(health.engine);
      return true;
    } else {
      if (!isBootingRef.current) {
        setStatus("standby");
        setEngineState("idle");
      }
      return false;
    }
  }, []);

  // Main polling loop
  useEffect(() => {
    checkStatus();

    const interval = setInterval(async () => {
      await checkStatus();
    }, isBooting ? 2500 : pollIntervalMs);

    return () => clearInterval(interval);
  }, [checkStatus, pollIntervalMs, isBooting]);

  // Clean up any active boot poll timer on unmount
  useEffect(() => {
    return () => {
      if (activePollTimerRef.current) {
        clearInterval(activePollTimerRef.current);
      }
    };
  }, []);

  /**
   * Dispatches GitHub Action to wake up Codespace and polls until alive
   */
  const wakeUpCodespace = useCallback(async (): Promise<boolean> => {
    if (activePollTimerRef.current) {
      clearInterval(activePollTimerRef.current);
    }

    setIsBooting(true);
    setStatus("booting");

    const dispatched = await wakeCodespaceInstance();
    if (!dispatched) {
      setIsBooting(false);
      setStatus("standby");
      return false;
    }

    // Actively poll for up to 90 seconds (Codespace boot + Ngrok handshake takes ~25-40s)
    let attempts = 0;
    const maxAttempts = 30; // 30 * 3s = 90s

    activePollTimerRef.current = setInterval(async () => {
      attempts++;
      const isAlive = await checkStatus();
      if (isAlive || attempts >= maxAttempts) {
        if (activePollTimerRef.current) {
          clearInterval(activePollTimerRef.current);
          activePollTimerRef.current = null;
        }
        if (!isAlive) {
          setIsBooting(false);
          setStatus("standby");
        }
      }
    }, 3000);

    return true;
  }, [checkStatus]);

  return {
    status,
    isOnline: status === "online",
    isBooting,
    cluster,
    engineState,
    checkStatus,
    wakeUpCodespace,
  };
}