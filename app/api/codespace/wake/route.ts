import { NextRequest, NextResponse } from "next/server";
import { triggerCodespaceWorkflow } from "@/lib/github";
import { verifyServerAuth } from "@/lib/serverAuth";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. Enforce Server-Side Authentication & Authorization
  const auth = await verifyServerAuth(req, { requiredRole: "operator" });
  if (!auth.authorized) {
    return auth.response;
  }

  // 2. Enforce Rate Limiting & Cooldown (Max 2 wake attempts per 60 seconds)
  const clientIdentifier = `wake:${auth.user.uid || req.headers.get("x-forwarded-for") || "unknown"}`;
  const rateLimit = checkRateLimit(clientIdentifier, {
    windowMs: 60 * 1000,
    maxRequests: 2,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: "Codespace wake is on cooldown. Please wait before triggering another wake sequence.",
        retryAfterMs: rateLimit.resetInMs,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimit.resetInMs / 1000)),
        },
      }
    );
  }

  // 3. Dispatch GitHub Actions Workflow
  try {
    const result = await triggerCodespaceWorkflow();

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Failed to trigger wake workflow" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      status: "dispatched",
      message: result.message,
      actor: auth.user.email,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to initiate Codespace wake sequence" },
      { status: 500 }
    );
  }
}
