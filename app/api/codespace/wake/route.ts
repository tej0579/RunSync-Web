import { NextResponse } from "next/server";
import { triggerCodespaceWorkflow } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function POST() {
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
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to initiate Codespace wake sequence" },
      { status: 500 }
    );
  }
}