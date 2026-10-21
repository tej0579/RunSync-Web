import test from "node:test";
import assert from "node:assert/strict";

import { validateExtractionInput } from "../lib/validation.ts";
import { checkRateLimit } from "../lib/rateLimit.ts";
import { parseSpeedStringToMbps, formatBytes, parseBytesFromTaskName } from "../lib/telemetryUtils.ts";

test("Extraction Validation - Valid Hugging Face Model URL", () => {
  const result = validateExtractionInput("https://huggingface.co/openai/gpt-oss-20b");
  assert.equal(result.valid, true);
  assert.equal(result.detectedSource, "huggingface");
  assert.equal(result.isDataset, false);
  assert.equal(result.repoId, "openai/gpt-oss-20b");
  assert.equal(result.normalizedInput, "https://huggingface.co/openai/gpt-oss-20b");
});

test("Extraction Validation - Valid Hugging Face Dataset URL", () => {
  const result = validateExtractionInput("https://huggingface.co/datasets/allenai/c4/tree/main");
  assert.equal(result.valid, true);
  assert.equal(result.detectedSource, "huggingface");
  assert.equal(result.isDataset, true);
  assert.equal(result.repoId, "allenai/c4");
  assert.equal(result.normalizedInput, "https://huggingface.co/datasets/allenai/c4");
});

test("Extraction Validation - Bare Hugging Face Repo ID", () => {
  const result = validateExtractionInput("mistralai/Mistral-7B-v0.1");
  assert.equal(result.valid, true);
  assert.equal(result.detectedSource, "huggingface");
  assert.equal(result.repoId, "mistralai/Mistral-7B-v0.1");
});

test("Extraction Validation - Valid BitTorrent Magnet Link", () => {
  const magnet = "magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567&dn=Ubuntu";
  const result = validateExtractionInput(magnet);
  assert.equal(result.valid, true);
  assert.equal(result.detectedSource, "academic_torrent");
  assert.equal(result.normalizedInput, magnet);
});

test("Extraction Validation - 40-character hex infohash", () => {
  const hash = "0123456789abcdef0123456789abcdef01234567";
  const result = validateExtractionInput(hash);
  assert.equal(result.valid, true);
  assert.equal(result.detectedSource, "academic_torrent");
  assert.equal(result.normalizedInput, `magnet:?xt=urn:btih:${hash}`);
});

test("Extraction Validation - AcademicTorrents Details URL", () => {
  const url = "https://academictorrents.com/details/0123456789abcdef0123456789abcdef01234567";
  const result = validateExtractionInput(url);
  assert.equal(result.valid, true);
  assert.equal(result.detectedSource, "academic_torrent");
  assert.equal(result.normalizedInput, "magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567");
});

test("Extraction Validation - Reject Malicious / Dangerous Schemes", () => {
  const resultJs = validateExtractionInput("javascript:alert(document.cookie)");
  assert.equal(resultJs.valid, false);
  assert.match(resultJs.error, /invalid url scheme/i);

  const resultData = validateExtractionInput("data:text/html,<script>alert(1)</script>");
  assert.equal(resultData.valid, false);

  const resultFile = validateExtractionInput("file:///etc/passwd");
  assert.equal(resultFile.valid, false);
});

test("Extraction Validation - Reject Empty and Whitespace Inputs", () => {
  const emptyRes = validateExtractionInput("");
  assert.equal(emptyRes.valid, false);

  const spaceRes = validateExtractionInput("   ");
  assert.equal(spaceRes.valid, false);
});

test("Extraction Validation - Reject Excessively Long Inputs", () => {
  const hugeInput = "a".repeat(2500);
  const result = validateExtractionInput(hugeInput);
  assert.equal(result.valid, false);
  assert.match(result.error, /exceeds maximum allowed length/i);
});

test("Rate Limiter - Enforces sliding window limits", () => {
  const testKey = `test_key_${Date.now()}`;
  const options = { maxRequests: 3, windowMs: 5000 };

  // First 3 should pass
  assert.equal(checkRateLimit(testKey, options).allowed, true);
  assert.equal(checkRateLimit(testKey, options).allowed, true);
  assert.equal(checkRateLimit(testKey, options).allowed, true);

  // 4th request must be rejected
  const blocked = checkRateLimit(testKey, options);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.resetInMs > 0);
});

test("Telemetry Utilities - parseSpeedStringToMbps conversions", () => {
  assert.equal(parseSpeedStringToMbps("24.89 MB/s"), 24.89);
  assert.equal(parseSpeedStringToMbps("1.5 GB/s"), 1536);
  assert.equal(parseSpeedStringToMbps("512 KB/s"), 0.5);
  assert.equal(parseSpeedStringToMbps("idle"), 0);
  assert.equal(parseSpeedStringToMbps("offline"), 0);
  assert.equal(parseSpeedStringToMbps("finish"), 0);
  assert.equal(parseSpeedStringToMbps(undefined), 0);
});

test("Telemetry Utilities - formatBytes output", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(1024), "1 KB");
  assert.equal(formatBytes(1024 * 1024 * 1024), "1 GB");
});

test("Telemetry Utilities - parseBytesFromTaskName estimates", () => {
  assert.equal(parseBytesFromTaskName("dataset-10gb.tar"), 10 * 1024 * 1024 * 1024);
  assert.equal(parseBytesFromTaskName("archive-500mb.zip"), 500 * 1024 * 1024);
  assert.equal(parseBytesFromTaskName("unknown-file"), 0);
});
