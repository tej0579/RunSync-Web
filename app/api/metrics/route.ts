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

export async function GET() {
  try {
    const docRef = doc(db, "analytics", "dashboard");
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({
        completed_count: 135,
        total_bytes_extracted: 122514567168,
        hourly_transfers: {},
      });
    }

    return NextResponse.json(snap.data());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const bytes = Number(body.bytes) || 0;

    const docRef = doc(db, "analytics", "dashboard");
    const currentHour = new Date().getHours().toString().padStart(2, "0");

    try {
      await updateDoc(docRef, {
        completed_count: increment(1),
        total_bytes_extracted: increment(bytes),
        [`hourly_transfers.${currentHour}`]: increment(bytes),
        last_updated: serverTimestamp(),
      });
    } catch (err: any) {
      if (err.code === "not-found") {
        await setDoc(docRef, {
          completed_count: 135 + 1,
          total_bytes_extracted: 122514567168 + bytes,
          hourly_transfers: { [currentHour]: bytes },
          last_updated: serverTimestamp(),
        });
      } else {
        throw err;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}