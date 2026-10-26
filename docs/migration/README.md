# Migration Atlas Dépêche — hébergement 0 €

Index de la documentation de migration.

**Dernière mise à jour : 2026-10-25**
**Auteur : audit technique automatisé (OpenCode) — à relire et valider par le propriétaire.**

---

## Statut global

| Étape | État | Détail |
|---|---|---|
| Phase A — Audit technique réel | ✅ terminé | Voir [AUDIT_INITIAL.md](./AUDIT_INITIAL.md) |
| Phase B — Recherche 5 hébergeurs | ✅ terminé | Voir [COMPARATIF_HEBERGEURS.md](./COMPARATIF_HEBERGEURS.md) |
| Phase C — Décision d'architecture | ⏸ **en attente de votre décision** | Voir [DECISION_ARCHITECTURE.md](./DECISION_ARCHITECTURE.md) |
| Phase D — Migration effective | 🚫 bloqué | Accès Railway/DB + droit d'écriture GitHub manquants |
| Phase E — Tests de bout en bout | 🚫 bloqué | Dépend de la Phase D |

**Ce qui a déjà été corrigé dans le dépôt local (non poussé) :**

1. Le build cassé (erreur TypeScript `TS7016` sur `fluent-ffmpeg`) est réparé → `npm run build` passe.
2. Next.js est passé de `16.3.5` à `16.4.3` (correction de la faille critique RCE) → plus aucune vulnérabilité critique.
3. Le socle est vert : `lint`, `typecheck`, `test` (131/131), `build`.

Rien n'a été poussé : le compte GitHub utilisé (`JAKORED`) a un accès **lecture seule** sur `atlasdepeche/atlas---depeche`.

---

## Les 10 documents

| Fichier | Rôle |
|---|---|
| [README.md](./README.md) | Ce document : index et statut |
| [ETAT_ACTUEL.md](./ETAT_ACTUEL.md) | État réel constaté du projet et de la production |
| [AUDIT_INITIAL.md](./AUDIT_INITIAL.md) | Audit technique : stack, code, sécurité, CI, build |
| [COMPARATIF_HEBERGEURS.md](./COMPARATIF_HEBERGEURS.md) | Les 5 options d'hébergement 0 €, sources officielles |
| [DECISION_ARCHITECTURE.md](./DECISION_ARCHITECTURE.md) | Recommandation, alternatives, décision demandée |
| [PLAN_MIGRATION.md](./PLAN_MIGRATION.md) | Plan de migration étape par étape |
| [TESTS_MIGRATION.md](./TESTS_MIGRATION.md) | Plan de tests et résultats déjà obtenus |
| [RETOUR_ARRIERE.md](./RETOUR_ARRIERE.md) | Procédure de rollback |
| [JOURNAL_OPERATIONS.md](./JOURNAL_OPERATIONS.md) | Journal horodaté de toutes les actions |
| [REPRISE_OPENCODE.md](./REPRISE_OPENCODE.md) | Protocole de reprise pour la prochaine session |

---

## Conventions de statut

Chaque affirmation porte un marqueur :

- **[VÉRIFIÉ]** — constaté directement (commande exécutée, réponse HTTP, page officielle consultée le 2026-10-25).
- **[NON VÉRIFIÉ]** — plausible ou rapporté, mais non contrôlable avec les accès actuels.
- **[BLOQUÉ]** — impossible à établir sans une action ou un accès de votre part.

---

## Les 4 blocages qui nécessitent votre intervention

1. **Droit d'écriture GitHub.** Le compte authentifié a `push: false`, `admin: false`. Impossible de pousser docs ou code.
2. **Accès à la base PostgreSQL de production.** Aucun accès au projet Railway ; la base répond `ECONNRESET`. Sans dump, aucune migration de données vérifiable.
3. **Le vrai nom de domaine.** `www.xn--atlasdpche-b7a.com` ne résout pas (NXDOMAIN) et `atlasdepeche.com` n'est pas enregistré. Il faut le domaine réel et l'état DNS chez le registrar.
4. **Autorisation d'utiliser une carte bancaire** (vérification d'identité, sans débit) si vous choisissez l'option Oracle Cloud, seule option réellement « production » gratuite à vie.

Détail et options : [DECISION_ARCHITECTURE.md](./DECISION_ARCHITECTURE.md).
