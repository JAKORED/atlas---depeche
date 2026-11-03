# Atlas Depeche — Déploiement Northflank (préparé localement)

Repo : atlasdepeche/atlas---depeche
Status build : COMPILÉ (npm run build OK)

## Commandes faites
- git clone
- npm ci
- npm run build

## Pour déployer sur Northflank
Service nécessaire : Docker (Dockerfile présent)

Variables requises (copier depuis .env.example) :
- DATABASE_URL
- ANTHROPIC_API_KEY
- ADMIN_USER / ADMIN_PASSWORD_HASH / ADMIN_SECRET_KEY
- SITE_URL (ex: https://atlasdepeche.app)

## Prochaines étapes (nécessitent ton action directe)
1. Configurer le service sur https://app.northflank.com/u/atlasdepeche
2. Fournir DATABASE_URL (Postgres)
3. Fournir ANTHROPIC_API_KEY
4. Déclencher le build / deploy

Aucun token Northflank ni accès au dashboard disponible localement.
