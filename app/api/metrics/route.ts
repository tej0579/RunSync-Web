import { NextRequest, NextResponse } from "next/server";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { verifyServerAuth } from "@/lib/serverAuth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const taskCompletionSchema = z.object({
  taskId: z.string().min(1, "taskId is required for idempotent completion recording"),
  bytes: z.number().int().nonnegative("bytes must be a non-negative integer"),
  name: z.string().optional(),
  source: z.string().optional(),
});

export async function GET(req: NextRequest) {
  // 1. Authenticate request
  const auth = await verifyServerAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const docRef = doc(db, "analytics", "dashboard");
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({
        completed_count: 0,
        total_bytes_extracted: 0,
        hourly_transfers: {},
      });
    }

    return NextResponse.json(snap.data());
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load metrics" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // 1. Authenticate and authorize operator
  const auth = await verifyServerAuth(req, { requiredRole: "operator" });
  if (!auth.authorized) {
    return auth.response;
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 2. Validate input schema with Zod
  const parseResult = taskCompletionSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation Error", details: parseResult.error.format() },
      { status: 400 }
    );
  }

  const { taskId, bytes, name, source } = parseResult.data;

  try {
    // 3. Idempotency Check: Verify task hasn't already been committed
    const taskLogRef = doc(db, "completed_tasks", taskId);
    const existingTask = await getDoc(taskLogRef);

    if (existingTask.exists()) {
      return NextResponse.json({
        success: true,
        message: "Task completion was already recorded (idempotent skip).",
        duplicate: true,
      });
    }

    // 4. Record task completion document atomically
    await setDoc(taskLogRef, {
      taskId,
      bytes,
      name: name || "Unnamed Task",
      source: source || "Cloud Stream",
      recordedBy: auth.user.email,
      completedAt: serverTimestamp(),
    });

    // 5. Update aggregate dashboard statistics
    const dashboardRef = doc(db, "analytics", "dashboard");
    const currentHour = new Date().getUTCHours().toString().padStart(2, "0");

    try {
      await updateDoc(dashboardRef, {
        completed_count: increment(1),
        total_bytes_extracted: increment(bytes),
        [`hourly_transfers.${currentHour}`]: increment(bytes),
        last_updated: serverTimestamp(),
      });
    } catch (err: any) {
      if (err.code === "not-found") {
        await setDoc(dashboardRef, {
          completed_count: 1,
          total_bytes_extracted: bytes,
          hourly_transfers: { [currentHour]: bytes },
          last_updated: serverTimestamp(),
        });
      } else {
        throw err;
      }
    }

    return NextResponse.json({ success: true, taskId, bytesRecorded: bytes });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to commit metrics record" },
      { status: 500 }
    );
  }
}
