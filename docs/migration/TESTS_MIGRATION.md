# Tests de migration

Deux parties : **ce qui a déjà été testé** (localement, 2026-10-25) et **ce qu'il
faudra tester** après la migration.

---

## Partie 1 — Tests déjà exécutés (résultats réels)

Environnement : Windows, Node `v24.18.1`, npm `11.16.0`, commit `9705f87`
modifié par les correctifs locaux.

| # | Test | Commande | Avant correctifs | Après correctifs |
|---|---|---|---|---|
| 1 | Installation propre | `npm ci` | ✅ 467 paquets | ✅ |
| 2 | Lint | `npm run lint` | ✅ | ✅ |
| 3 | Types | `npm run typecheck` | ❌ `TS7016` | ✅ |
| 4 | Tests unitaires | `npm test` | ✅ 131/131 (13 fichiers) | ✅ 131/131 |
| 5 | Build production | `npm run build` | ❌ `TS7016` | ✅ exit 0 |
| 6 | Audit de sécurité | `npm audit` | 14 dont **1 critique** | 4 modérées (**dev seulement**) |
| 7 | Secrets dans l'historique | `git log -p` | — | ✅ aucun secret réel |
| 8 | Résolution du domaine | DoH Cloudflare | — | ❌ NXDOMAIN |
| 9 | Enregistrement `atlasdepeche.com` | RDAP Verisign | — | ❌ non enregistré |
| 10 | Dernier déploiement Railway | API GitHub deployments | — | ❌ échec 2026-09-25 |
| 11 | Crons | API GitHub Actions | — | ❌ `ECONNRESET` |

**Détail des 131 tests (tous verts)** : `distribution/adapters` (13),
`ingest/dedup` (9), `agents/verdict` (9), `lib/publication-mode` (7),
`ingest/normalize` (7), `lib/event-state-machine` (9), `agents/cost-guard` (7),
`lib/video-embed` (6), `lib/slugify` (4), `ingest/google-news-rss` (8),
`ingest/article-list` (9), plus les fichiers restants.

> Ces tests prouvent que la logique métier est intacte après la mise à jour de
> Next.js. Ils ne testent **pas** l'interface ni la base.

---

## Partie 2 — Tests à faire après la migration

### 2.1 Intégrité des données

À exécuter **avant** (sur l'ancienne base) et **après** (sur la nouvelle). Les
nombres doivent être identiques.

```sql
select 'sources'            as t, count(*) from sources
union all select 'events',            count(*) from events
union all select 'articles',          count(*) from articles
union all select 'article_versions',  count(*) from article_versions
union all select 'article_sources',   count(*) from article_sources
union all select 'claims',            count(*) from claims
union all select 'evidence',          count(*) from evidence
union all select 'fact_packs',        count(*) from fact_packs
union all select 'agent_runs',        count(*) from agent_runs
union all select 'audit_logs',        count(*) from audit_logs
union all select 'gazetteer_entries', count(*) from gazetteer_entries
union all select 'social_posts',      count(*) from social_posts
union all select 'ad_companies',      count(*) from ad_companies
union all select 'ad_creatives',      count(*) from ad_creatives
union all select 'ad_campaigns',      count(*) from ad_campaigns
union all select 'ad_placements',     count(*) from ad_placements
union all select 'ad_impressions',    count(*) from ad_impressions
union all select 'ad_clicks',         count(*) from ad_clicks
union all select 'ad_cost_log',       count(*) from ad_cost_log
order by 1;
```

Contrôles complémentaires :

```sql
-- aucune source active ne doit disparaître
select count(*) from sources where is_active = true;

-- les 12 migrations doivent être enregistrées
select count(*) from drizzle.__drizzle_migrations;

-- pas de doublon d'URL
select url, count(*) from source_items group by url having count(*) > 1;

-- pas de FK orpheline
select count(*) from source_items si
  left join sources s on s.id = si.source_id
 where s.id is null;
```

**Critère :** tous les compteurs identiques, sauf `source_items` (données 24 h,
peut varier légitimement).

### 2.2 Site public

| # | Test | Attendu |
|---|---|---|
| P1 | `GET /fr` → 200 | page d'accueil française |
| P2 | `GET /ar` → 200 | page arabe |
| P3 | `<html dir="rtl" lang="ar">` sur `/ar` | RTL correct |
| P4 | Une carte d'article pointe vers un domaine externe | lien sortant, pas de page interne |
| P5 | `GET /fr/search?q=maroc` | résultats ou état vide propre |
| P6 | `GET /fr/rss.xml` | XML valide, liens absolus |
| P7 | `GET /robots.txt` | 200, pas de « Disallow: / » |
| P8 | `GET /sitemap.xml` | XML valide |
| P9 | `GET /manifest.webmanifest` | JSON valide |
| P10 | Aucune erreur 500 dans les logs pendant 10 min de navigation | — |
| P11 | Temps de réponse < 2 s (hors cache) | — |
| P12 | Le site s'affiche correctement sur mobile (largeur 375 px) | — |

### 2.3 API et santé

| # | Test | Attendu |
|---|---|---|
| A1 | `GET /api/health` | 200 + statut base |
| A2 | `GET /api/advertising/serve` | 200 (ou 204 si aucune campagne) |
| A3 | `POST /api/advertising/track` avec charge invalide | 400, pas 500 |

### 2.4 Authentification admin

| # | Test | Attendu |
|---|---|---|
| S1 | `GET /admin/events` sans cookie | redirection vers `/admin/login` |
| S2 | Login avec mauvais mot de passe | refus, pas de cookie |
| S3 | Login avec les bons identifiants | cookie posé, accès OK |
| **S4** | **Forger le cookie `admin_session=authenticated` sans mot de passe** | **DOIT ÊTRE REFUSÉ** |
| S5 | `POST` vers une Server Action avec le cookie forgé | doit être refusé |

> **S4 échouera aujourd'hui** : c'est le défaut critique identifié dans l'audit.
> Il doit être corrigé avant la mise en ligne publique.

### 2.5 Tâches planifiées

| # | Test | Attendu |
|---|---|---|
| J1 | `gh workflow run radar.yml` | run vert, nouvelles lignes dans `source_items` |
| J2 | `gh workflow run cleanup.yml` | run vert, purge des > 24 h |
| J3 | `gh workflow run distribute.yml` | run vert, `social_posts` mis à jour |
| J4 | `gh workflow run instagram.yml` | run vert (ou « disabled » propre) |
| J5 | Attendre 2 crons automatiques (1 h) | aucun `ECONNRESET` |

### 2.6 Robustesse et coût

| # | Test | Attendu |
|---|---|---|
| R1 | Redéployer le service | redémarrage sans perte de données |
| R2 | Redémarrer la base | le site revient, données intactes |
| R3 | Vérifier la consommation après 24 h | rester sous 50 % du quota gratuit |
| R4 | Vérifier la consommation après 7 j | rester sous le quota |
| R5 | Couper le service 1 h, le rallumer | reprise correcte |
| R6 | 20 requêtes simultanées sur `/fr` | pas d'erreur 5xx |

### 2.7 Sécurité de la mise en ligne

| # | Test | Attendu |
|---|---|---|
| X1 | `curl -I https://<domaine>` | TLS valide, HSTS si configuré |
| X2 | `git log -p \| grep -iE "api_key\|secret\|token"` | aucun secret |
| X3 | Variables d'env affichées dans les logs | aucune |
| X4 | `/.env` accessible ? | 404 |
| X5 | En-têtes : pas de `X-Powered-By` | optionnel |

---

## Partie 3 — Ce qui ne peut pas être testé aujourd'hui

| Test | Blocage |
|---|---|
| Intégrité avant/après | pas d'accès à la base Railway |
| Déploiement réel | pas de compte Northflank/Render, pas de droit `push` |
| Domaine et TLS | aucun domaine existant |
| Crons sur la nouvelle base | dépend du déploiement |
| Charge réelle | pas d'historique de trafic |

Ces tests seront exécutés dès que les accès de la Phase 1 seront fournis.
