import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NGROK_BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://worrier-verbose-blustery.ngrok-free.dev";

function buildTargetUrl(rawPath: string[], search: string): string {
  // Prevent duplicate /api/v1 prefix if already supplied
  let cleanSegments = [...rawPath];
  if (cleanSegments[0] === "api" && cleanSegments[1] === "v1") {
    cleanSegments = cleanSegments.slice(2);
  }
  const cleanPath = cleanSegments.join("/");
  return `${NGROK_BACKEND_URL}/api/v1/${cleanPath}${search}`;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const search = req.nextUrl.search || "";
  const targetUrl = buildTargetUrl(path, search);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "ngrok-skip-browser-warning": "69420",
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { status: "standby", message: `Remote worker returned HTTP ${res.status}` },
        { status: 200 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Return clean fallback so Next.js frontend state remains smooth
    return NextResponse.json(
      { status: "standby", cluster: "Codespace • Standby" },
      { status: 200 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const search = req.nextUrl.search || "";
  const targetUrl = buildTargetUrl(path, search);

  try {
    const contentType = req.headers.get("content-type") || "";
    const headers: Record<string, string> = {
      "ngrok-skip-browser-warning": "69420",
    };

    let bodyPayload: any;

    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      // Fetch automatically calculates multipart boundary when given FormData
      bodyPayload = await req.formData();
    } else if (contentType.includes("application/json")) {
      bodyPayload = await req.text();
      headers["Content-Type"] = "application/json";
    } else {
      bodyPayload = await req.text();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: bodyPayload,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        message: err.message || "Failed to reach remote Codespace engine",
      },
      { status: 502 }
    );
  }
}