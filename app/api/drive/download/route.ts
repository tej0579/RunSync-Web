import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

function cleanPrivateKey(key?: string): string {
  if (!key) return "";
  let cleaned = key.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.replace(/\\n/g, "\n").replace(/\r/g, "").trim();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId parameter" }, { status: 400 });
    }

    const clientEmail = process.env.GDRIVE_CLIENT_EMAIL;
    const rawKey = process.env.GDRIVE_PRIVATE_KEY;

    if (!clientEmail || !rawKey) {
      return NextResponse.json(
        { error: "Google Drive service credentials not configured" },
        { status: 500 }
      );
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: cleanPrivateKey(rawKey),
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    const drive = google.drive({ version: "v3", auth });

    // Fetch file metadata for content type and accurate size
    const metadata = await drive.files.get({
      fileId,
      fields: "name, mimeType, size",
      supportsAllDrives: true,
    });

    const driveRes = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "stream" }
    );

    const headers = new Headers();
    const fileName = metadata.data.name || "download";
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    headers.set(
      "Content-Type",
      metadata.data.mimeType || "application/octet-stream"
    );

    if (metadata.data.size) {
      headers.set("Content-Length", metadata.data.size);
    }

    // Convert Node.js Readable stream into standard Web ReadableStream
    const webStream = Readable.toWeb(driveRes.data as unknown as Readable);

    return new Response(webStream as BodyInit, { headers });
  } catch (error: any) {
    console.error("[Drive Download Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to download file from Google Drive" },
      { status: 500 }
    );
  }
}