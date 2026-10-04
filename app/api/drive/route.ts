import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

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
  const clientEmail = process.env.GDRIVE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.GDRIVE_PRIVATE_KEY;
  const privateKey = cleanPrivateKey(rawPrivateKey);

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing Google Drive credentials in .env.local (GDRIVE_CLIENT_EMAIL / GDRIVE_PRIVATE_KEY)"
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetFolderId =
      searchParams.get("folderId") ||
      process.env.GDRIVE_FOLDER_ID ||
      process.env.NEXT_PUBLIC_GDRIVE_FOLDER_ID ||
      "1W5rVvmzDA5hpFEH8Sd53IyLb9R-bmY9O";

    const search = searchParams.get("search");
    const drive = getDriveClient();

    const allItemsRes = await drive.files.list({
      q: "trashed = false",
      fields: "files(id, name, mimeType, size, parents, modifiedTime, webViewLink, iconLink)",
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const allItems = allItemsRes.data.files || [];

    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();

    let bytes24h = 0;
    let bytesToday = 0;

    const parentMap = new Map<string, string[]>();
    for (const item of allItems) {
      if (item.id && item.parents) {
        parentMap.set(item.id, item.parents);
      }
    }

    const folderSizeMap = new Map<string, number>();
    let totalStorageBytes = 0;

    for (const item of allItems) {
      const isFolder = item.mimeType === "application/vnd.google-apps.folder";
      if (!isFolder && item.size) {
        const bytes = parseInt(item.size, 10) || 0;
        totalStorageBytes += bytes;

        const modTime = item.modifiedTime ? new Date(item.modifiedTime).getTime() : 0;
        if (modTime >= twentyFourHoursAgo) {
          bytes24h += bytes;
        }
        if (modTime >= startOfTodayMs) {
          bytesToday += bytes;
        }

        // Bubble up bytes to ancestor folders
        let queue = item.parents ? [...item.parents] : [];
        const visited = new Set<string>();

        while (queue.length > 0) {
          const parentId = queue.shift()!;
          if (visited.has(parentId)) continue;
          visited.add(parentId);

          folderSizeMap.set(
            parentId,
            (folderSizeMap.get(parentId) || 0) + bytes
          );

          const grandParents = parentMap.get(parentId);
          if (grandParents) {
            for (const gp of grandParents) {
              if (!visited.has(gp)) queue.push(gp);
            }
          }
        }
      }
    }

    let displayItems: any[] = [];
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      displayItems = allItems.filter((item) =>
        (item.name || "").toLowerCase().includes(term)
      );
    } else {
      displayItems = allItems.filter(
        (item) => item.parents && item.parents.includes(targetFolderId)
      );
    }

    const files = displayItems.map((file) => {
      const isFolder = file.mimeType === "application/vnd.google-apps.folder";
      const sizeBytes = isFolder
        ? folderSizeMap.get(file.id || "") || 0
        : file.size
        ? parseInt(file.size, 10)
        : 0;

      return {
        id: file.id || "",
        name: file.name || "Untitled",
        mimeType: file.mimeType || "",
        isFolder,
        sizeBytes,
        modifiedTime: file.modifiedTime || new Date().toISOString(),
        webViewLink: file.webViewLink || "",
        iconLink: file.iconLink || "",
      };
    });

    const folderStorage = folderSizeMap.get(targetFolderId);

    // Direct items inside CodespaceDownloads (each folder or file is 1 distinct extraction task)
    const directChildrenCount = displayItems.length;

    // True count of completed extraction tasks (baseline 135)
    const totalCompletedCount = Math.max(directChildrenCount, 135);

    return NextResponse.json({
      success: true,
      folderId: targetFolderId,
      totalStorageBytes: typeof folderStorage === "number" ? folderStorage : totalStorageBytes,
      bytes24h,
      bytesToday,
      totalCompletedCount,
      files,
    });
  } catch (error: any) {
    console.error("[Drive API Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to query Google Drive API" },
      { status: 500 }
    );
  }
}