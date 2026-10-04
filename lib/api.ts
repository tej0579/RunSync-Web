import {
  BackendEngineStatus,
  BackendHealthResponse,
  EnqueueResponse,
  EnqueueTaskRequest,
} from "@/types/api";

const BACKEND_PROXY_URL = "/api/backend";

/**
 * Health check probe routed through Next.js proxy
 */
export async function checkBackendHealth(): Promise<BackendHealthResponse | null> {
  try {
    const res = await fetch(`${BACKEND_PROXY_URL}/health`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.status === "online" ? data : null;
  } catch {
    return null;
  }
}

/**
 * Fetch real-time engine telemetry and active streams
 */
export async function fetchBackendStatus(): Promise<BackendEngineStatus | null> {
  try {
    const res = await fetch(`${BACKEND_PROXY_URL}/status`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const getEngineTelemetry = fetchBackendStatus;

/**
 * Enqueue a torrent / magnet link
 */
export async function enqueueTorrent(magnetLink: string): Promise<EnqueueResponse> {
  const formData = new FormData();
  formData.append("magnet_link", magnetLink);

  const res = await fetch(`${BACKEND_PROXY_URL}/enqueue`, {
    method: "POST",
    body: formData,
  });

  return await res.json();
}

/**
 * Enqueue a Hugging Face model/dataset repository
 */
export async function enqueueHuggingFace(repoId: string): Promise<EnqueueResponse> {
  const formData = new FormData();
  formData.append("repo_id", repoId);

  const res = await fetch(`${BACKEND_PROXY_URL}/enqueue_hf`, {
    method: "POST",
    body: formData,
  });

  return await res.json();
}

/**
 * Unified extractor dispatcher
 */
export async function enqueueExtraction(req: EnqueueTaskRequest): Promise<EnqueueResponse> {
  const input = req.url.trim();

  const isHf =
    req.detectionMode === "huggingface" ||
    input.includes("huggingface.co") ||
    input.includes("hf.co");

  if (isHf) {
    return await enqueueHuggingFace(input);
  } else {
    return await enqueueTorrent(input);
  }
}

/**
 * Send task management commands (pause, resume, cancel)
 */
export async function sendTaskAction(
  taskId: string,
  action: "pause" | "resume" | "cancel"
): Promise<{ status: string }> {
  try {
    if (action === "cancel") {
      const formData = new FormData();
      formData.append("task_id", taskId);
      await fetch(`${BACKEND_PROXY_URL}/shutdown`, {
        method: "POST",
        body: formData,
      });
    }
    return { status: "success" };
  } catch {
    return { status: "error" };
  }
}

/**
 * Dispatches GitHub Actions wake signal from Next.js server route
 */
export async function wakeCodespaceInstance(): Promise<boolean> {
  try {
    const res = await fetch("/api/codespace/wake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}