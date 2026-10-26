# Journal des opérations

Chronologie de la mission. Heures locales (Europe/Paris, UTC+1), arrondies.
Aucune action destructive n'a été effectuée.

---

## 2026-10-25 — Session 1 : audit et déblocage

### 10:30–10:45 — Mise en place

| Heure | Action | Résultat |
|---|---|---|
| 10:36 | Clonage de `atlasdepeche/atlas---depeche` dans `C:\Users\Chaima\atlas-depeche` | ✅ arbre propre, HEAD `9705f87` |
| 10:36 | Vérification de la visibilité du dépôt | ✅ public, branche par défaut `master` |
| 10:37 | Lecture de `CLAUDE.md`, `package.json`, `next.config.ts`, `nixpacks.toml` | ✅ stack identifiée |
| 10:38 | Lecture de `src/lib/public-site.ts` et `src/app/(public)/[locale]/page.tsx` | ✅ agrégateur confirmé, liens sortants, `force-dynamic` |
| 10:39 | Lecture de `src/db/schema.ts` et `schema-advertising.ts` | ✅ 20 tables |
| 10:40 | Lecture de `src/workers/radar.ts`, `cleanup.ts`, `src/db/seed-sources.ts` | ✅ ingestion + rétention 24 h |
| 10:41 | Recensement de `.github/workflows/*` | ✅ 5 crons + 1 CI inactive |

### 10:45–11:00 — Vérifications locales

| Heure | Commande | Résultat |
|---|---|---|
| 10:45 | `npm ci` | ✅ 467 paquets, 14 vulnérabilités dont 1 critique |
| 10:47 | `npm run lint` | ✅ |
| 10:48 | `npm test` | ✅ 131/131 |
| 10:49 | `npm run typecheck` | ❌ `TS7016` sur `fluent-ffmpeg` |
| 10:50 | `npm run build` | ❌ même erreur |
| 10:51 | `npm audit` | ❌ 1 critique (Next.js RCE), 7 high, 6 moderate |
| 10:52 | `git log -p` filtré sur mots-clés de secrets | ✅ aucun secret réel |
| 10:53 | `git status` | ⚠️ `next-env.d.ts` modifié par le build (restauré plus tard) |

### 10:54–11:05 — Investigation production

| Heure | Action | Résultat |
|---|---|---|
| 10:54 | Résolution DNS `www.xn--atlasdpche-b7a.com` via Cloudflare DoH | ❌ NXDOMAIN (status 3) |
| 10:55 | RDAP Verisign `atlasdepeche.com` | ❌ non enregistré (404) |
| 10:56 | Test des variantes IDN et `.ma` | ❌ toutes NXDOMAIN |
| 10:57 | Recherche d'archives Wayback | ❌ aucune capture |
| 10:58 | API GitHub — derniers déploiements Railway | ❌ échec le 2026-09-25, succès jusqu'au 2026-09-22 |
| 11:00 | API GitHub — derniers runs Actions | ❌ `DrizzleQueryError` / `ECONNRESET`, y compris `cleanup` le 2026-10-25 |
| 11:02 | Permissions du compte GitHub | ❌ `JAKORED`, `push:false`, `admin:false` |
| 11:03 | CLI Railway | ❌ autre compte, token expiré, projet inaccessible |

### 11:05–11:15 — Correctifs et re-vérification

| Heure | Action | Résultat |
|---|---|---|
| 11:05 | `npm install -D @types/fluent-ffmpeg@^2.1.28` | ✅ 1 paquet ajouté |
| 11:06 | `npm run typecheck` | ✅ |
| 11:07 | `npm run build` | ✅ exit 0 |
| 11:09 | `npm install next@16.4.3 eslint-config-next@16.4.3` | ✅ Next à jour |
| 11:11 | `npm audit` | ✅ 0 critique, 12 vulnérabilités restantes |
| 11:12 | `npm audit fix` | ✅ 4 modérées, **dev uniquement** |
| 11:13 | `npm run lint` | ✅ |
| 11:14 | `npm run typecheck` | ✅ |
| 11:15 | `npm test` | ✅ 131/131 |
| 11:16 | `npm run build` | ✅ exit 0 |
| 11:16 | `git checkout -- next-env.d.ts` | ✅ diff propre |
| 11:17 | `git status` | `package.json` + `package-lock.json` modifiés uniquement |

### 11:15–11:30 — Recherche hébergeurs (Phase B)

| Heure | Source consultée | Donnée retenue |
|---|---|---|
| 11:18 | northflank.com/pricing | Sandbox : 2 services, 2 jobs, 1 DB, 20 $/mois, toujours allumé, sans carte |
| 11:19 | northflank.com/legal/terms | pas d'interdiction explicite d'un site public ; clause commerciale ambiguë |
| 11:20 | render.com/docs/free | 0,1 CPU/512 Mo, 750 h, veille 15 min, Postgres gratuit **expire à 30 j**, « do not use for production » |
| 11:21 | neon.com/pricing | Free permanent, 100 CU-h, 1 Go, scale-to-zero 5 min, sans carte |
| 11:22 | docs.oracle.com — Always Free | 2 OCPU + 12 Go, 200 Go, 10 To egress, carte requise, récupération des instances inactives |
| 11:23 | netlify.com/pricing | Free 300 crédits, 10 crédits/Go-h, 15 crédits/déploiement |
| 11:24 | developers.cloudflare.com — Workers limits | 100k req/j, **10 ms CPU**, 128 Mo |

### 11:25–11:35 — Rédaction documentaire

| Heure | Action |
|---|---|
| 11:26 | Création de `docs/migration/README.md` |
| 11:28 | Création de `docs/migration/ETAT_ACTUEL.md` |
| 11:31 | Création de `docs/migration/AUDIT_INITIAL.md` |
| 11:35 | Création de `docs/migration/COMPARATIF_HEBERGEURS.md` |
| 11:38 | Création de `docs/migration/DECISION_ARCHITECTURE.md` |
| 11:41 | Création de `docs/migration/PLAN_MIGRATION.md` |
| 11:44 | Création de `docs/migration/TESTS_MIGRATION.md` |
| 11:46 | Création de `docs/migration/RETOUR_ARRIERE.md` |
| 11:48 | Création de `docs/migration/JOURNAL_OPERATIONS.md` |
| 11:50 | Création de `docs/migration/REPRISE_OPENCODE.md` |

---

## Découvertes notables (à ne pas perdre)

1. **Le site n'est pas seulement « mal déployé » : il n'a plus d'infrastructure.**
   Dernier déploiement réussi le 2026-09-22, échec le 2026-09-25, base
   `ECONNRESET`, domaine inexistant. Il faut reconstruire, pas « réparer ».
2. **La base est peut-être encore là.** Rien n'a été supprimé côté Railway. Il faut
   tenter un dump avant toute autre chose.
3. **Le domaine du brief n'existe pas.** Ce n'est pas un problème de DNS mal
   configuré : le nom n'est pas enregistré.
4. **`atlasdepeche.com` est libre** — si le rachat est accepté (~10–15 €/an).
5. **Le cookie admin est forgeable.** Défaut critique préexistant, indépendant de
   la migration.
6. **La CI ne tourne jamais** (`main` vs `master`).
7. **Le build cassé est une erreur d'un seul paquet**, pas un chantier. Correction
   en une commande.

---

## Actions non effectuées (volontairement)

| Action | Raison |
|---|---|
| `git push` | pas de droit d'écriture |
| Suppression du projet Railway | interdite sans validation |
| Changement DNS | aucun domaine à modifier, et accord requis |
| Création d'un compte Northflank/Render | nécessite votre identité |
| Modification du cookie admin | hors périmètre, accord requis |
| Correction de `ci.yml` | attend l'accord (1 ligne) |
| Achat de domaine | coût non nul, décision utilisateur |

---

## Prochaine entrée à écrire

Dès que les accès seront fournis, ajouter ici :

- la date du dump et son empreinte SHA-256 ;
- le compte et la région Northflank/Render ;
- le domaine retenu ;
- les runs de validation.


## 2026-10-25 — Session 2 : autonomie, sécurisation build et préparation sauvegarde

| Heure | Action | Résultat |
|---|---|---|
| 16:45 | Résolution DNS exacte de `atlasdépêche.com` (`xn--atlasdpche-g7an.com`) | ✅ Domaine actif chez GoDaddy (`domaincontrol.com`), CNAME `www` actif vers `nqxyte3f.up.railway.app` |
| 17:48 | Mise à jour de `.gitignore` : ajout de `backups/` et `*.dump` | ✅ Règles existantes préservées, fuite de données bloquée |
| 17:49 | Création du dossier local `C:\Users\Chaima\atlas-depeche\backups\` | ✅ Prêt pour les archives |
| 17:53 | Examen de l'onglet Backups de PostgreSQL Railway | ❌ « No Backups » confirmé (aucun snapshot natif) |
| 20:33 | Recherche locale de sauvegardes ou dumps préexistants sur le disque | ✅ Aucun fichier dump orphelin trouvé |
| 20:36 | Correction de `.github/workflows/ci.yml` (`branches: [master, main]`) | ✅ CI désormais active sur la branche par défaut |
| 20:37 | Création des scripts natifs TypeScript `src/db/backup.ts` et `restore-backup.ts` | ✅ Indépendant de `pg_dump.exe`, format JSON + manifest SHA-256 |
| 20:38 | Ajout des commandes `npm run db:backup` et `npm run db:restore` dans `package.json` | ✅ Intégré |
| 20:41 | Correction de `next.config.ts` (`output: "standalone"`) et `src/lib/admin-auth.ts` | ✅ Évaluation paresseuse du secret admin lors du build |
| 20:43 | `npm run build` | ✅ Exit 0 (31 routes compilées, standalone généré) |
| 20:44 | `npm test` | ✅ 131/131 tests unitaires validés avec succès |
| 21:44 | Amélioration du script `src/db/backup.ts` | ✅ Génération simultanée JSON par table + `full_backup.sql` + `manifest.json` (SHA-256 et tailles) |
| 21:46 | Validation complète du socle local | ✅ Lint exit 0, Typecheck exit 0, Tests (131/131) exit 0, Build (31 routes standalone) exit 0 |

## 2026-10-26 — Session 3 : sécurisation des API publicité, tests d'auth, anti-bruteforce

| Heure | Action | Résultat |
|---|---|---|
| — | Ajout de `isAdminSession()` dans `src/lib/require-admin.ts` (garde API renvoyant un booléen, sans `redirect`) | ✅ |
| — | Protection de `POST /api/advertising/analyze`, `generate`, `campaigns`, `companies` et `PATCH /creatives/[id]` par `isAdminSession()` → 401 JSON | ✅ Ferme un accès public à des endpoints coûteux (Puppeteer/FFmpeg) et à l'écriture en base |
| — | `serve`, `track` et `health` laissés publics (par conception) | ✅ Vérifié |
| — | Création de `src/lib/login-rate-limit.ts` (5 tentatives / 15 min / IP, en mémoire) | ✅ |
| — | Branchement du limiteur dans `loginAction` (`x-forwarded-for` / `x-real-ip`), remise à zéro après succès | ✅ |
| — | Création de `src/lib/admin-auth.test.ts` (15 tests) et `src/lib/login-rate-limit.test.ts` (5 tests) | ✅ |
| — | **Bug réel découvert par les tests** : `SESSION_PREFIX = "v1:"` comparé à `parts[0] === "v1"` → tout jeton valide était rejeté, login impossible | ✅ Corrigé (`SESSION_VERSION = "v1"`) |
| — | `npm run typecheck` | ✅ exit 0 |
| — | `npm run lint` | ✅ exit 0 |
| — | `npm test` | ✅ **149/149** (15 fichiers) |
| — | `npm run build` | ✅ exit 0 |

### Constats de sécurité de cette session

- [VÉRIFIÉ] Les cookies `admin_session=authenticated` sont définitivement rejetés (test dédié).
- [VÉRIFIÉ] Le *bypass* `next-action` a été retiré du proxy : toute action admin est vérifiée côté serveur.
- [VÉRIFIÉ] Aucun secret n'a été écrit dans un fichier, un log ou la documentation.
- [NON VÉRIFIÉ] Test de bout en bout du login dans un navigateur (nécessite `ADMIN_SECRET_KEY`, `ADMIN_USER`, `ADMIN_PASSWORD_HASH` et une base).
- [BLOQUÉ] Publication des correctifs : compte `JAKORED` sans droit `push`.

### Reste à faire (inchangé)

1. Trancher `output: "standalone"` vs `next start` (cohérence `Dockerfile` / `nixpacks.toml`).
2. Supprimer le fichier parasite `ntent package.json` (**accord explicite requis**).
3. Restaurer `next-env.d.ts` avant tout commit.
4. Confirmation écrite Northflank (usage production, dépassement des 20 $/mois, facturation des builds).
5. Dump Railway : bloqué faute d'accès.

## 2026-10-26 — Session 4 : publication GitHub et correction de déploiement

| Heure | Action | Résultat |
|---|---|---|
| — | Vérification des identités Git disponibles (`gh auth status --all`, `hosts.yml`, `GIT_TOKEN`, `.git-credentials`, clés SSH) | ✅ un seul compte `JAKORED`, `push:false` sur le dépôt officiel |
| — | `git push --dry-run origin master` | ❌ 403 — « Permission denied to JAKORED » |
| — | Création d'un fork `JAKORED/atlas---depeche` + push du commit `acda4b6` | ✅ |
| — | Ouverture de la Pull Request #1 vers `atlasdepeche/atlas---depeche` | ✅ `OPEN`, `MERGEABLE`, 35 fichiers |
| — | Tentative d'ouverture du navigateur pour se connecter à GitHub | ❌ `browser.disconnected` — aucun navigateur disponible dans la session |
| — | Ajout de `docs/TRANSFERT_COMPTES.md` (sans aucun mot de passe) | ✅ |
| — | Test réel de `next start` avec `output: "standalone"` | ❌ avertissement : `"next start" does not work with "output: standalone"` |
| — | Suppression de `output: "standalone"` et adaptation du `Dockerfile` (copie `.next`, `public`, `next.config.ts`) | ✅ |
| — | `npm run build` | ✅ exit 0 |
| — | Démarrage réel + tests HTTP : `/api/health` 200, `/admin/login` 200, `/robots.txt` 200, `/manifest.webmanifest` 200, CSS statique 200 (24 277 octets) | ✅ |
| — | `npm run typecheck` / `npm run lint` / `npm test` | ✅ 0 / 0 / **149 sur 149** |
| — | Push du correctif `b9f3c65` sur le fork | ✅ |

**Point de blocage restant** : la fusion de la PR #1 (ou l'ajout de `JAKORED` en Write)
ne peut être faite que depuis le compte `atlasdepeche`. Aucun identifiant présent sur
la machine ne le permet.


