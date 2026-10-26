import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  authenticateAndGetSession,
  generateSessionToken,
  sha256hex,
  verifySessionToken,
} from "./admin-auth";

const SECRET = "test-secret-key-not-a-real-secret";
const USER = "admin";
const PASSWORD = "correct horse battery staple";
let savedSecret: string | undefined;
let savedUser: string | undefined;
let savedHash: string | undefined;

beforeEach(async () => {
  savedSecret = process.env.ADMIN_SECRET_KEY;
  savedUser = process.env.ADMIN_USER;
  savedHash = process.env.ADMIN_PASSWORD_HASH;
  process.env.ADMIN_SECRET_KEY = SECRET;
  process.env.ADMIN_USER = USER;
  process.env.ADMIN_PASSWORD_HASH = await sha256hex(PASSWORD);
});

afterEach(() => {
  if (savedSecret === undefined) delete process.env.ADMIN_SECRET_KEY;
  else process.env.ADMIN_SECRET_KEY = savedSecret;
  if (savedUser === undefined) delete process.env.ADMIN_USER;
  else process.env.ADMIN_USER = savedUser;
  if (savedHash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
  else process.env.ADMIN_PASSWORD_HASH = savedHash;
});

describe("generateSessionToken / verifySessionToken", () => {
  it("accepts a freshly generated token", async () => {
    const token = await generateSessionToken(Date.now() + 60_000);
    await expect(verifySessionToken(token)).resolves.toBe(true);
  });

  it("rejects an expired token", async () => {
    const token = await generateSessionToken(Date.now() - 1_000);
    await expect(verifySessionToken(token)).resolves.toBe(false);
  });

  it("rejects a token whose expiration was extended without re-signing", async () => {
    const token = await generateSessionToken(Date.now() + 60_000);
    const parts = token.split(":");
    parts[1] = String(Date.now() + 999_999_999);
    await expect(verifySessionToken(parts.join(":"))).resolves.toBe(false);
  });

  it("rejects a token with a tampered signature", async () => {
    const token = await generateSessionToken(Date.now() + 60_000);
    const signature = token.split(":")[2] as string;
    const flipped = (signature[0] === "a" ? "b" : "a") + signature.slice(1);
    await expect(verifySessionToken(`${token.split(":").slice(0, 2).join(":")}:${flipped}`)).resolves.toBe(false);
  });

  it("rejects the legacy static cookie value", async () => {
    await expect(verifySessionToken("authenticated")).resolves.toBe(false);
  });

  it("rejects malformed tokens", async () => {
    const cases = [
      "",
      "v1",
      "v1:abc:def",
      "v2:9999999999999:" + "0".repeat(64),
      "v1:9999999999999:short",
      "v1:-1:" + "0".repeat(64),
      "v1:9999999999999:" + "z".repeat(64),
    ];
    for (const token of cases) {
      await expect(verifySessionToken(token)).resolves.toBe(false);
    }
  });

  it("rejects every token when the secret is missing (fail closed)", async () => {
    const token = await generateSessionToken(Date.now() + 60_000);
    delete process.env.ADMIN_SECRET_KEY;
    await expect(verifySessionToken(token)).resolves.toBe(false);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await generateSessionToken(Date.now() + 60_000);
    process.env.ADMIN_SECRET_KEY = "another-secret";
    await expect(verifySessionToken(token)).resolves.toBe(false);
  });
});

describe("authenticateAndGetSession", () => {
  it("returns a verifiable token for valid credentials", async () => {
    const token = await authenticateAndGetSession(USER, PASSWORD);
    expect(token).toBeTypeOf("string");
    await expect(verifySessionToken(token as string)).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    await expect(authenticateAndGetSession(USER, "wrong")).resolves.toBeNull();
  });

  it("rejects a wrong username", async () => {
    await expect(authenticateAndGetSession("root", PASSWORD)).resolves.toBeNull();
  });

  it("rejects when credentials are not configured", async () => {
    delete process.env.ADMIN_USER;
    await expect(authenticateAndGetSession(USER, PASSWORD)).resolves.toBeNull();
  });

  it("does not accept the password in place of its hash", async () => {
    process.env.ADMIN_PASSWORD_HASH = PASSWORD;
    await expect(authenticateAndGetSession(USER, PASSWORD)).resolves.toBeNull();
  });
});
