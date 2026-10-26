# Audit initial — technique

Date : **2026-10-25**. Commit audité : `9705f87` (branche `master`).

Toutes les commandes ont été exécutées dans `C:\Users\Chaima\atlas-depeche`
sous Node `v24.18.1`, npm `11.16.0`, Windows.

---

## 1. Stack réelle

[VÉRIFIÉ] `package.json`, `src/`, `next.config.ts`, `nixpacks.toml`.

| Couche | Technologie | Version (avant audit) |
|---|---|---|
| Framework | Next.js App Router | 16.3.5 |
| UI | React | 19.3.0 |
| Langage | TypeScript | 6.0.3 |
| Styles | Tailwind CSS | 4.3.3 |
| ORM | Drizzle ORM + driver `postgres` (postgres.js) | 0.45.2 / 3.4.9 |
| Validation | Zod | 4.6.5 |
| Ingestion | `rss-parser`, `cheerio` | 3.13 / 1.2 |
| IA | `@anthropic-ai/sdk` | 0.126.0 |
| Vidéo pub | `puppeteer-core` + `fluent-ffmpeg` | 25.11 / 2.1.3 |
| Tests | Vitest | 5.0.1 |
| Lint | ESLint 9 + `eslint-config-next` | 9.39.5 |
| Node requis | `engines: { node: ">=20" }` | — |

Pas de Dockerfile. Le déploiement Railway utilisait `nixpacks.toml` :

```toml
[phases.setup]
nixPkgs = ["ffmpeg"]
[phases.install]
cmds = ["npm ci"]
[phases.build]
cmds = ["npm run build"]
[start]
cmd = "npm run start"
```

`next.config.ts` n'active **pas** `output: "standalone"` : le serveur tourne via
`next start`. C'est important pour le choix d'hébergeur (il faut un process Node
long, pas seulement des fonctions serverless).

---

## 2. Modèle de données

[VÉRIFIÉ] 20 tables, réparties en deux schémas :

`src/db/schema.ts` (13 tables éditoriales) :
`sources`, `events`, `source_items`, `articles`, `article_versions`,
`article_sources`, `claims`, `evidence`, `fact_packs`, `agent_runs`,
`audit_logs`, `gazetteer_entries`, `social_posts`.

`src/db/schema-advertising.ts` (7 tables) :
`ad_companies`, `ad_creatives`, `ad_campaigns`, `ad_placements`,
`ad_impressions`, `ad_clicks`, `ad_cost_log`.

12 migrations SQL présentes dans `drizzle/` (0000 → 0012) et appliquées par
`src/db/migrate.ts` (`npm run db:migrate`). **Le schéma est donc reconstructible
à partir du dépôt.**

Aucun usage de Redis, aucun stockage objet, aucune écriture disque persistante
détectée dans `src/`.

---

## 3. Routes et rendu

[VÉRIFIÉ] Sortie de `npm run build` :

- routes publiques dynamiques (`ƒ`) : `/[locale]`, `/[locale]/[slug]`,
  `/[locale]/contact`, mentions légales, corrections, confidentialité, `links`,
  `rss.xml`, `search` ;
- routes admin (`ƒ`) : `/admin/analytics`, `/admin/articles`, `/admin/events`,
  `/admin/moderate`, `/admin/login` (statique) ;
- module publicité : `/advertising/*` + `/api/advertising/*` ;
- divers : `/api/health`, `/manifest-icon/[size]`, `robots.txt`, `sitemap.xml`,
  `manifest.webmanifest` ;
- **Proxy (ex-`middleware`) actif** : `src/proxy.ts`, matcher
  `["/admin/:path*", "/advertising/:path*"]`.

Le site public est donc **entièrement dynamique** : pas de cache statique à
espérer d'un CDN pour les pages d'accueil. Cela disqualifie les offres dont le
modèle facture à la requête d'exécution (voir comparatif).

---

## 4. Résultats des vérifications (avant correctifs)

| Commande | Résultat | Détail |
|---|---|---|
| `npm ci` | ✅ | 467 paquets, 14 vulnérabilités dont 1 critique |
| `npm run lint` | ✅ | aucune erreur |
| `npm run typecheck` | ❌ | `src/lib/advertising/video-provider-puppeteer.ts(12,20): TS7016` — pas de types pour `fluent-ffmpeg` |
| `npm test` | ✅ | 131 tests / 13 fichiers |
| `npm run build` | ❌ | même `TS7016` |

**C'est exactement la cause de l'échec de déploiement Railway du 2026-09-25.**

---

## 5. Correctifs appliqués (locaux, non poussés)

### 5.1 Débloquer le build

```bash
npm install -D @types/fluent-ffmpeg@^2.1.28
```

Aucun changement de code. `npm run typecheck` ✅, `npm run build` ✅.

Alternative écartée : un `declare module "fluent-ffmpeg"` local (moins précis,
et redondant avec des types officiels maintenus).

### 5.2 Corriger les failles critiques Next.js

```bash
npm install next@16.4.3 eslint-config-next@16.4.3
```

`npm audit` avant : 1 critique (RCE `next/og` ImageResponse, RCE optimisation
d'images SVG, RCE `use cache`). Après : **0 critique**.

### 5.3 Nettoyage des vulnérabilités restantes

```bash
npm audit fix
```

Résultat : **4 vulnérabilités modérées**, toutes dans l'outillage de
développement :

- `esbuild <= 0.24.2` via `drizzle-kit` → correctif proposé = rétrograder
  `drizzle-kit` en 0.18.1, ce qui est une **régression** ; refusé.
- `vitest` / `@vitest/mocker` → outil de test, hors runtime.

Aucune vulnérabilité restante n'est présente dans le chemin d'exécution de
production. Acceptable en l'état.

### 5.4 Vérification finale du socle

| Commande | Résultat |
|---|---|
| `npm run lint` | ✅ |
| `npm run typecheck` | ✅ |
| `npm test` | ✅ 131/131 |
| `npm run build` | ✅ (exit 0) |
| `npm audit` | 4 modérées, dev uniquement |

### 5.5 Fichiers modifiés

- `package.json` : ajout `@types/fluent-ffmpeg` (dev), `next` et
  `eslint-config-next` en `16.4.3` ;
- `package-lock.json` ;
- `next-env.d.ts` : modifié automatiquement par `next build` puis **restauré**
  (`git checkout --`) pour ne pas polluer le diff.

---

## 6. Défauts trouvés, non corrigés (hors périmètre)

| # | Défaut | Emplacement | Impact |
|---|---|---|---|
| 1 | CI ne se déclenche jamais : `branches: [main]` alors que la branche est `master` | `.github/workflows/ci.yml` | aucun test automatique en CI |
| 2 | Cookie de session admin = constante `"authenticated"` | `src/proxy.ts`, `src/app/(admin)/admin/login/actions.ts` | **contournement total de l'authentification admin** |
| 3 | Aucun rate-limit sur la route de login | `src/app/(admin)/admin/login/actions.ts` | brute-force possible (atténué par le hash SHA-256 non salé) |
| 4 | Mot de passe admin haché en SHA-256 simple, sans sel ni KDF | `src/lib/admin-auth.ts` | si le hash fuit, cassable par dictionnaire |

Le n°2 est le seul réellement bloquant pour une exposition publique. Le n°1 est
une correction d'une ligne, sans risque. Le n°3 et n°4 sont des améliorations.

> Recommandation : corriger n°1 et n°2 **avant** la remise en ligne, avec votre
> accord (ce sont des modifications de code, donc hors du périmètre « migration
> d'hébergement » stricto sensu).

---

## 7. Ce que l'audit ne peut pas établir

- [BLOQUÉ] La taille de la base de production et le volume réel des tables.
- [BLOQUÉ] Le contenu réel de `sources`, `articles`, `social_posts`, `audit_logs`.
- [BLOQUÉ] Les variables d'environnement réellement configurées sur Railway
  (secrets illisibles sans droits admin).
- [BLOQUÉ] L'état DNS réel chez le registrar (aucun domaine ne résout).
- [BLOQUÉ] La consommation historique (trafic, bande passante) qui permettrait de
  dimensionner précisément l'offre gratuite.
