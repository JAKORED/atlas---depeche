# Plan de migration

Ce plan part de l'hypothèse **A (Northflank Sandbox)**. Les variantes B et C sont
notées en fin de document.

**Principe directeur :** ne rien détruire avant que la nouvelle plateforme ne soit
prouvée. Railway et son éventuelle base restent intacts jusqu'à la validation.

---

## Phase 0 — Préparation (déjà partiellement faite)

| # | Action | État |
|---|---|---|
| 0.1 | Cloner le dépôt, vérifier la branche et le commit | ✅ |
| 0.2 | Réparer le build (`@types/fluent-ffmpeg`) | ✅ local |
| 0.3 | Mettre Next.js à jour (16.4.3) | ✅ local |
| 0.4 | Prouver le socle vert (lint/typecheck/test/build) | ✅ local |
| 0.5 | Scanner l'historique Git à la recherche de secrets | ✅ aucun secret |
| 0.6 | **Pousser les correctifs sur GitHub** | 🚫 **bloqué : pas de droit `push`** |
| 0.7 | Corriger `ci.yml` (`main` → `master`) | ⏸ proposé, en attente |

**Critère de sortie :** un commit vert sur `master`, CI déclenchée et verte.

---

## Phase 1 — Obtenir les accès

| # | Action | Qui |
|---|---|---|
| 1.1 | Droit `push` sur `atlasdepeche/atlas---depeche`, **ou** pousser les commits fournis | vous |
| 1.2 | Accès Railway au projet `c3c652ab-…` (rôle admin/member) | vous |
| 1.3 | Confirmer le domaine réel et l'accès registrar | vous |
| 1.4 | Créer le compte Northflank (gratuit, sans carte) | vous ou moi avec vos identifiants |
| 1.5 | Confirmation écrite du support Northflank sur l'usage « production » | vous ou moi |

**Critère de sortie :** les 5 points sont disponibles.

---

## Phase 2 — Sauvegarder la base de production

### 2.1 Test de connectivité

```bash
# avec railly / psql et l'URL fournie par Railway
psql "$OLD_DATABASE_URL" -c "select version();"
psql "$OLD_DATABASE_URL" -c "select count(*) from sources;"
```

Si `ECONNRESET` persiste, la base est probablement arrêtée ou supprimée :

- vérifier dans le dashboard Railway que le service Postgres existe et est démarré ;
- tenter un redémarrage ;
- si la base est définitivement perdue → passer en 2.3.

### 2.2 Dump complet (si la base répond)

```bash
pg_dump "$OLD_DATABASE_URL" \
  --no-owner --no-privileges --format=custom \
  --file=atlas_$(date +%Y%m%d_%H%M).dump
```

Puis **vérifier le dump** avant de continuer :

```bash
pg_restore --list atlas_YYYYMMDD_HHMM.dump | head -50
sha256sum atlas_YYYYMMDD_HHMM.dump
```

**Le dump ne doit jamais être commité** (contient potentiellement des données et
des secrets). Le stocker hors dépôt, dans un endroit chiffré.

### 2.3 Repli : reconstruction du schéma

Si aucun dump n'est possible :

```bash
export DATABASE_URL="postgres://...nouvelle_base..."
npm run db:migrate   # applique drizzle/0000 → 0012
npm run db:seed      # sources + gazetteer
```

**Perte assumée et documentée :** `source_items` (régénéré), articles et
historique social/audit/publicité. La base Railway n'est **pas** supprimée : elle
pourra être réimportée plus tard.

**Critère de sortie :** dump vérifié, ou schéma+seed recréés et comptés.

---

## Phase 3 — Provisionner la nouvelle plateforme

### 3.1 Base

1. Créer un projet Northflank.
2. Ajouter un addon **PostgreSQL** (0,1 vCPU / 256 Mo / 10 Go pour commencer).
3. Récupérer la chaîne de connexion (`DATABASE_URL`), en **mode poolé** si proposé.
4. Noter les identifiants dans un gestionnaire de secrets, **jamais** dans Git.

### 3.2 Service web

1. Créer un service depuis le dépôt GitHub (`atlasdepeche/atlas---depeche`,
   branche `master`).
2. Build : `npm ci && npm run build` — Start : `npm run start`.
3. Node ≥ 20 (le projet déclare `engines: >=20`). Choisir Node 22 ou 24.
4. Ressources : **0,2 vCPU / 512 Mo** pour démarrer (monter à 0,5/1 Go si besoin).
5. Variables d'environnement minimales :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | chaîne fournie par l'addon |
| `NODE_ENV` | `production` |
| `PORT` | `3000` (ou celle imposée par la plateforme) |
| `SITE_URL` | `https://<domaine final>` |
| `PUBLICATION_MODE` | `shadow` (on ne change pas le comportement éditorial) |
| `ADMIN_USER` | à définir |
| `ADMIN_PASSWORD_HASH` | hash SHA-256 d'un mot de passe fort |

Ne **pas** recopier `ANTHROPIC_API_KEY` ni les jetons sociaux à l'aveugle : ils ne
sont utiles qu'aux workers, qui tournent dans GitHub Actions. Les secrets Facebook/
Instagram restent dans les secrets GitHub.

### 3.3 Domaine

- **Sous-domaine gratuit** : utiliser celui fourni (`*.code.run`), rien à faire.
- **Domaine existant** : ajouter un `CNAME` (ou `ALIAS`/`A` selon l'instruction de
  la plateforme), attendre le certificat TLS. **Aucun changement DNS sans votre
  accord explicite.**

**Critère de sortie :** l'URL publique répond, TLS valide.

---

## Phase 4 — Migrer les données

```bash
# nouvelle base
pg_restore --no-owner --no-privileges --clean --if-exists \
  --dbname="$NEW_DATABASE_URL" atlas_YYYYMMDD_HHMM.dump
```

Si `--clean` échoue parce que les migrations ont déjà créé les tables :

```bash
# option propre : base vide, puis restauration
psql "$NEW_DATABASE_URL" -c "drop schema public cascade; create schema public;"
pg_restore --no-owner --no-privileges --dbname="$NEW_DATABASE_URL" atlas_YYYYMMDD_HHMM.dump
```

Puis vérifier l'intégrité (voir `TESTS_MIGRATION.md`, section « Intégrité des
données »).

---

## Phase 5 — Rebrancher les workflows GitHub Actions

Dans **Settings → Secrets and variables → Actions** :

1. Remplacer `DATABASE_URL` par la nouvelle chaîne.
2. Vérifier que `SITE_URL` (si utilisé) pointe vers le nouveau domaine.
3. Conserver tous les autres secrets.

Puis déclencher manuellement, dans cet ordre, et vérifier les logs :

```bash
gh workflow run radar.yml       # ingestion
gh workflow run cleanup.yml     # purge 24 h
gh workflow run distribute.yml  # réseaux
```

**Attention :** `distribute.yml` publie réellement sur X/Telegram si les drapeaux
sont activés. Vérifier `DISTRIBUTION_*_ENABLED` avant de le lancer, ou le laisser
attendre le prochain cron.

**Critère de sortie :** un run `radar` vert qui insère de nouvelles lignes dans
`source_items`.

---

## Phase 6 — Validation de bout en bout

Voir `TESTS_MIGRATION.md`. Ne pas passer à la phase 7 avant que tout soit vert.

---

## Phase 7 — Bascule et nettoyage (seulement après validation)

1. Annoncer la nouvelle URL.
2. Laisser Railway allumé **au moins 7 jours** (filet de sécurité).
3. Ensuite seulement : mettre Railway en pause (pas supprimer), conserver le dump.
4. Après 30 jours sans incident : suppression possible, **avec votre accord écrit**.

---

## Variante B — Render + Neon

1. Créer la base sur Neon (région proche du Maroc : `eu-central-1` ou `eu-west-2`).
2. Créer le service web sur Render depuis GitHub :
   - Build : `npm ci && npm run build`
   - Start : `npm run start`
   - Plan : Free, Node 22.
3. Variables identiques, `DATABASE_URL` = Neon (avec `?sslmode=require`).
4. Domaine : `*.onrender.com`, ou domaine perso.
5. Mettre en place une surveillance de l'endpoint `/api/health` **sans** chercher à
   contourner la veille (pas de ping artificiel : cela consommerait les 750 h et
   pourrait déclencher la limite de trafic sortant).
6. Le reste du plan (phases 4 à 7) est identique.

---

## Variante C — Oracle Cloud

1. Créer une VM `VM.Standard.A1.Flex` (1–2 OCPU, 6–12 Go), Ubuntu 24.04.
2. Ouvrir 80/443 dans la security list **et** dans `ufw`.
3. Installer Node 22, PostgreSQL 16, Caddy.
4. Créer la base et l'utilisateur, `DATABASE_URL` en local.
5. `git clone`, `npm ci`, `npm run build`, service `systemd` pour `npm run start`.
6. Caddy en reverse proxy + TLS automatique.
7. Sauvegardes : `pg_dump` quotidien + `rclone`/stockage objet, cron.
8. Surveiller l'activité pour éviter la récupération d'instance inactive.

---

## Points de contrôle obligatoires

- [ ] Aucun secret dans Git (`git log -p | grep -iE "api_key|token|password"`).
- [ ] L'ancienne base n'est ni supprimée ni écrasée.
- [ ] Le dump est vérifié (`pg_restore --list`) et stocké hors dépôt.
- [ ] Le nombre de lignes des tables critiques est identique avant/après.
- [ ] Les pages `/fr` et `/ar` affichent des articles avec liens sortants corrects.
- [ ] Le RTL arabe est correct.
- [ ] Les crons GitHub Actions repassent au vert.
- [ ] Le domaine et le TLS fonctionnent.
- [ ] `/api/health` répond.
- [ ] Les pages admin ne sont pas accessibles sans authentification.
