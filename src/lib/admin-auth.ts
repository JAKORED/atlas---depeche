/**
 * Secure admin auth — signed session tokens using HMAC-SHA256.
 * Uses Web Crypto API (available in both Node.js and Edge runtimes).
 * No users table — single admin from env vars (ADMIN_USER / ADMIN_PASSWORD_HASH).
 * 
 * Session format: `v1:<epoch>:<hmac-sig>`
 * - v1: algorithm version
 * - <epoch>: Unix timestamp in milliseconds (expiration)
 * - <hmac-sig>: HMAC-SHA256 signature over the prefix
 */
const SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const SESSION_VERSION = "v1";

export const COOKIE_NAME = SESSION_COOKIE;
export const COOKIE_MAX_AGE = SESSION_MAX_AGE;

// Secret key retrieval (lazy to allow build-time evaluation without requiring runtime secrets)
function getAdminSecret(): string {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "ADMIN_SECRET_KEY is required. Set it via environment variable."
    );
  }
  return secret;
}

/**
 * SHA-256 hash of a password, hex-encoded. Used to verify against
 * ADMIN_PASSWORD_HASH env var. Works in both Node.js and Edge runtimes.
 */
export async function sha256hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Sign a session payload using HMAC-SHA256 with ADMIN_SECRET_KEY.
 */
async function signSession(payload: string): Promise<string> {
  const secret = getAdminSecret();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  const hashArray = new Uint8Array(signature);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verify a session token's signature using HMAC-SHA256.
 * Returns { epoch, valid } if signature is valid, or null if invalid/malformed.
 */
async function verifySessionSignature(token: string): Promise<{ epoch: number } | null> {
  const parts = token.split(":");
  if (parts.length !== 3 || parts[0] !== SESSION_VERSION) {
    return null;
  }
  const epochStr = parts[1];
  const providedSig = parts[2];
  if (
    typeof epochStr !== "string" ||
    !/^\d+$/.test(epochStr) ||
    typeof providedSig !== "string" ||
    !/^[0-9a-f]{64}$/i.test(providedSig)
  ) {
    return null;
  }

  const epoch = Number(epochStr);
  if (!Number.isSafeInteger(epoch) || epoch <= Date.now()) {
    return null;
  }

  const prefix = `${SESSION_VERSION}:${epochStr}`;
  let expectedSig: string;
  try {
    expectedSig = await signSession(prefix);
  } catch {
    return null;
  }
  const providedSigBytes = Buffer.from(providedSig, "hex");
  const expectedSigBytes = Buffer.from(expectedSig, "hex");

  // Constant-time comparison
  if (providedSigBytes.length !== expectedSigBytes.length) {
    return null;
  }
  let result = 0;
  for (let i = 0; i < providedSigBytes.length; i++) {
    const providedByte = providedSigBytes[i];
    const expectedByte = expectedSigBytes[i];
    if (providedByte === undefined || expectedByte === undefined) {
      return null;
    }
    result |= providedByte ^ expectedByte;
  }
  if (result !== 0) {
    return null;
  }

  return { epoch };
}

/**
 * Generate a signed session token for an authenticated user.
 * Token format: `v1:<expirationEpochMs>:<hmac-sig>`
 */
export async function generateSessionToken(expirationEpoch: number): Promise<string> {
  const prefix = `${SESSION_VERSION}:${expirationEpoch}`;
  const signature = await signSession(prefix);
  return `${prefix}:${signature}`;
}

/**
 * Verify a session token: check expiration and signature.
 * Returns true if valid and not expired, false otherwise.
 */
export async function verifySessionToken(token: string): Promise<boolean> {
  if (!token) {
    return false;
  }
  const verified = await verifySessionSignature(token);
  if (!verified) {
    return false;
  }
  // Check expiration
  const now = Date.now();
  const exp = verified.epoch;
  return now < exp;
}

/**
 * Verify username + password against env vars.
 * On success, returns the session token; on failure, returns null.
 */
export async function authenticateAndGetSession(
  username: string,
  password: string
): Promise<string | null> {
  const adminUser = process.env.ADMIN_USER;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminUser || !adminPasswordHash) return null;
  if (username !== adminUser) return null;
  const providedHash = await sha256hex(password);
  if (providedHash !== adminPasswordHash) {
    return null;
  }
  // Success: generate session token expiring in SESSION_MAX_AGE
  const expirationEpoch = Date.now() + SESSION_MAX_AGE * 1000;
  return generateSessionToken(expirationEpoch);
}

/**
 * Generate a SHA-256 hash for storing in ADMIN_PASSWORD_HASH.
 * Run once: npx tsx -e "import { sha256hex } from './src/lib/admin-auth'; sha256hex('your-password').then(console.log)"
 */
