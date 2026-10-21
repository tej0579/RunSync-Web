/**
 * Telemetry formatting and unit conversion utilities
 */

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.min(Math.max(i, 0), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeIndex)).toFixed(dm))} ${sizes[safeIndex]}`;
}

export function parseSpeedStringToMbps(speedStr: string | undefined): number {
  if (!speedStr) return 0;
  const cleaned = speedStr.trim().toLowerCase();
  if (
    cleaned.includes("finish") ||
    cleaned.includes("idle") ||
    cleaned.includes("done") ||
    cleaned.includes("offline") ||
    cleaned.includes("calculating")
  ) {
    return 0;
  }

  const numericMatch = cleaned.match(/([\d.]+)/);
  if (!numericMatch) return 0;

  const rawVal = parseFloat(numericMatch[1]);
  if (isNaN(rawVal)) return 0;

  if (cleaned.includes("gb/s") || cleaned.includes("gib/s") || cleaned.includes("gbyte/s")) {
    return rawVal * 1024;
  }
  if (cleaned.includes("mb/s") || cleaned.includes("mib/s") || cleaned.includes("mbyte/s")) {
    return rawVal;
  }
  if (cleaned.includes("kb/s") || cleaned.includes("kib/s") || cleaned.includes("kbyte/s")) {
    return rawVal / 1024;
  }
  if (cleaned.includes("b/s") || cleaned.includes("byte/s")) {
    return rawVal / (1024 * 1024);
  }
  return rawVal;
}

export function parseBytesFromTaskName(name: string): number {
  if (!name) return 0;
  const match = name.match(/(\d+(?:\.\d+)?)\s*(gb|gib|mb|mib|kb|kib)/i);
  if (!match) return 0;

  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  if (unit.startsWith("g")) return Math.round(val * 1024 * 1024 * 1024);
  if (unit.startsWith("m")) return Math.round(val * 1024 * 1024);
  if (unit.startsWith("k")) return Math.round(val * 1024);
  return 0;
}
