# Retour arrière (rollback)

Objectif : pouvoir revenir à l'état antérieur **sans perte**, à tout moment.

---

## Règle d'or

**Ne rien supprimer avant 30 jours de fonctionnement stable sur la nouvelle
plateforme.** Railway, son projet et son éventuelle base restent en place, même
éteints.

---

## Point de retour n°1 — Code

### État de référence

| Élément | Valeur |
|---|---|
| Commit d'origine | `9705f87` |
| Branche | `master` |
| Dépôt | `https://github.com/atlasdepeche/atlas---depeche` |

### Annuler les correctifs locaux (avant tout push)

```bash
cd C:\Users\Chaima\atlas-depeche
git checkout -- package.json package-lock.json
# ou, si un commit a été créé :
git revert <sha_du_commit>
```

### Revenir à un déploiement Railway antérieur

Le dernier déploiement réussi date du **2026-09-22**. Dans Railway :
**Deployments → choisir un déploiement du 2026-09-22 → Redeploy**.

⚠️ Ce déploiement embarque `next@16.3.5` (faille critique) : à ne faire que si la
nouvelle plateforme est indisponible **et** en connaissance de cause.

---

## Point de retour n°2 — Base de données

### Si un dump a été fait

```bash
# sur l'ancienne base (si elle est encore vivante)
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname="$OLD_DATABASE_URL" atlas_YYYYMMDD_HHMM.dump
```

### Si aucun dump n'a été fait

L'ancienne base Railway n'a **pas** été touchée par la migration. Il suffit de :

1. remettre l'ancien `DATABASE_URL` dans les secrets GitHub Actions :
   ```bash
   gh secret set DATABASE_URL --repo atlasdepeche/atlas---depeche
   ```
2. relancer un cron `radar.yml` pour vérifier ;
3. si la base répond, tout est revenu.

### Si la nouvelle base a reçu des écritures entre-temps

Les données créées sur la nouvelle base après la bascule (nouveaux `source_items`,
`social_posts`, `audit_logs`) seraient perdues en cas de retour arrière. Pour les
conserver :

```bash
# exporter de la nouvelle base les tables à conserver
pg_dump "$NEW_DATABASE_URL" -t social_posts -t audit_logs -t sources \
  --data-only --format=custom --file=delta.dump
# puis réimporter sur l'ancienne
pg_restore --data-only --no-owner --dbname="$OLD_DATABASE_URL" delta.dump
```

---

## Point de retour n°3 — DNS et domaine

**Aucun changement DNS ne sera fait sans votre accord écrit.** Si un changement a
lieu et doit être annulé :

1. remettre l'enregistrement précédent (CNAME/A) chez le registrar ;
2. attendre la propagation (de quelques minutes à 48 h selon le TTL) ;
3. vérifier avec :
   ```bash
   nslookup <domaine> 1.1.1.1
   curl -I https://<domaine>
   ```

> Rappel : il n'existe aujourd'hui **aucun** enregistrement DNS pour le domaine du
> brief, donc il n'y a rien à restaurer. Le rollback DNS ne concernera qu'un
> domaine que vous fournirez.

---

## Point de retour n°4 — GitHub Actions

Les workflows ne changent pas. Seul le secret `DATABASE_URL` change.

```bash
# sauvegarder l'ancienne valeur avant de la remplacer (hors dépôt)
gh secret list --repo atlasdepeche/atlas---depeche

# revenir en arrière
gh secret set DATABASE_URL --repo atlasdepeche/atlas---depeche
```

Les secrets ne sont pas lisibles après coup : c'est pourquoi il faut noter
l'ancienne chaîne **avant** de la remplacer, dans un gestionnaire de mots de passe.

---

## Matrice de décision

| Situation | Action |
|---|---|
| Le nouveau site ne démarre pas | revenir au code précédent ; Railway reste en place |
| Le nouveau site démarre mais la base est vide | restaurer le dump, sinon revenir à l'ancien `DATABASE_URL` |
| Les données sont corrompues après restauration | revenir à l'ancienne base, ne pas réessayer à l'aveugle |
| Les crons échouent sur la nouvelle base | remettre l'ancien `DATABASE_URL`, vérifier les droits réseau/SSL |
| Le domaine ne résout plus | remettre l'enregistrement DNS précédent |
| Doute | **ne rien supprimer**, documenter, demander |

---

## Délais de conservation recommandés

| Ressource | Conservation minimale |
|---|---|
| Dump SQL | 90 jours, hors dépôt, chiffré |
| Ancien projet Railway | 30 jours après validation |
| Ancienne base Railway | 30 jours (ne pas supprimer) |
| Anciennes variables d'environnement | tant que l'ancien déploiement existe |
| Ce document | permanent |

---

## Ce qu'il ne faut jamais faire

- `git push --force` sur `master`.
- `drop database` sur l'ancienne base.
- Supprimer le projet Railway avant validation.
- Écraser `DATABASE_URL` sans avoir noté l'ancienne valeur.
- Commiter un dump, un `.env` ou un secret.
- Modifier le DNS « pour tester » sans prévenir.
