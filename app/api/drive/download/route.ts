import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import { getServerEnv } from "@/lib/env";
import { verifyServerAuth } from "@/lib/serverAuth";

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

function getDriveClient() {
  const env = getServerEnv();
  const clientEmail = env.GDRIVE_CLIENT_EMAIL;
  const rawKey = env.GDRIVE_PRIVATE_KEY;

  if (!clientEmail || !rawKey) {
    throw new Error("Google Drive credentials not configured.");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: cleanPrivateKey(rawKey),
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
}

export async function GET(req: NextRequest) {
  // 1. Authenticate request (supports Authorization header or ?token query param)
  const auth = await verifyServerAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId || typeof fileId !== "string" || fileId.length < 5) {
      return NextResponse.json({ error: "Missing or invalid fileId parameter" }, { status: 400 });
    }

    const env = getServerEnv();
    const rootFolderId = env.GDRIVE_FOLDER_ID;
    const drive = getDriveClient();

    // 2. Fetch metadata to inspect parents and MIME type
    const metadata = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, parents, trashed",
      supportsAllDrives: true,
    });

    if (!metadata.data || metadata.data.trashed) {
      return NextResponse.json({ error: "File not found or was moved to trash" }, { status: 404 });
    }

    // 3. Prevent unauthorized traversal outside root folder
    if (rootFolderId) {
      const parents = metadata.data.parents || [];
      // Fast check: direct parent or ancestor
      if (parents.length > 0 && !parents.includes(rootFolderId)) {
        // Check ancestor chain
        let isChild = false;
        let queue = [...parents];
        const visited = new Set<string>();

        while (queue.length > 0 && !isChild) {
          const pid = queue.shift()!;
          if (pid === rootFolderId) {
            isChild = true;
            break;
          }
          if (visited.has(pid)) continue;
          visited.add(pid);

          try {
            const pMeta = await drive.files.get({
              fileId: pid,
              fields: "parents",
              supportsAllDrives: true,
            });
            if (pMeta.data.parents) queue.push(...pMeta.data.parents);
          } catch {
            // Stop traversal if ancestor cannot be read
          }
        }

        if (!isChild) {
          return NextResponse.json(
            { error: "Forbidden: File is outside the authorized storage tree" },
            { status: 403 }
          );
        }
      }
    }

    // 4. Download media stream
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
    headers.set("Cache-Control", "private, no-store, max-age=0");

    if (metadata.data.size) {
      headers.set("Content-Length", metadata.data.size);
    }

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
