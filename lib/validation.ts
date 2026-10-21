/**
 * RunSync Input Validation & Normalization Library
 * Validates extraction inputs (Hugging Face URLs/IDs, AcademicTorrents, Magnets, Infohashes)
 * Prevents invalid/malicious payloads from reaching server endpoints or client fetchers.
 */

export type DetectedSource = "huggingface" | "academic_torrent";

export interface ExtractionValidationResult {
  valid: boolean;
  error?: string;
  detectedSource?: DetectedSource;
  normalizedInput?: string;
  isDataset?: boolean;
  repoId?: string;
}

export function validateExtractionInput(
  raw: string,
  forcedBadge?: "auto" | "hf" | "academic"
): ExtractionValidationResult {
  if (!raw || typeof raw !== "string") {
    return { valid: false, error: "Input cannot be empty." };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Input cannot be empty." };
  }

  if (trimmed.length > 2048) {
    return {
      valid: false,
      error: "Input exceeds maximum allowed length of 2048 characters.",
    };
  }

  // Reject malicious/dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:")
  ) {
    return { valid: false, error: "Invalid URL scheme." };
  }

  // 1. Magnet link check
  if (lower.startsWith("magnet:?")) {
    if (!lower.includes("xt=urn:btih:")) {
      return {
        valid: false,
        error: "Magnet link must contain a valid BitTorrent infohash (xt=urn:btih:).",
      };
    }
    return {
      valid: true,
      detectedSource: "academic_torrent",
      normalizedInput: trimmed,
    };
  }

  // 2. Infohash (40-char hex string or 32-char base32 string)
  if (/^[0-9a-fA-F]{40}$/.test(trimmed)) {
    return {
      valid: true,
      detectedSource: "academic_torrent",
      normalizedInput: `magnet:?xt=urn:btih:${trimmed}`,
    };
  }
  if (/^[2-7a-zA-Z]{32}$/.test(trimmed)) {
    return {
      valid: true,
      detectedSource: "academic_torrent",
      normalizedInput: `magnet:?xt=urn:btih:${trimmed}`,
    };
  }

  // 3. Academic Torrents URL
  if (lower.includes("academictorrents.com")) {
    const match = trimmed.match(/\/details\/([0-9a-fA-F]{40})/i);
    if (match) {
      return {
        valid: true,
        detectedSource: "academic_torrent",
        normalizedInput: `magnet:?xt=urn:btih:${match[1]}`,
      };
    }
    return {
      valid: true,
      detectedSource: "academic_torrent",
      normalizedInput: trimmed,
    };
  }

  // 4. Direct .torrent URL
  if (lower.endsWith(".torrent") || lower.includes(".torrent?")) {
    if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
      return {
        valid: false,
        error: "Torrent URL must begin with https:// or http://.",
      };
    }
    return {
      valid: true,
      detectedSource: "academic_torrent",
      normalizedInput: trimmed,
    };
  }

  // If user explicitly forced academic torrents but didn't supply a valid torrent format:
  if (forcedBadge === "academic") {
    return {
      valid: false,
      error: "Input is not a recognized magnet link, infohash, or .torrent URL.",
    };
  }

  // 5. Hugging Face repository validation
  const isDataset =
    lower.includes("/datasets/") ||
    lower.startsWith("datasets/") ||
    (forcedBadge === "hf" && lower.startsWith("datasets/"));

  let cleanId = trimmed;

  if (lower.startsWith("https://huggingface.co/") || lower.startsWith("http://huggingface.co/")) {
    cleanId = trimmed
      .replace(/^https?:\/\/huggingface\.co\/(datasets\/)?/, "")
      .split("/tree/")[0]
      .split("/blob/")[0]
      .split("/resolve/")[0]
      .trim();
  } else if (lower.startsWith("hf.co/")) {
    cleanId = trimmed
      .replace(/^hf\.co\/(datasets\/)?/, "")
      .split("/tree/")[0]
      .split("/blob/")[0]
      .trim();
  }

  // Remove trailing slashes
  cleanId = cleanId.replace(/\/+$/, "");

  // Hugging Face model/dataset repos must follow [namespace]/[model_name]
  const repoRegex = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
  if (!repoRegex.test(cleanId)) {
    return {
      valid: false,
      error:
        "Please enter a valid Hugging Face repository (e.g. 'org/model-name' or full URL) or a BitTorrent magnet link.",
    };
  }

  return {
    valid: true,
    detectedSource: "huggingface",
    normalizedInput: isDataset
      ? `https://huggingface.co/datasets/${cleanId}`
      : `https://huggingface.co/${cleanId}`,
    isDataset,
    repoId: cleanId,
  };
}
