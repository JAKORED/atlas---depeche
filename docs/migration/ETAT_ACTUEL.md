# État actuel — constat au 2026-10-25

Ce document décrit **ce qui est**, pas ce qui était prévu. Chaque point est marqué
[VÉRIFIÉ], [NON VÉRIFIÉ] ou [BLOQUÉ].

---

## 1. Le dépôt

| Élément | Valeur | Statut |
|---|---|---|
| URL | `https://github.com/atlasdepeche/atlas---depeche` | [VÉRIFIÉ] |
| Visibilité | **public** | [VÉRIFIÉ] |
| Branche par défaut | `master` | [VÉRIFIÉ] |
| Commit audité | `9705f87` — « Improve breaking-news badge color and add live-attention effect » | [VÉRIFIÉ] |
| Compte GitHub authentifié localement | `JAKORED` | [VÉRIFIÉ] |
| Permissions de ce compte | `admin: false`, `maintain: false`, `push: false`, `pull: true`, `triage: false` | [VÉRIFIÉ] |
| Clone local | `C:\Users\Chaima\atlas-depeche` | [VÉRIFIÉ] |
| Secrets dans l'historique Git | aucun secret réel trouvé ; seul le placeholder `postgres://user:***@localhost:5432/atlas_depeche` de `.env.example` | [VÉRIFIÉ] |

> Conséquence : **toute publication (docs ou code) est impossible depuis cette session.**
> Il faut soit accorder `push` au compte, soit pousser vous-même les commits préparés.

---

## 2. La production (Railway + domaine)

| Élément | Constat | Statut |
|---|---|---|
| Dernier déploiement Railway | projet `c3c652ab-041d-4497-a8ae-8beaa7402d98`, environnement `c342da78-09ea-472c-a80c-e7fb824a6696`, **échec le 2026-09-25** | [VÉRIFIÉ] |
| Déploiements précédents | succès jusqu'au 2026-09-22 | [VÉRIFIÉ] |
| Cause de l'échec | erreur de build `TS7016` sur `fluent-ffmpeg` (reproduite localement) | [VÉRIFIÉ] |
| Base PostgreSQL | inaccessible : tous les crons échouent en `DrizzleQueryError` / `read ECONNRESET` | [VÉRIFIÉ] |
| Dernier échec constaté | workflow `cleanup`, 2026-10-25 | [VÉRIFIÉ] |
| Domaine fourni `www.xn--atlasdpche-b7a.com` | NXDOMAIN (Cloudflare DoH, status 3) | [VÉRIFIÉ] |
| `atlasdepeche.com` | **non enregistré** (RDAP Verisign : 404) | [VÉRIFIÉ] |
| Variantes IDN / `.ma` plausibles | toutes NXDOMAIN | [VÉRIFIÉ] |
| Archives Wayback | aucune capture | [VÉRIFIÉ] |
| Accès Railway | CLI connectée à un autre compte, token OAuth expiré, projet `upbeat-presence` inaccessible | [VÉRIFIÉ] |

> Le site public est donc **hors ligne** à tous les niveaux : plus de déploiement
> réussi, base injoignable, domaine inexistant. Il n'y a pas de « production
> actuelle » à préserver en l'état — mais il peut rester des données dans la base
> Railway tant qu'elle n'est pas supprimée. **Ne rien supprimer côté Railway.**

### Point à clarifier : le domaine

Le brief mentionne `atlasdépêche.com`, qui se punycode en `xn--atlasdpche-g7an.com`,
alors que l'adresse fournie était `xn--atlasdpche-b7a.com`. Les deux sont mortes et
`atlasdepeche.com` est libre. Il faut :

- soit confirmer le domaine réellement acheté (et chez quel registrar, probablement GoDaddy) ;
- soit acter qu'il n'y a plus de domaine et en choisir un nouveau (attention : un `.com` n'est pas gratuit, ~10-15 €/an ; les options gratuites sont un sous-domaine `*.code.run`, `*.onrender.com`, `*.vercel.app`…).

---

## 3. Le produit réel (ce que fait le site)

[VÉRIFIÉ] Le site public est un **agrégateur** :

- `/fr` et `/ar` lisent la table `source_items` jointe à `sources` ;
- chaque carte **renvoie vers l'article d'origine** (lien sortant) ;
- **aucune génération IA** n'est utilisée pour le fil public ;
- les pages sont `force-dynamic` (rendu à chaque requête) ;
- les données du radar ont une **rétention de 24 h** (`src/workers/cleanup.ts`).

[VÉRIFIÉ] Le pipeline éditorial IA (`articles`, agents Anthropic, vérification,
rédaction FR/AR, publication réseaux) **existe dans le code mais est dormant** :
`articles` ne contient aucune ligne réellement publiée d'après `CLAUDE.md`, et le
site public ne le lit pas.

[VÉRIFIÉ] Le module publicité (`src/lib/advertising/`, 7 tables `ad_*`) existe mais
n'est pas branché sur le fil public.

**Conséquence pour la migration :** l'hébergeur n'a besoin que de faire tourner
**un serveur Node + une base PostgreSQL**. Pas de Redis, pas de stockage objet,
pas d'écriture disque persistante (aucun `writeFile` applicatif trouvé).

---

## 4. Où tournent les tâches planifiées

[VÉRIFIÉ] **Tout tourne dans GitHub Actions, pas sur l'hébergeur web.**

| Workflow | Fréquence | Rôle |
|---|---|---|
| `radar.yml` | toutes les 30 min | ingestion des sources |
| `distribute.yml` | toutes les 15 min | publication réseaux |
| `instagram.yml` | toutes les heures | publication Instagram |
| `cleanup.yml` | toutes les 4 h | purge > 24 h |
| `x-personalities.yml` | 1×/jour à 08:00 | sources X |
| `ci.yml` | — | **ne se déclenche jamais** (voir audit) |

Les minutes GitHub Actions sont **gratuites et illimitées pour un dépôt public**.
C'est un atout majeur : le serveur web gratuit n'a rien à calculer.

**Mais** : les crons échouent tous aujourd'hui, faute de base joignable. Ils
reprendront automatiquement dès que `DATABASE_URL` pointera vers une base vivante.

---

## 5. Ce qu'il faut préserver

[VÉRIFIÉ] Liste des données à ne pas perdre :

| Table | Contenu | Critique ? |
|---|---|---|
| `sources` | ~60 sources configurées (RSS, Google News, X, Instagram), actives ou en pause | **oui** — configuration éditoriale |
| `gazetteer_entries` | lieux / entités | oui |
| `articles` + `article_versions` + `article_sources` + `claims` + `evidence` + `fact_packs` + `agent_runs` | pipeline IA (probablement vide ou quasi vide) | à sauvegarder quand même |
| `events` | événements éditoriaux | oui |
| `social_posts` | historique de publication | oui |
| `audit_logs` | journal d'audit | oui |
| `ad_*` (7 tables) | module publicité | à sauvegarder |
| `source_items` | articles radar | **non** — régénéré et purgé à 24 h |

Le schéma complet (20 tables) est **reconstructible depuis le dépôt** : 12
migrations SQL dans `drizzle/`, et `npm run db:migrate` les applique
(`src/db/migrate.ts`). Donc même sans dump, la structure est récupérable — mais
**pas le contenu** (sources, historique social, audit).

---

## 6. Sécurité — points à connaître avant remise en ligne

| Constat | Gravité | Statut |
|---|---|---|
| Le cookie de session admin vaut la chaîne fixe `authenticated` (`src/proxy.ts`, `login/actions.ts`) → **falsifiable par n'importe qui** via le navigateur | **critique** | [VÉRIFIÉ] |
| `ADMIN_USER` / `ADMIN_PASSWORD_HASH` absents ⇒ login refusé (bon point), mais le cookie forgé contourne tout | critique | [VÉRIFIÉ] |
| Next.js 16.3.5 : RCE `next/og`, RCE optimisation d'images SVG, RCE `use cache` | critique | corrigé localement (16.4.3) |
| `ci.yml` ne se déclenche que sur `main`, or la branche est `master` → **aucune CI** | moyen | [VÉRIFIÉ] |
| 4 vulnérabilités modérées restantes (esbuild via drizzle-kit, vitest) — **outils de dev uniquement** | faible | [VÉRIFIÉ] |

Le cookie forgeable est un défaut **préexistant**, pas introduit par la migration.
Il est hors du périmètre « ne pas refactoriser », mais il devient grave dès que le
site est public. Correctif minimal possible (non appliqué, en attente de votre
accord) : signer le cookie (HMAC avec un secret d'environnement) au lieu d'écrire
une constante.
