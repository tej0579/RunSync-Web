import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
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
  const privateKey = cleanPrivateKey(env.GDRIVE_PRIVATE_KEY);

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google Drive credentials in environment (GDRIVE_CLIENT_EMAIL / GDRIVE_PRIVATE_KEY)");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
}

// In-memory cache for Drive file listing to avoid quota exhaustion from rapid polling
interface DriveCache {
  data: any;
  timestamp: number;
}
const cacheStore = new Map<string, DriveCache>();
const CACHE_TTL_MS = 15000; // 15 seconds cache

export async function GET(req: NextRequest) {
  // 1. Authenticate caller
  const auth = await verifyServerAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const env = getServerEnv();
    const rootFolderId = env.GDRIVE_FOLDER_ID;

    if (!rootFolderId) {
      return NextResponse.json(
        { error: "Configuration Error: GDRIVE_FOLDER_ID is not configured." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedFolderId = searchParams.get("folderId") || rootFolderId;
    const search = searchParams.get("search");

    const cacheKey = `drive:${requestedFolderId}:${search || ""}`;
    const cached = cacheStore.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const drive = getDriveClient();

    // 2. Fetch files with full pagination
    let allFiles: any[] = [];
    let pageToken: string | undefined = undefined;
    let pageCount = 0;
    const maxPages = 5; // Safety cap at 5,000 items

    do {
      const listResponse: any = await drive.files.list({
        q: "trashed = false",
        fields: "nextPageToken, files(id, name, mimeType, size, parents, modifiedTime, webViewLink, iconLink)",
        pageSize: 1000,
        pageToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      if (listResponse.data.files) {
        allFiles.push(...listResponse.data.files);
      }
      pageToken = listResponse.data.nextPageToken || undefined;
      pageCount++;
    } while (pageToken && pageCount < maxPages);

    // 3. Build ancestor and parent map to enforce root folder boundary
    const parentMap = new Map<string, string[]>();
    for (const item of allFiles) {
      if (item.id && item.parents) {
        parentMap.set(item.id, item.parents);
      }
    }

    // Helper to verify if an item belongs under rootFolderId
    const isDescendantOfRoot = (itemId: string): boolean => {
      if (itemId === rootFolderId) return true;
      const visited = new Set<string>();
      let queue = parentMap.get(itemId) ? [...(parentMap.get(itemId) || [])] : [];

      while (queue.length > 0) {
        const parentId = queue.shift()!;
        if (parentId === rootFolderId) return true;
        if (visited.has(parentId)) continue;
        visited.add(parentId);
        const grandparents = parentMap.get(parentId);
        if (grandparents) queue.push(...grandparents);
      }
      return false;
    };

    // Verify requested folder belongs to authorized root tree
    if (requestedFolderId !== rootFolderId && !isDescendantOfRoot(requestedFolderId)) {
      return NextResponse.json(
        { error: "Forbidden: Requested folder is outside the authorized storage tree." },
        { status: 403 }
      );
    }

    // 4. Calculate real sizes and rolling time window totals
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    const startOfTodayMs = new Date().setUTCHours(0, 0, 0, 0);

    let bytes24h = 0;
    let bytesToday = 0;
    let totalStorageBytes = 0;
    const folderSizeMap = new Map<string, number>();

    for (const item of allFiles) {
      // Only account for files within the authorized root scope
      if (!isDescendantOfRoot(item.id || "")) continue;

      const isFolder = item.mimeType === "application/vnd.google-apps.folder";
      if (!isFolder && item.size) {
        const bytes = parseInt(item.size, 10) || 0;
        totalStorageBytes += bytes;

        const modTime = item.modifiedTime ? new Date(item.modifiedTime).getTime() : 0;
        if (modTime >= twentyFourHoursAgo) bytes24h += bytes;
        if (modTime >= startOfTodayMs) bytesToday += bytes;

        // Bubble up bytes to ancestor folders
        let queue = item.parents ? [...item.parents] : [];
        const visited = new Set<string>();

        while (queue.length > 0) {
          const parentId = queue.shift()!;
          if (visited.has(parentId)) continue;
          visited.add(parentId);

          folderSizeMap.set(parentId, (folderSizeMap.get(parentId) || 0) + bytes);
          const grandparents = parentMap.get(parentId);
          if (grandparents) queue.push(...grandparents);
        }
      }
    }

    // 5. Filter items for display
    let displayItems: any[] = [];
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      displayItems = allFiles.filter(
        (item) => isDescendantOfRoot(item.id || "") && (item.name || "").toLowerCase().includes(term)
      );
    } else {
      displayItems = allFiles.filter(
        (item) => item.parents && item.parents.includes(requestedFolderId)
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

    const folderStorage = folderSizeMap.get(requestedFolderId);
    const directChildrenCount = displayItems.length;

    const responsePayload = {
      success: true,
      folderId: requestedFolderId,
      totalStorageBytes: typeof folderStorage === "number" ? folderStorage : totalStorageBytes,
      bytes24h,
      bytesToday,
      totalCompletedCount: directChildrenCount,
      files,
    };

    cacheStore.set(cacheKey, { data: responsePayload, timestamp: Date.now() });
    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error("[Drive API Error]", error);
    return NextResponse.json(
      { error: "Failed to query Google Drive API" },
      { status: 500 }
    );
  }
}
