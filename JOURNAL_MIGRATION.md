# Atlas Depeche — Journal de migration / connection

Dernière mise à jour : 2026-11-03

## Statut actuel : EN LIGNE

- **URL publique** : https://http--atlas-depeche-web--5pcylwlwx99p.code.run
- Hébergeur : **Northflank** (projet `default`, team `atlasdepeches-team`)
- Service : `atlas-depeche-web` (Next.js 16, build Dockerfile, branche `master`)
- Addon : `atlas-db` (PostgreSQL, statut `running`)
- Dernier commit déployé : `7aa1a0b`
- Santé : `/api/health` → 200, `/fr` → 200, `/ar` → 200

## Base de données (Northflank)

- Migrations Drizzle appliquées : `[db:migrate] done`
- Contenu actuel :
  - 85 sources
  - 25 entrées de gazetteer
  - 1288 items radar (`source_items`)
  - 1281 événements (`events`)
  - 2 articles publiés (ar) :
    - `/ar/article-313ae94a`
    - `/ar/article-782a2c5b`
- La une (`/fr`, `/ar`) est alimentée par les items radar : 50 cartes FR, 37 cartes AR.

## Corrections appliquées cette session

- `SITE_URL` corrigé : était `https://www.atlasdépêche.com` (domaine invalide, accent) →
  `https://http--atlas-depeche-web--5pcylwlwx99p.code.run`.
- Migrations exécutées avec l'utilisateur **admin** de l'addon
  (`EXTERNAL_POSTGRES_URI_ADMIN`) : l'utilisateur standard n'a pas le privilège `CREATE`.
- Radar lancé une fois (`npm run radar:once`) pour remplir la une.
- 2 articles syndiqués (souss-actualites.com) republiés via les scripts
  `scripts/manual-publish-souss-1.ts` / `-2.ts`.

## Points bloquants / restants

1. **Push GitHub impossible** : le PAT contenu dans le remote `origin` est expiré
   (`Invalid username or token`) et le compte `gh` (JAKORED) n'a pas les droits sur
   `atlasdepeche/atlas---depeche` (403). Northflank build depuis ce dépôt :
   toute nouvelle modification de code ne sera **pas** déployée tant que le push
   n'est pas rétabli. Actions possibles : générer un nouveau PAT côté compte
   `atlasdepeche`, ou ajouter `JAKORED` comme collaborateur du dépôt.
2. `ANTHROPIC_API_KEY` absente : les workers `verify` / `write` (rédaction IA) ne
   peuvent pas tourner. Seuls le radar et les publications manuelles fonctionnent.
3. `RESEND_API_KEY` absente : les alertes email sont ignorées.
4. `PUBLICATION_MODE=shadow` : rien n'est publié/distribué automatiquement.
5. Pas de domaine personnalisé : l'URL `code.run` est fonctionnelle mais technique.
   Un domaine custom (ex. `atlasdepeche.com`) reste à configurer côté DNS.

## Historique

- 2026-11-01 : clone, `npm ci`, `npm run build`, `.env` local, premiers scripts.
- 2026-11-02 : premier déploiement Northflank réussi (build + deployment COMPLETED).
- 2026-11-03 : vérification en ligne, migrations, seed radar, publication des
  2 articles, correction `SITE_URL`.

## Note Railway

Un projet Railway (`upbeat-presence`) existait avec `atlas---depeche` et `Postgres`,
mais **l'essai Railway a expiré** : aucun déploiement actif, base injoignable.
La migration a donc été finalisée sur Northflank.
