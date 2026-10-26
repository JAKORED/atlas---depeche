"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  COOKIE_NAME,
  COOKIE_MAX_AGE,
  authenticateAndGetSession,
} from "@/lib/admin-auth";
import {
  checkLoginRateLimit,
  recordLoginFailure,
  resetLoginRateLimit,
} from "@/lib/login-rate-limit";

/** Identifie grossièrement le client pour le rate-limit. */
async function clientKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return ip;
}

export async function loginAction(_prev: unknown, formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const key = await clientKey();

  const limit = checkLoginRateLimit(key);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterMs / 60000));
    return {
      error: `Trop de tentatives. Réessayez dans ${minutes} minute(s).`,
    };
  }

  let token: string | null;
  try {
    token = await authenticateAndGetSession(username, password);
  } catch {
    return { error: "Configuration de connexion indisponible" };
  }

  if (!token) {
    recordLoginFailure(key);
    return { error: "Identifiants incorrects" };
  }

  resetLoginRateLimit(key);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  redirect("/admin/events");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin/login");
}
