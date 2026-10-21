import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { verifyServerAuth } from "@/lib/serverAuth";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Strict allowlist of supported worker endpoint paths and their permitted HTTP methods
const ALLOWED_ENDPOINTS: Record<string, string[]> = {
  health: ["GET"],
  status: ["GET"],
  enqueue: ["POST"],
  enqueue_hf: ["POST"],
  shutdown: ["POST"],
  pause: ["POST"],
  resume: ["POST"],
  cancel: ["POST"],
};

function getCleanEndpoint(rawSegments: string[]): string {
  let segments = [...rawSegments];
  if (segments[0] === "api" && segments[1] === "v1") {
    segments = segments.slice(2);
  } else if (segments[0] === "api") {
    segments = segments.slice(1);
  }
  return segments.join("/").toLowerCase();
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  // 1. Enforce Server-Side Authentication
  const auth = await verifyServerAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  const { path } = await context.params;
  const endpoint = getCleanEndpoint(path);

  // 2. Route Allowlist Validation
  if (!ALLOWED_ENDPOINTS[endpoint]) {
    return NextResponse.json(
      { error: `Endpoint '/${endpoint}' is not recognized or supported by worker gateway.` },
      { status: 404 }
    );
  }

  if (!ALLOWED_ENDPOINTS[endpoint].includes("GET")) {
    return NextResponse.json(
      { error: `Method GET is not permitted for '/${endpoint}'.` },
      { status: 405, headers: { Allow: ALLOWED_ENDPOINTS[endpoint].join(", ") } }
    );
  }

  // 3. Resolve Target Worker URL
  const env = getServerEnv();
  const backendBase = env.BACKEND_URL?.replace(/\/+$/, "");

  if (!backendBase) {
    return NextResponse.json(
      { error: "Configuration Error: BACKEND_URL is not set on the server." },
      { status: 503 }
    );
  }

  const search = req.nextUrl.search || "";
  const targetUrl = `${backendBase}/api/v1/${endpoint}${search}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      // If the upstream tunnel is offline or in powersave (common when Codespace is in standby),
      // return a truthful standby health telemetry state rather than throwing 502 errors.
      if (endpoint === "health") {
        return NextResponse.json({
          status: "standby",
          isOnline: false,
          cluster: "Codespace • US-West",
          message: "Codespace worker is currently in standby mode.",
        });
      }
      if (endpoint === "status") {
        return NextResponse.json({
          status: "standby",
          isOnline: false,
          active_tasks: [],
          queue_length: 0,
          speed_mbps: 0,
          uptime_seconds: 0,
        });
      }

      return NextResponse.json(
        {
          status: "unavailable",
          message: `Worker returned HTTP ${res.status}`,
          upstreamStatus: res.status,
        },
        { status: 502 }
      );
    }

    const data = await res.json().catch(() => null);
    if (!data) {
      if (endpoint === "health") {
        return NextResponse.json({
          status: "standby",
          isOnline: false,
          cluster: "Codespace • US-West",
          message: "Codespace worker is in standby mode.",
        });
      }
      return NextResponse.json(
        { status: "degraded", message: "Worker returned invalid non-JSON payload" },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    if (endpoint === "health") {
      return NextResponse.json({
        status: "standby",
        isOnline: false,
        cluster: "Codespace • US-West",
        message: "Codespace worker is currently in standby mode.",
      });
    }
    if (endpoint === "status") {
      return NextResponse.json({
        status: "standby",
        isOnline: false,
        active_tasks: [],
        queue_length: 0,
        speed_mbps: 0,
        uptime_seconds: 0,
      });
    }

    const isTimeout = error.name === "AbortError";
    return NextResponse.json(
      {
        status: "offline",
        message: isTimeout ? "Connection to remote worker timed out" : "Unable to reach remote worker tunnel",
        isTimeout,
      },
      { status: 504 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  // 1. Enforce Server-Side Authentication
  const auth = await verifyServerAuth(req, { requiredRole: "operator" });
  if (!auth.authorized) {
    return auth.response;
  }

  const { path } = await context.params;
  const endpoint = getCleanEndpoint(path);

  // 2. Route Allowlist Validation
  if (!ALLOWED_ENDPOINTS[endpoint]) {
    return NextResponse.json(
      { error: `Endpoint '/${endpoint}' is not recognized or supported by worker gateway.` },
      { status: 404 }
    );
  }

  if (!ALLOWED_ENDPOINTS[endpoint].includes("POST")) {
    return NextResponse.json(
      { error: `Method POST is not permitted for '/${endpoint}'.` },
      { status: 405, headers: { Allow: ALLOWED_ENDPOINTS[endpoint].join(", ") } }
    );
  }

  // 3. Rate Limit Enqueue and Action Commands
  const rateLimitKey = `worker:${auth.user.uid}:${endpoint}`;
  const rateLimit = checkRateLimit(rateLimitKey, {
    windowMs: 60 * 1000,
    maxRequests: endpoint.startsWith("enqueue") ? 20 : 10,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: `Rate limit exceeded for '/${endpoint}'. Please slow down.`,
        retryAfterMs: rateLimit.resetInMs,
      },
      { status: 429 }
    );
  }

  // 4. Resolve Target Worker URL
  const env = getServerEnv();
  const backendBase = env.BACKEND_URL?.replace(/\/+$/, "");

  if (!backendBase) {
    return NextResponse.json(
      { error: "Configuration Error: BACKEND_URL is not set on the server." },
      { status: 503 }
    );
  }

  const search = req.nextUrl.search || "";
  const targetUrl = `${backendBase}/api/v1/${endpoint}${search}`;

  const contentType = req.headers.get("content-type") || "";
  const headers: Record<string, string> = {
    "ngrok-skip-browser-warning": "69420",
    Accept: "application/json",
  };

  let bodyPayload: any;

  try {
    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      bodyPayload = await req.formData();
    } else if (contentType.includes("application/json")) {
      const rawText = await req.text();
      // Enforce max body size 2MB
      if (rawText.length > 2 * 1024 * 1024) {
        return NextResponse.json({ error: "Payload Too Large (Max 2MB)" }, { status: 413 });
      }
      bodyPayload = rawText;
      headers["Content-Type"] = "application/json";
    } else {
      bodyPayload = await req.text();
    }
  } catch {
    return NextResponse.json({ error: "Invalid request payload format" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: bodyPayload,
      signal: controller.signal,
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    const isTimeout = error.name === "AbortError";
    return NextResponse.json(
      {
        status: "error",
        message: isTimeout ? "Worker request timed out" : "Failed to communicate with remote Codespace worker",
        isTimeout,
      },
      { status: 504 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
