# Atlas Depeche — Journal de migration / connection (session 2026-11-01)

## Connexion / Authentification
- Northflank CLI installé : `@northflank/cli@0.15.0`
- Login réussi : `autologin-atlasdepeches-team-1793560511757`
- Dashboard : https://app.northflank.com/u/atlasdepeche
- GitHub repo : https://github.com/atlasdepeche/atlas---depeche (public)

## Migration / Déploiement (status)
- Clone OK
- npm ci OK
- npm run build OK (Next.js 16.4.3)
- .env créé avec DATABASE_URL, ADMIN_SECRET_KEY, etc.
- Serveur local : `npm start` actif (localhost:3000)
- DB migrate : échoué (pas de Postgres local) — à faire sur Northflank
- Déploiement Northflank : CLI connecté, prêt à push

## TikTok (factivibes) — session liée
- 3 vidéos postées (auto_021, auto_041 publiées ; auto_001 réconciliée)
- Anti-doublon OK
- Audit `factivibes` validé (AUDIT_FACTVIBES.md)

## Prochaines étapes (à faire manuellement)
1. Fournir DATABASE_URL réelle (Postgres sur Northflank ou Railway)
2. `npm run db:migrate` avec la vraie DB
3. `northflank dev --name atlas-depeche` (ou deploy via dashboard)
4. Remplir `.env` avec ANTHROPIC_API_KEY si nécessaire

Fichier créé le 2026-11-01 — session CLI local.
