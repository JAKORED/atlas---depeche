import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";

/**
 * Garde pour les pages et Server Actions : redirige vers /admin/login
 * si la session signée est absente, invalide ou expirée.
 */
export async function requireAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token || !(await verifySessionToken(token))) {
    redirect("/admin/login");
  }
}

/**
 * Garde pour les route handlers (API) : renvoie un booléen au lieu de
 * rediriger, pour que l'appelant puisse répondre 401 en JSON.
 */
export async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}
