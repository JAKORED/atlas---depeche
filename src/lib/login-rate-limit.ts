/**
 * Limiteur de tentatives de connexion, en mémoire.
 *
 * Objectif : freiner le bruteforce sur /admin/login. Ce compteur vit dans le
 * processus Node ; il est donc remis à zéro à chaque redémarrage et n'est pas
 * partagé entre plusieurs instances. Suffisant pour un déploiement mono-instance
 * (Northflank Sandbox = 1 service). À remplacer par un stockage partagé si le
 * service est un jour répliqué.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

type Entry = { count: number; firstAt: number };

const attempts = new Map<string, Entry>();

/** Purge les entrées dont la fenêtre est expirée (évite la croissance mémoire). */
function prune(now: number): void {
  for (const [key, entry] of attempts) {
    if (now - entry.firstAt > WINDOW_MS) {
      attempts.delete(key);
    }
  }
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

/** Vérifie si une nouvelle tentative est autorisée pour cette clé. */
export function checkLoginRateLimit(
  key: string,
  now: number = Date.now(),
): RateLimitResult {
  prune(now);
  const entry = attempts.get(key);
  if (!entry) return { allowed: true };

  if (entry.count < MAX_ATTEMPTS) return { allowed: true };

  return { allowed: false, retryAfterMs: entry.firstAt + WINDOW_MS - now };
}

/** Enregistre un échec d'authentification. */
export function recordLoginFailure(key: string, now: number = Date.now()): void {
  const entry = attempts.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return;
  }
  entry.count += 1;
}

/** Réinitialise le compteur après une connexion réussie. */
export function resetLoginRateLimit(key: string): void {
  attempts.delete(key);
}

/** Utilitaire de test / maintenance : vide tous les compteurs. */
export function clearLoginRateLimits(): void {
  attempts.clear();
}
