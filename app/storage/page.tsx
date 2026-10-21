"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  HardDrive,
  Folder,
  FileText,
  DownloadCloud,
  RefreshCw,
  ExternalLink,
  Search,
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  X,
  FileCode,
  FileArchive,
  Film,
  Database,
  Binary,
  FolderTree,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import { getAuthHeaders, getAuthToken } from "@/lib/clientAuth";

interface DriveItem {
  id: string;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  modifiedFormatted: string;
  mimeType: string;
  webViewLink?: string;
  downloadUrl?: string;
  isFolder: boolean;
  children?: DriveItem[];
  isLoadingChildren?: boolean;
}

const GDRIVE_FOLDER_ID =
  process.env.NEXT_PUBLIC_GDRIVE_FOLDER_ID || "1W5rVvmzDA5hpFEH8Sd53IyLb9R-bmY9O";

function getFileIcon(name: string, mimeType: string) {
  const lower = name.toLowerCase();

  if (
    lower.endsWith(".safetensors") ||
    lower.endsWith(".bin") ||
    lower.endsWith(".pt") ||
    lower.endsWith(".pth") ||
    lower.endsWith(".onnx") ||
    lower.endsWith(".gguf")
  ) {
    return <Binary className="w-4 h-4 text-purple-400 shrink-0" />;
  }

  if (
    lower.endsWith(".parquet") ||
    lower.endsWith(".arrow") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".json") ||
    lower.endsWith(".jsonl")
  ) {
    return <Database className="w-4 h-4 text-emerald-400 shrink-0" />;
  }

  if (
    lower.endsWith(".mkv") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".avi") ||
    lower.endsWith(".mov") ||
    mimeType.startsWith("video/")
  ) {
    return <Film className="w-4 h-4 text-amber-400 shrink-0" />;
  }

  if (
    lower.endsWith(".zip") ||
    lower.endsWith(".tar") ||
    lower.endsWith(".gz") ||
    lower.endsWith(".7z") ||
    lower.endsWith(".rar")
  ) {
    return <FileArchive className="w-4 h-4 text-rose-400 shrink-0" />;
  }

  if (
    lower.endsWith(".py") ||
    lower.endsWith(".ts") ||
    lower.endsWith(".js") ||
    lower.endsWith(".sh") ||
    lower.endsWith(".yaml") ||
    lower.endsWith(".yml")
  ) {
    return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
  }

  return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
}

function DriveRow({
  item,
  depth = 0,
  expandedFolders,
  onToggleFolder,
  onDownload,
}: {
  item: DriveItem;
  depth?: number;
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (item: DriveItem) => void;
  onDownload: (item: DriveItem) => void;
}) {
  const isExpanded = !!expandedFolders[item.id];
  const paddingLeftPx = 12 + depth * 18;

  return (
    <>
      <tr
        className={`hover:bg-white/[0.03] transition-colors text-slate-200 border-b border-white/[0.05] ${
          depth > 0 ? "bg-[#060911]/50" : ""
        }`}
      >
        <td
          style={{ paddingLeft: `${paddingLeftPx}px` }}
          className="py-2.5 pr-3 flex items-center gap-2 max-w-[200px] sm:max-w-none"
        >
          {item.isFolder ? (
            <button
              onClick={() => onToggleFolder(item)}
              className="p-1 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
              title={isExpanded ? "Collapse folder" : "Expand folder"}
              aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          ) : (
            <div className="w-3.5 shrink-0" />
          )}

          {item.isFolder ? (
            <Folder
              onClick={() => onToggleFolder(item)}
              className="w-4 h-4 text-indigo-400 shrink-0 cursor-pointer"
            />
          ) : (
            getFileIcon(item.name, item.mimeType)
          )}

          <span
            onClick={() => item.isFolder && onToggleFolder(item)}
            className={`font-medium truncate text-xs ${
              item.isFolder ? "cursor-pointer hover:text-indigo-300 font-semibold" : ""
            }`}
            title={item.name}
          >
            {item.name}
          </span>
        </td>

        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px] sm:text-xs whitespace-nowrap tabular-nums">
          {item.sizeFormatted}
        </td>
        <td className="py-2.5 px-3 text-slate-400 text-[11px] sm:text-xs whitespace-nowrap">
          {item.modifiedFormatted}
        </td>
        <td className="py-2.5 px-3 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1">
            {!item.isFolder && (
              <button
                type="button"
                onClick={() => onDownload(item)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all inline-flex items-center"
                title="Direct download file via authenticated proxy"
                aria-label={`Download ${item.name}`}
              >
                <DownloadCloud className="w-3.5 h-3.5 text-slate-300 hover:text-cyan-400" />
              </button>
            )}

            {item.webViewLink && (
              <a
                href={item.webViewLink}
                target="_blank"
                rel="noreferrer noopener"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/[0.08] transition-all inline-flex items-center"
                title={
                  item.isFolder
                    ? "Open folder in Google Drive"
                    : "Preview on Google Drive"
                }
                aria-label={`Open ${item.name} in Google Drive`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </td>
      </tr>

      {isExpanded && (
        <>
          {item.isLoadingChildren ? (
            <tr className="bg-[#070b14]">
              <td
                colSpan={4}
                style={{ paddingLeft: `${paddingLeftPx + 24}px` }}
                className="py-2.5 pr-3 text-slate-400"
              >
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                  <span>Loading directory contents...</span>
                </div>
              </td>
            </tr>
          ) : !item.children || item.children.length === 0 ? (
            <tr className="bg-[#070b14]">
              <td
                colSpan={4}
                style={{ paddingLeft: `${paddingLeftPx + 24}px` }}
                className="py-2 pr-3 text-slate-400 italic text-[10px]"
              >
                (Empty folder)
              </td>
            </tr>
          ) : (
            item.children.map((child) => (
              <DriveRow
                key={child.id}
                item={child}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                onDownload={onDownload}
              />
            ))
          )}
        </>
      )}
    </>
  );
}

export default function StoragePage() {
  const [rootFiles, setRootFiles] = useState<DriveItem[]>([]);
  const [searchResults, setSearchResults] = useState<DriveItem[] | null>(null);
  const [totalDriveBytes, setTotalDriveBytes] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const TOTAL_CAPACITY_BYTES = 5 * 1024 * 1024 * 1024 * 1024; // 5 TB

  const parseItems = (rawList: any[]): DriveItem[] => {
    return rawList.map((f: any) => ({
      id: f.id,
      name: f.name,
      sizeBytes: f.sizeBytes || 0,
      sizeFormatted: f.sizeBytes > 0 ? formatBytes(f.sizeBytes) : f.isFolder ? "-" : "0 B",
      modifiedFormatted: f.modifiedTime
        ? new Date(f.modifiedTime).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "Unknown",
      mimeType: f.mimeType || "application/octet-stream",
      webViewLink: f.webViewLink,
      downloadUrl: f.downloadUrl,
      isFolder: !!f.isFolder,
      children: [],
      isLoadingChildren: false,
    }));
  };

  const fetchLiveDriveFiles = useCallback(async () => {
    try {
      setErrorMsg(null);
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/drive?folderId=${encodeURIComponent(GDRIVE_FOLDER_ID)}`,
        {
          cache: "no-store",
          headers,
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      const parsed = parseItems(data.files || []);
      setRootFiles(parsed);

      if (typeof data.totalStorageBytes === "number") {
        setTotalDriveBytes(data.totalStorageBytes);
      } else {
        setTotalDriveBytes(parsed.reduce((acc, curr) => acc + curr.sizeBytes, 0));
      }
    } catch (err: any) {
      console.error("Drive fetch error:", err);
      setErrorMsg(err.message || "Failed to load files from Google Drive");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveDriveFiles();
  }, [fetchLiveDriveFiles]);

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    let isCurrent = true;
    const controller = new AbortController();

    setIsSearching(true);
    const delayTimer = setTimeout(async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(
          `/api/drive?search=${encodeURIComponent(trimmed)}&folderId=${encodeURIComponent(
            GDRIVE_FOLDER_ID
          )}`,
          {
            cache: "no-store",
            signal: controller.signal,
            headers,
          }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();

        if (isCurrent) {
          setSearchResults(parseItems(data.files || []));
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Search query error:", err);
        }
      } finally {
        if (isCurrent) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      isCurrent = false;
      controller.abort();
      clearTimeout(delayTimer);
    };
  }, [searchTerm]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setSearchTerm("");
    setSearchResults(null);
    fetchLiveDriveFiles();
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults(null);
    setIsSearching(false);
  };

  const handleDownload = async (item: DriveItem) => {
    try {
      const token = await getAuthToken();
      const url = `/api/drive/download?fileId=${encodeURIComponent(item.id)}&name=${encodeURIComponent(
        item.name
      )}${token ? `&token=${encodeURIComponent(token)}` : ""}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const updateTreeWithChildren = (
    list: DriveItem[],
    targetId: string,
    children: DriveItem[],
    isLoading: boolean
  ): DriveItem[] => {
    return list.map((node) => {
      if (node.id === targetId) {
        return { ...node, children, isLoadingChildren: isLoading };
      }
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: updateTreeWithChildren(node.children, targetId, children, isLoading),
        };
      }
      return node;
    });
  };

  const setTreeLoading = (
    list: DriveItem[],
    targetId: string,
    isLoading: boolean
  ): DriveItem[] => {
    return list.map((node) => {
      if (node.id === targetId) {
        return { ...node, isLoadingChildren: isLoading };
      }
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: setTreeLoading(node.children, targetId, isLoading),
        };
      }
      return node;
    });
  };

  const handleToggleFolder = async (item: DriveItem) => {
    const isCurrentlyExpanded = !!expandedFolders[item.id];

    setExpandedFolders((prev) => ({
      ...prev,
      [item.id]: !isCurrentlyExpanded,
    }));

    if (!isCurrentlyExpanded && (!item.children || item.children.length === 0)) {
      const updateList = (fn: (prev: DriveItem[]) => DriveItem[]) => {
        setRootFiles((prev) => fn(prev));
        setSearchResults((prev) => (prev ? fn(prev) : null));
      };

      updateList((prev) => setTreeLoading(prev, item.id, true));

      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/drive?folderId=${encodeURIComponent(item.id)}`, {
          cache: "no-store",
          headers,
        });
        const subData = await res.json();
        const parsedChildren = parseItems(subData.files || []);

        updateList((prev) =>
          updateTreeWithChildren(prev, item.id, parsedChildren, false)
        );
      } catch {
        updateList((prev) => setTreeLoading(prev, item.id, false));
      }
    }
  };

  const usedPercentage = Math.min(
    parseFloat(((totalDriveBytes / TOTAL_CAPACITY_BYTES) * 100).toFixed(1)),
    100
  );
  const remainingBytes = Math.max(TOTAL_CAPACITY_BYTES - totalDriveBytes, 0);

  const isSearchActive = searchTerm.trim().length > 0 && searchResults !== null;
  const displayedFiles = isSearchActive ? searchResults : rootFiles;

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Header with Breadcrumbs & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 select-none">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
            <span className="text-indigo-400">RunSync Vault</span>
            <span>/</span>
            <span className="text-slate-300">RunSync-Storage</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            <span>Google Drive Storage</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Explore and download extracted models, weights, and dataset archives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 h-8 text-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-400 ${
                isRefreshing ? "animate-spin text-indigo-400" : ""
              }`}
            />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              window.open(
                GDRIVE_FOLDER_ID
                  ? `https://drive.google.com/drive/folders/${GDRIVE_FOLDER_ID}`
                  : "https://drive.google.com",
                "_blank",
                "noopener,noreferrer"
              )
            }
            className="flex items-center gap-1.5 h-8 text-xs"
          >
            <span>Open in Drive</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <div>
            <span className="font-semibold">Notice: </span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* Quota Overview (5 TB) */}
      <div className="p-4 sm:p-5 md:p-6 rounded-2xl bg-[#0c111e] border border-white/[0.08] shadow-sm space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] sm:text-xs text-slate-400 font-medium font-mono">
              Destination Vault Allocation
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-sans mt-0.5 tabular-nums">
              {formatBytes(totalDriveBytes)}{" "}
              <span className="text-xs sm:text-sm text-slate-400 font-normal font-mono">/ 5 TB</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 whitespace-nowrap">
              {usedPercentage}% Used
            </span>
          </div>
        </div>

        <Progress
          value={usedPercentage}
          height="h-2"
          indicatorColor="bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
        />

        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 text-[10px] sm:text-xs border-t border-white/[0.05]">
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#070b14] border border-white/[0.05]">
            <span className="text-slate-400 truncate block">Total Extracted</span>
            <div className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5 truncate tabular-nums">
              {formatBytes(totalDriveBytes)}
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#070b14] border border-white/[0.05]">
            <span className="text-slate-400 truncate block">Directory Items</span>
            <div className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5 truncate tabular-nums">
              {rootFiles.length} item(s)
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#070b14] border border-white/[0.05]">
            <span className="text-slate-400 truncate block">Free Pool</span>
            <div className="text-xs sm:text-sm font-semibold text-emerald-400 mt-0.5 truncate tabular-nums">
              {formatBytes(remainingBytes)}
            </div>
          </div>
        </div>
      </div>

      {/* Drive File Browser & Search */}
      <div className="p-4 sm:p-5 md:p-6 rounded-2xl bg-[#0c111e] border border-white/[0.08] shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-sm">
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin absolute left-3 top-1/2 -translate-y-1/2" />
            ) : (
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            )}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") handleClearSearch();
              }}
              placeholder="Filter across vault files & subdirectories..."
              className="w-full bg-[#070b14] border border-white/[0.08] focus:border-indigo-500/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all font-mono"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                title="Clear filter (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-[11px] sm:text-xs text-slate-400 font-mono">
            {isSearchActive
              ? `${displayedFiles.length} match(es)`
              : `${displayedFiles.length} item(s)`}
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-xl border border-white/[0.08] overflow-hidden bg-[#070b14]/50">
          {loading ? (
            <div className="py-14 flex flex-col items-center justify-center text-slate-400 space-y-2.5">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span className="text-xs font-mono">Loading Drive inventory...</span>
            </div>
          ) : displayedFiles.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {isSearchActive
                ? `No files or folders matched "${searchTerm}".`
                : "No files found in destination folder."}
            </div>
          ) : (
            <table className="w-full text-left text-xs min-w-[520px]">
              <thead className="bg-[#070b14] text-slate-400 border-b border-white/[0.08] font-mono text-[10px] sm:text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Name</th>
                  <th className="py-2.5 px-3 font-semibold">Size</th>
                  <th className="py-2.5 px-3 font-semibold">Last Modified</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {displayedFiles.map((file) => (
                  <DriveRow
                    key={file.id}
                    item={file}
                    depth={0}
                    expandedFolders={expandedFolders}
                    onToggleFolder={handleToggleFolder}
                    onDownload={handleDownload}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Responsive Touch Cards */}
        <div className="md:hidden space-y-2">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span className="text-xs font-mono">Loading inventory...</span>
            </div>
          ) : displayedFiles.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs rounded-xl bg-[#070b14] border border-white/[0.06]">
              {isSearchActive
                ? `No files matched "${searchTerm}".`
                : "No files found in destination folder."}
            </div>
          ) : (
            displayedFiles.map((file) => (
              <div
                key={file.id}
                className="p-3 rounded-xl bg-[#070b14] border border-white/[0.07] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {file.isFolder ? (
                      <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : (
                      getFileIcon(file.name, file.mimeType)
                    )}
                    <span
                      onClick={() => file.isFolder && handleToggleFolder(file)}
                      className={`text-xs font-medium text-slate-200 truncate ${
                        file.isFolder ? "cursor-pointer hover:text-indigo-300 font-semibold" : ""
                      }`}
                      title={file.name}
                    >
                      {file.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!file.isFolder && (
                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all"
                        title="Download file"
                        aria-label={`Download ${file.name}`}
                      >
                        <DownloadCloud className="w-4 h-4 text-cyan-400" />
                      </button>
                    )}
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/[0.08] transition-all"
                        title="Open in Drive"
                        aria-label={`Open ${file.name} in Drive`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-white/[0.05]">
                  <span>Size: {file.sizeFormatted}</span>
                  <span>Modified: {file.modifiedFormatted}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
