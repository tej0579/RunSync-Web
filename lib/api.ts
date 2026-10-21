import {
  BackendEngineStatus,
  BackendHealthResponse,
  EnqueueResponse,
  EnqueueTaskRequest,
} from "@/types/api";
import { getAuthHeaders } from "@/lib/clientAuth";

const BACKEND_PROXY_URL = "/api/backend";

/**
 * Health check probe routed through Next.js proxy with authentication
 */
export async function checkBackendHealth(): Promise<BackendHealthResponse | null> {
  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${BACKEND_PROXY_URL}/health`, {
      headers: {
        ...authHeaders,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data) return null;

    return data;
  } catch {
    return null;
  }
}

/**
 * Fetch real-time engine telemetry and active streams
 */
export async function fetchBackendStatus(): Promise<BackendEngineStatus | null> {
  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${BACKEND_PROXY_URL}/status`, {
      headers: {
        ...authHeaders,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

export const getEngineTelemetry = fetchBackendStatus;

/**
 * Enqueue a torrent / magnet link
 */
export async function enqueueTorrent(magnetLink: string): Promise<EnqueueResponse> {
  const authHeaders = await getAuthHeaders();
  const formData = new FormData();
  formData.append("magnet_link", magnetLink.trim());

  const res = await fetch(`${BACKEND_PROXY_URL}/enqueue`, {
    method: "POST",
    headers: authHeaders,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      status: "error",
      message: err.message || err.error || `Enqueue failed with HTTP ${res.status}`,
    };
  }

  return await res.json();
}

/**
 * Enqueue a Hugging Face model/dataset repository
 */
export async function enqueueHuggingFace(repoId: string): Promise<EnqueueResponse> {
  const authHeaders = await getAuthHeaders();
  const formData = new FormData();
  formData.append("repo_id", repoId.trim());

  const res = await fetch(`${BACKEND_PROXY_URL}/enqueue_hf`, {
    method: "POST",
    headers: authHeaders,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      status: "error",
      message: err.message || err.error || `HF enqueue failed with HTTP ${res.status}`,
    };
  }

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
 * Task Management Commands
 * Note: The Codespace worker does not currently expose granular per-task pause/resume endpoints.
 * Returning unsupported rather than faking success, per roadmap Phase 5 specifications.
 */
export async function sendTaskAction(
  taskId: string,
  action: "pause" | "resume" | "cancel"
): Promise<{ status: "success" | "unsupported" | "error"; message?: string }> {
  if (action === "pause" || action === "resume") {
    // Truthful report: worker API does not implement per-task pause/resume
    return {
      status: "unsupported",
      message: `${action.toUpperCase()} is not currently supported by the active Codespace worker runtime.`,
    };
  }

  if (action === "cancel") {
    try {
      const authHeaders = await getAuthHeaders();
      const formData = new FormData();
      formData.append("task_id", taskId);

      const res = await fetch(`${BACKEND_PROXY_URL}/cancel`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      if (res.ok) {
        return { status: "success" };
      }
      return { status: "error", message: `Cancel returned HTTP ${res.status}` };
    } catch (err: any) {
      return { status: "error", message: err.message || "Failed to cancel task" };
    }
  }

  return { status: "unsupported", message: "Action not supported" };
}

/**
 * Dispatches GitHub Actions wake signal from Next.js server route
 */
export async function wakeCodespaceInstance(): Promise<boolean> {
  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch("/api/codespace/wake", {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}
