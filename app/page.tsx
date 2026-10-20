"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { MetricsRow } from "@/components/dashboard/MetricsRow";
import { ExtractionCard, SourceBadge, ExecutionMode } from "@/components/dashboard/ExtractionCard";
import { AnalyticsGrid } from "@/components/dashboard/AnalyticsGrid";
import { StorageCard } from "@/components/dashboard/StorageCard";
import { ActiveTransfers } from "@/components/dashboard/ActiveTransfers";
import { ServerWakeModal } from "@/components/dashboard/ServerWakeModal";
import { useCodespaceStatus } from "@/hooks/useCodespaceStatus";
import { useTelemetry } from "@/hooks/useTelemetry";
import { CheckCircle2, AlertTriangle, Loader2, X } from "lucide-react";

export default function DashboardPage() {
  const { isOnline, isBooting, cluster, checkStatus, wakeUpCodespace } = useCodespaceStatus(5000);
  const [liveStorageBytes, setLiveStorageBytes] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [showWakeModal, setShowWakeModal] = useState<boolean>(false);
  const pendingExtractionRef = useRef<{
    url: string;
    source: SourceBadge;
    mode: ExecutionMode;
  } | null>(null);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Queries Google Drive solely for the Storage Usage gauge
  const refreshStorageMetrics = useCallback(async () => {
    try {
      const folderId =
        process.env.NEXT_PUBLIC_GDRIVE_FOLDER_ID || "1W5rVvmzDA5hpFEH8Sd53IyLb9R-bmY9O";
      const res = await fetch(`/api/drive?folderId=${encodeURIComponent(folderId)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();

      const total =
        typeof data.totalStorageBytes === "number"
          ? data.totalStorageBytes
          : (data.files || []).reduce(
              (acc: number, curr: any) => acc + (curr.sizeBytes || 0),
              0
            );

      setLiveStorageBytes(total);
    } catch {
      // Preserve existing readings on network drop
    }
  }, []);

  const {
    snapshot,
    firestoreBytes24h,
    firestoreTotalBytes,
    firestoreBytesToday,
    triggerExtraction,
    pauseTask,
    resumeTask,
    cancelTask,
  } = useTelemetry(isOnline, refreshStorageMetrics);

  const [toast, setToast] = useState<{
    show: boolean;
    type: "success" | "info" | "warning";
    message: string;
  }>({
    show: false,
    type: "info",
    message: "",
  });

  const showToast = useCallback(
    (message: string, type: "success" | "info" | "warning" = "info", duration = 4500) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setToast({ show: true, type, message });
      if (duration > 0) {
        toastTimerRef.current = setTimeout(() => {
          setToast((prev) => ({ ...prev, show: false }));
        }, duration);
      }
    },
    []
  );

  useEffect(() => {
    refreshStorageMetrics();
    const interval = setInterval(refreshStorageMetrics, 20000);
    return () => clearInterval(interval);
  }, [refreshStorageMetrics]);

  const detectPayloadType = (
    input: string,
    forcedBadge: SourceBadge
  ): "huggingface" | "academic_torrent" => {
    if (forcedBadge === "hf") return "huggingface";
    if (forcedBadge === "academic") return "academic_torrent";

    const clean = input.trim().toLowerCase();
    const isTorrentPattern =
      clean.startsWith("magnet:?") ||
      clean.includes("academictorrents.com") ||
      clean.endsWith(".torrent") ||
      (clean.length === 40 && /^[0-9a-f]+$/i.test(clean));

    if (isTorrentPattern) return "academic_torrent";
    return "huggingface";
  };

  const handleLocalBrowserFetch = async (targetUrl: string, detectedEngine: string) => {
    setIsSubmitting(true);
    try {
      if (detectedEngine === "huggingface") {
        showToast("Resolving Hugging Face repository metadata locally...", "info", 2000);

        const raw = targetUrl.trim();
        const isDataset = raw.includes("/datasets/");
        const cleanId = raw
          .replace("https://huggingface.co/datasets/", "")
          .replace("https://huggingface.co/", "")
          .split("/tree/")[0]
          .split("/blob/")[0]
          .trim();

        const endpoint = `https://huggingface.co/api/${isDataset ? "datasets" : "models"}/${cleanId}/tree/main?recursive=true`;

        const hfToken = process.env.NEXT_PUBLIC_HF_TOKEN || "";
        const headers: Record<string, string> = {};
        if (hfToken) {
          headers["Authorization"] = `Bearer ${hfToken}`;
        }

        const res = await fetch(endpoint, { headers });

        if (res.status === 401 || res.status === 403) {
          throw new Error("Gated access restricted. Accept model terms on Hugging Face first.");
        }

        if (!res.ok) {
          throw new Error("Repository not found or network connection refused.");
        }

        const files = await res.json();
        const fileItems = files.filter((f: any) => f.type === "file");

        if (fileItems.length === 0) {
          throw new Error("No files discovered in this repository.");
        }

        showToast(`Discovered ${fileItems.length} files. Initiating direct browser download...`, "success", 4000);

        const filesToDownload = fileItems.slice(0, 5);
        for (let idx = 0; idx < filesToDownload.length; idx++) {
          const f = filesToDownload[idx];
          setTimeout(async () => {
            const dlUrl = `https://huggingface.co/${isDataset ? "datasets/" : ""}${cleanId}/resolve/main/${f.path}`;

            try {
              if (hfToken) {
                const blobRes = await fetch(dlUrl, { headers });
                if (!blobRes.ok) throw new Error("Download token rejected");
                const blob = await blobRes.blob();
                const objectUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = objectUrl;
                a.download = f.path.split("/").pop() || "download";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(objectUrl);
              } else {
                const a = document.createElement("a");
                a.href = dlUrl;
                a.download = f.path.split("/").pop() || "download";
                a.target = "_blank";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }
            } catch {
              window.open(dlUrl, "_blank");
            }
          }, idx * 750);
        }

        if (fileItems.length > 5) {
          showToast(`Started top 5 files. Switch to Cloud Extract for the entire model archive.`, "info", 6000);
        }
      } else {
        showToast("Opening magnet link in your BitTorrent desktop client...", "info", 3000);
        window.location.href = targetUrl;
      }
    } catch (err: any) {
      showToast(`Local Fetch error: ${err.message || "Failed to download"}`, "warning", 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dispatchExtractionPayload = async (payload: {
    url: string;
    source: SourceBadge;
    mode: ExecutionMode;
  }) => {
    const targetUrl = payload.url.trim();
    if (!targetUrl) return;

    setIsSubmitting(true);
    const detectedEngine = detectPayloadType(targetUrl, payload.source);

    try {
      showToast("Dispatching task to active cloud pipeline...", "info", 2000);

      const result = await triggerExtraction({
        url: targetUrl,
        detectionMode: detectedEngine,
        pipelineMode: "cloud_extract",
      });

      const responseStatus = (result.status as string) || "";

      if (responseStatus === "success") {
        showToast(result.message || "Extraction armed! Streaming to Drive.", "success", 5000);
      } else if (responseStatus === "queued") {
        showToast(result.message || "Task queued. Waiting for local scratch slot.", "info", 5000);
      } else if (responseStatus === "ignored") {
        showToast("Worker is currently busy processing another pipeline.", "warning", 5000);
      } else {
        showToast(result.message || "Task registered with the worker engine.", "info", 4000);
      }
    } catch (err: any) {
      showToast(`Dispatch failed: ${err.message || "Network unreachable"}`, "warning", 6000);
    } finally {
      setIsSubmitting(false);
      pendingExtractionRef.current = null;
    }
  };

  const handleExtractSubmit = async (payload: {
    url: string;
    source: SourceBadge;
    mode: ExecutionMode;
  }) => {
    const targetUrl = payload.url.trim();
    if (!targetUrl) return;

    const detectedEngine = detectPayloadType(targetUrl, payload.source);

    if (payload.mode === "local") {
      await handleLocalBrowserFetch(targetUrl, detectedEngine);
      return;
    }

    if (payload.mode === "cloud" && !isOnline) {
      pendingExtractionRef.current = payload;
      setShowWakeModal(true);
      return;
    }

    await dispatchExtractionPayload(payload);
  };

  const handleConfirmWake = async () => {
    setShowWakeModal(false);
    showToast("Boot signal dispatched. Spawning Codespace container...", "info", 0);

    try {
      await wakeUpCodespace();

      let attempts = 0;
      let backendReady = false;

      while (attempts < 20) {
        await new Promise((r) => setTimeout(r, 2500));
        const alive = await checkStatus();
        if (alive) {
          backendReady = true;
          break;
        }
        attempts++;
      }

      if (backendReady) {
        showToast("Codespace is online! Tunnel established.", "success", 3000);
        if (pendingExtractionRef.current) {
          await dispatchExtractionPayload(pendingExtractionRef.current);
        }
      } else {
        showToast("Boot timed out. Check GitHub Actions workflow runs.", "warning", 6000);
        pendingExtractionRef.current = null;
      }
    } catch (err: any) {
      showToast(`Wake sequence failed: ${err.message || "Error"}`, "warning", 6000);
      pendingExtractionRef.current = null;
    }
  };

  return (
    <div className="space-y-4 md:space-y-5 pb-2 relative">
      <ServerWakeModal
        isOpen={showWakeModal}
        isBooting={isBooting}
        onClose={() => {
          setShowWakeModal(false);
          pendingExtractionRef.current = null;
        }}
        onConfirmWake={handleConfirmWake}
      />

      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0D1424] border border-[#1E2C48] text-xs shadow-2xl text-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-md">
          {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
          {toast.type === "info" && <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />}
          <span className="flex-1 leading-normal">{toast.message}</span>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="text-slate-500 hover:text-slate-300 ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Row 1: Greeting */}
      <WelcomeBanner
        userName="Saiteja"
        isOnline={isOnline}
        isBooting={isBooting}
        cluster={cluster}
        onWake={wakeUpCodespace}
      />

      {/* Row 2: KPI Metrics Cards (All values & sub-trends bound to Firestore) */}
      <MetricsRow
        metrics={snapshot.kpis}
        liveExtractedBytes={firestoreTotalBytes}
        liveBytesToday={firestoreBytesToday}
      />

      {/* Row 3: Action Center */}
      <div className="w-full">
        <ExtractionCard onExtract={handleExtractSubmit} isSubmitting={isSubmitting} />
      </div>

      {/* Row 4: Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        <AnalyticsGrid
          speedHistory={snapshot.speedHistory}
          currentSpeed={String(snapshot.kpis.avgSpeed.value)}
          bytes24h={firestoreBytes24h}
        />
        <StorageCard
          storage={{
            usedBytes: liveStorageBytes,
            totalBytes: 5 * 1024 * 1024 * 1024 * 1024,
          }}
        />
      </div>

      {/* Row 5: Operations List */}
      <div className="w-full">
        <ActiveTransfers
          tasks={snapshot.tasks}
          onPause={pauseTask}
          onResume={resumeTask}
          onCancel={cancelTask}
        />
      </div>
    </div>
  );
}