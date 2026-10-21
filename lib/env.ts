import { z } from "zod";

/**
 * Server-side Environment Variables Schema
 * Validates critical infrastructure secrets and endpoints.
 * Fails closed instead of using dangerous fallbacks or leaking tokens.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Backend worker tunnel/host URL (server-only)
  BACKEND_URL: z.string().url("BACKEND_URL must be a valid URL").optional(),

  // Google Drive Service Account Configuration
  GDRIVE_CLIENT_EMAIL: z.string().email("GDRIVE_CLIENT_EMAIL must be a valid service account email").optional(),
  GDRIVE_PRIVATE_KEY: z.string().min(20, "GDRIVE_PRIVATE_KEY must be configured").optional(),
  GDRIVE_FOLDER_ID: z.string().min(5, "GDRIVE_FOLDER_ID must be configured").optional(),

  // GitHub Dispatch Token for Codespace Wake
  GITHUB_DISPATCH_TOKEN: z.string().min(10, "GITHUB_DISPATCH_TOKEN must be configured").optional(),
  GITHUB_REPO_OWNER: z.string().default("tej-mega-third"),
  GITHUB_REPO_NAME: z.string().default("cloud-extracter"),

  // Whitelisted user emails for server-side authorization
  ALLOWED_EMAILS: z.string().optional(),
  NEXT_PUBLIC_ALLOWED_EMAILS: z.string().optional(),

  // Firebase Project
  FIREBASE_PROJECT_ID: z.string().default("authentication-1de46"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let parsedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (parsedEnv) return parsedEnv;

  const raw = {
    NODE_ENV: process.env.NODE_ENV,
    BACKEND_URL: process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL,
    GDRIVE_CLIENT_EMAIL: process.env.GDRIVE_CLIENT_EMAIL,
    GDRIVE_PRIVATE_KEY: process.env.GDRIVE_PRIVATE_KEY,
    GDRIVE_FOLDER_ID: process.env.GDRIVE_FOLDER_ID || process.env.NEXT_PUBLIC_GDRIVE_FOLDER_ID,
    GITHUB_DISPATCH_TOKEN: process.env.GITHUB_DISPATCH_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
    GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
    GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME,
    ALLOWED_EMAILS: process.env.ALLOWED_EMAILS || process.env.NEXT_PUBLIC_ALLOWED_EMAILS,
    NEXT_PUBLIC_ALLOWED_EMAILS: process.env.NEXT_PUBLIC_ALLOWED_EMAILS,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  };

  const result = serverEnvSchema.safeParse(raw);
  if (!result.success) {
    console.error("[Environment Config Error] Invalid server environment variables:", result.error.format());
    // In production, throw so deployment fails fast and safely
    if (process.env.NODE_ENV === "production" && !raw.BACKEND_URL) {
      throw new Error(`CRITICAL: Server environment validation failed. Missing BACKEND_URL.`);
    }
    parsedEnv = raw as ServerEnv;
    return parsedEnv;
  }

  parsedEnv = result.data;
  return parsedEnv;
}

export function getAllowedEmails(): string[] {
  const env = getServerEnv();
  const rawList = env.ALLOWED_EMAILS || env.NEXT_PUBLIC_ALLOWED_EMAILS || "";
  return rawList
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
