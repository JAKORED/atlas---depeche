# REPRISE — protocole de reprise

**À lire en premier au début de chaque nouvelle session.**

Dernière mise à jour : **2026-10-26** (Europe/Paris).
Commit d'origine : `9705f87`. Dépôt local : `C:\Users\Chaima\atlas-depeche`.

---

## 1. Où en est la mission

| Phase | État |
|---|---|
| A — Audit technique | ✅ terminé |
| B — Comparatif hébergeurs | ✅ terminé |
| C — Décision d'architecture | ⏸ **attend la décision du propriétaire** |
| D — Migration | 🚫 bloqué (accès manquants) |
| E — Tests de bout en bout | 🚫 bloqué |

**Ne pas commencer la Phase D sans réponse aux 4 questions de la section 5.**

---

## 2. État exact du dépôt local

```
M .github/workflows/ci.yml
M .gitignore
M next-env.d.ts          # sale après build — à restaurer avant commit
M next.config.ts         # output: "standalone"
M package.json / package-lock.json
M src/app/(admin)/admin/articles/actions.ts
M src/app/(admin)/admin/login/actions.ts
M src/app/(admin)/admin/moderate/actions.ts
M src/lib/admin-auth.ts
M src/proxy.ts
M src/app/api/advertising/{analyze,generate,campaigns,companies,creatives/[id]}/route.ts
?? .dockerignore / Dockerfile
?? src/lib/require-admin.ts
?? src/lib/login-rate-limit.ts (+ test)
?? src/lib/admin-auth.test.ts
?? src/db/backup.ts / restore-backup.ts
?? docs/migration/
?? "ntent package.json"   # ARTEFACT À SUPPRIMER (accord requis)
```

Socle vérifié le 2026-10-26 :

| Commande | Résultat |
|---|---|
| `npm run lint` | ✅ exit 0 |
| `npm run typecheck` | ✅ exit 0 |
| `npm test` | ✅ **149/149** (15 fichiers) |
| `npm run build` | ✅ exit 0 |
| `npm audit` | 4 modérées, dev uniquement |

**Rien n'est poussé sur GitHub.** Le compte `JAKORED` a `push:false`.

---

## 3. Ce qu'il ne faut pas refaire

- ❌ Re-diagnostiquer le build : c'est réglé (`@types/fluent-ffmpeg`).
- ❌ Re-chercher le domaine : il n'existe pas (NXDOMAIN + non enregistré).
- ❌ Re-tester Railway : il faut d'abord les accès.
- ❌ Refaire le comparatif : il est à jour au 2026-10-25, sources citées.
- ❌ Relancer `npm audit fix --force` : cela rétrograderait `drizzle-kit`.

---

## 4. Les 3 faits à ne jamais oublier

1. **La production est morte, pas cassée.** Dernier déploiement OK : 2026-09-22.
   Depuis : build en échec, base `ECONNRESET`, domaine inexistant.
2. **La base Railway n'a pas été supprimée.** Un dump reste possible si l'accès
   est obtenu. C'est la seule source des données historiques.
3. **Le site public est un agrégateur** : il lit `source_items` (rétention 24 h) et
   renvoie vers les articles d'origine. Aucune IA dans le fil public. Tout le
   calcul lourd est dans GitHub Actions.

---

## 5. Questions en attente (bloquantes)

1. **Hébergeur** : Northflank Sandbox (recommandé) / Render+Neon / Oracle (carte) ?
2. **Domaine** : sous-domaine gratuit / rachat ~10–15 €/an / un domaine existant ?
3. **Données** : accès Railway pour un dump, ou reconstruction schéma+seed ?
4. ~~**Sécurité** : autorisation de corriger le cookie admin forgeable et `ci.yml` ?~~
   ✅ **FAIT** le 2026-10-26 (voir section 5 bis).

Détail et conséquences : `DECISION_ARCHITECTURE.md`, section 4.

---

## 5 bis. Sécurité — état au 2026-10-26

| Point | État |
|---|---|
| Cookie admin statique `"authenticated"` | ✅ supprimé, rejeté par test |
| Session signée HMAC-SHA256 + expiration 7 j | ✅ `src/lib/admin-auth.ts` |
| `ADMIN_SECRET_KEY` obligatoire (échec fermé) | ✅ |
| *Bypass* `next-action` dans le proxy | ✅ supprimé |
| Garde des Server Actions admin | ✅ `requireAdminSession()` (6 appels) |
| Garde des API publicité | ✅ `isAdminSession()` → 401 sur `analyze`, `generate`, `campaigns`, `companies`, `creatives/[id]` |
| `serve`, `track`, `health` publics | ✅ par conception |
| Anti-bruteforce login | ✅ 5 tentatives / 15 min / IP (mémoire) |
| Tests d'authentification | ✅ 20 tests (15 + 5) |
| Bug « tous les jetons rejetés » (`"v1:"` vs `"v1"`) | ✅ trouvé par les tests puis corrigé |

**Faiblesses restantes connues** : mot de passe haché en SHA-256 non salé (KDF à
migrer), rate-limit en mémoire (non partagé entre instances).

---

## 6. Ordre de reprise recommandé

```
1. Lire README.md puis ce fichier.
2. Vérifier git status et re-exécuter npm run build (5 min de confirmation).
3. Obtenir la réponse aux 4 questions.
4. Si hébergeur = Northflank :
   a. pousser les correctifs (droit push ou push manuel) ;
   b. créer le projet + l'addon Postgres ;
   c. dump de l'ancienne base (ou schéma+seed) ;
   d. déployer, tester (TESTS_MIGRATION.md) ;
   e. rebrancher les secrets GitHub Actions.
5. Mettre à jour JOURNAL_OPERATIONS.md à chaque étape.
```

---

## 7. Commandes utiles

```powershell
# état
cd C:\Users\Chaima\atlas-depeche
git status --short
git log --oneline -3

# vérifier le socle
npm run lint
npm run typecheck
npm test
npm run build

# comparer avec l'origine
git diff --stat
git diff package.json

# pousser (si le droit est accordé)
git add -A
git commit -m "docs(migration): audit, comparatif hébergeurs et plan; fix build TS7016 + Next 16.4.3"
git push origin master
```

```powershell
# vérifier un domaine
nslookup <domaine> 1.1.1.1
curl.exe -I https://<domaine>

# vérifier l'enregistrement d'un .com
curl.exe -s https://rdap.verisign.com/com/v1/domain/atlasdepeche.com
```

---

## 8. Fichiers clés du projet

| Fichier | Rôle |
|---|---|
| `CLAUDE.md` | histoire et règles du projet (à jour au 2026-09-18, partiellement périmé) |
| `docs/MASTER_PROMPT.md` | spécification éditoriale |
| `src/db/schema.ts` / `schema-advertising.ts` | 20 tables |
| `src/db/migrate.ts` + `drizzle/` | 12 migrations → schéma reconstructible |
| `src/lib/public-site.ts` | requêtes du fil public |
| `src/app/(public)/[locale]/page.tsx` | accueil `force-dynamic`, liens sortants |
| `src/workers/radar.ts` | ingestion |
| `src/workers/cleanup.ts` | rétention 24 h |
| `src/proxy.ts` | protection admin (session signée vérifiée) |
| `src/lib/admin-auth.ts` | jetons HMAC + vérification des identifiants |
| `src/lib/require-admin.ts` | gardes page/action (`redirect`) et API (`401`) |
| `src/lib/login-rate-limit.ts` | anti-bruteforce login |
| `src/lib/admin-auth.test.ts` | 15 tests de session |
| `src/lib/login-rate-limit.test.ts` | 5 tests de limitation |
| `nixpacks.toml` | build Railway (à traduire en config Northflank/Render) |
| `.env.example` | inventaire complet des variables |

---

## 9. Pièges déjà rencontrés

| Piège | Réalité |
|---|---|
| « Il suffit de redéployer sur Railway » | non : la base ne répond pas, et Railway n'est plus gratuit |
| « Le domaine a un problème DNS » | non : le nom n'est pas enregistré |
| « Le site a besoin d'IA » | non : le fil public n'en utilise pas |
| « Il faut Redis / du stockage » | non : aucun usage dans le code |
| « Le Postgres gratuit de Render suffit » | non : il expire à 30 jours |
| « Vercel Hobby est gratuit » | interdit pour un usage commercial |
| « Cloudflare Workers peut héberger Next » | 10 ms de CPU, incompatible |
| « `npm audit fix --force` va tout régler » | non : il rétrograde `drizzle-kit` |

---

## 10. Contacts et accès

| Accès | État |
|---|---|
| GitHub `atlasdepeche/atlas---depeche` | lecture seule (`JAKORED`) |
| Railway projet `c3c652ab-041d-4497-a8ae-8beaa7402d98` | ❌ inaccessible |
| Registrar / DNS | ❌ inconnu |
| Meta / Instagram Business | inconnu (secrets GitHub, illisibles) |
| Compte Anthropic | inconnu (worker dormant) |

---

## 11. Règle de conduite

- Ne jamais affirmer un succès sans preuve exécutée.
- Ne jamais supprimer avant validation.
- Ne jamais écrire un secret dans un fichier, un log ou un commit.
- Marquer chaque affirmation `[VÉRIFIÉ]`, `[NON VÉRIFIÉ]` ou `[BLOQUÉ]`.
- S'arrêter et demander dès qu'une décision engage de l'argent, un domaine ou une
  suppression.
