"use client";

import { auth } from "@/lib/firebase";

/**
 * Returns the current authenticated user's Firebase ID token
 * formatted for the HTTP Authorization header.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};

  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return {
        Authorization: `Bearer ${token}`,
      };
    }
  } catch (error) {
    console.warn("[Client Auth] Failed to retrieve Firebase ID token:", error);
  }

  return {};
}

/**
 * Retrieve raw ID token string (useful for authenticated download query params)
 */
export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
  } catch {
    // Return null on failure
  }

  return null;
}
