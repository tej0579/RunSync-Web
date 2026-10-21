import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { getServerEnv, getAllowedEmails } from "@/lib/env";

export type UserRole = "admin" | "operator" | "viewer";

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: UserRole;
}

export type AuthResult =
  | { authenticated: true; authorized: true; user: AuthenticatedUser }
  | { authenticated: false; authorized: false; response: NextResponse }
  | { authenticated: true; authorized: false; response: NextResponse };

// Google's public JWKS for Firebase Auth token verification (cached automatically by jose)
const FIREBASE_JWKS_URL = new URL(
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
);
let googleJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;

function getGoogleJWKS() {
  if (!googleJWKS) {
    googleJWKS = createRemoteJWKSet(FIREBASE_JWKS_URL);
  }
  return googleJWKS;
}

/**
 * Server-side Authentication & Authorization Verifier
 * Verifies the incoming Firebase ID token against Google's public keys.
 * Enforces email whitelist and role requirements using standard, lightweight JOSE.
 */
export async function verifyServerAuth(
  req: NextRequest,
  options?: {
    requiredRole?: UserRole;
  }
): Promise<AuthResult> {
  const env = getServerEnv();
  const isDevOrTest = env.NODE_ENV === "development" || env.NODE_ENV === "test";

  // 1. Extract Bearer token from Authorization header or __session cookie
  let token: string | null = null;
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else {
    token = req.cookies.get("__session")?.value || null;
  }

  // Allow test header strictly in development/test mode for automated tests
  if (isDevOrTest && !token && req.headers.get("x-test-auth-email")) {
    const testEmail = (req.headers.get("x-test-auth-email") || "").toLowerCase();
    const allowed = getAllowedEmails();
    if (allowed.length === 0 || allowed.includes(testEmail)) {
      return {
        authenticated: true,
        authorized: true,
        user: { uid: "test-user-id", email: testEmail, role: "admin" },
      };
    } else {
      return {
        authenticated: true,
        authorized: false,
        response: NextResponse.json(
          { error: "Forbidden: User is not authorized to access this resource" },
          { status: 403 }
        ),
      };
    }
  }

  if (!token) {
    return {
      authenticated: false,
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized: Missing authentication token" },
        { status: 401 }
      ),
    };
  }

  try {
    const projectId = env.FIREBASE_PROJECT_ID || "authentication-1de46";
    const jwks = getGoogleJWKS();
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    const uid = typeof payload.sub === "string" ? payload.sub : "";

    if (!email) {
      return {
        authenticated: false,
        authorized: false,
        response: NextResponse.json(
          { error: "Unauthorized: Token contains no verified email" },
          { status: 401 }
        ),
      };
    }

    // 2. Check Allowed Emails Whitelist
    const allowedEmails = getAllowedEmails();
    const isAllowed = allowedEmails.length === 0 || allowedEmails.includes(email);

    if (!isAllowed) {
      return {
        authenticated: true,
        authorized: false,
        response: NextResponse.json(
          { error: "Forbidden: Your account is not authorized to access RunSync" },
          { status: 403 }
        ),
      };
    }

    // First email in list is admin, others are operators
    const role: UserRole =
      allowedEmails.length > 0 && allowedEmails[0] === email ? "admin" : "operator";

    if (options?.requiredRole === "admin" && role !== "admin") {
      return {
        authenticated: true,
        authorized: false,
        response: NextResponse.json(
          { error: "Forbidden: Administrator privileges required for this action" },
          { status: 403 }
        ),
      };
    }

    return {
      authenticated: true,
      authorized: true,
      user: {
        uid,
        email,
        role,
      },
    };
  } catch (error: any) {
    console.warn("[Server Auth] Token verification rejected:", error?.message || error);
    return {
      authenticated: false,
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized: Invalid or expired authentication token" },
        { status: 401 }
      ),
    };
  }
}
