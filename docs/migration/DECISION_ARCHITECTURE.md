# Décision d'architecture

**Statut : en attente de votre décision.** Aucun choix n'a été appliqué.

---

## 1. Recommandation

### Architecture cible

```
GitHub (code, Actions cron)  ──►  Northflank Sandbox (1 service Node/Next.js)
        │                                   │
        │                                   ▼
        └──────────────────────────►  Northflank PostgreSQL (1 addon)

DNS : domaine → CNAME/ALIAS vers le domaine Northflank (*.code.run), TLS auto
```

- **1 service web** : `npm ci && npm run build && npm run start` (pas besoin de
  Dockerfile ; Northflank sait builder une app Node, sinon on en ajoute un).
- **1 addon PostgreSQL** : base managée incluse, sauvegardes incluses.
- **GitHub Actions inchangé** : les 5 crons continuent de tourner depuis GitHub,
  en pointant `DATABASE_URL` vers la nouvelle base.
- **Coût : 0 €**, sans carte, avec ≈ 10 $/mois de marge sous le plafond de 20 $.

### Pourquoi cette option

| Besoin | Réponse Northflank |
|---|---|
| Process Node long (`next start`) | oui, conteneur toujours allumé |
| PostgreSQL durable | addon inclus, sauvegardes incluses |
| Pas de carte | oui |
| Pas d'expiration | oui (contrairement au Postgres Render : 30 j) |
| Pas de réveil à froid | oui (« no sleeping ») |
| Domaine + TLS | inclus |
| Ram suffisante | 512 Mo–1 Go selon budget |
| Zéro maintenance | oui, managé |

### Condition suspensive **à lever avant de s'engager**

> Le plan s'appelle « **Sandbox** » et la documentation ne dit nulle part
> explicitement qu'un site public de production (a fortiori avec de la publicité)
> est autorisé. Les conditions générales contiennent une clause générale sur les
> « commercial endeavors ».

**Action à faire (par vous ou par moi si vous ouvrez un compte) :** envoyer une
question au support Northflank du type :

> « Is the free Sandbox plan allowed to host a permanent, publicly accessible
> production website for a news aggregator (with a small advertising module and a
> custom domain)? What happens if monthly resource usage approaches or exceeds the
> included $20? Do build minutes count toward that $20? »

Garder la réponse écrite. **Si la réponse est non ou ambiguous → basculer sur le
plan B.**

---

## 2. Plan B — Render Free + Neon Free

- Web : Render free (0,1 CPU / 512 Mo, veille après 15 min, réveil ~1 min).
- Base : Neon free (permanente, 1 Go, 100 CU-h/mois).
- Coût : 0 €, sans carte.

**Quand le choisir :** si Northflank refuse le cas d'usage, ou si vous préférez un
hébergeur plus « mainstream ».

**Ce qu'il faut accepter :** première visite lente après 15 min d'inactivité,
avertissement officiel Render « ne pas utiliser en production », et un risque de
suspension lié à l'accès à une base externe.

---

## 3. Plan C — Oracle Cloud Always Free (si carte acceptée)

- 2 OCPU ARM + 12 Go de RAM + 200 Go de disque + 10 To d'egress, gratuit à vie.
- Node + PostgreSQL installés sur la VM, Caddy pour le TLS.
- **Nécessite une carte bancaire** (vérification d'identité), et de la maintenance.
- Risque documenté de récupération des instances « inactives ».

**Quand le choisir :** si vous voulez de la puissance, de la robustesse, et que
vous acceptez une carte + l'administration d'un serveur.

---

## 4. Décisions qui vous appartiennent

### D1 — Hébergeur

| Choix | Conséquence |
|---|---|
| **A. Northflank Sandbox** (recommandé) | 0 €, toujours allumé, base incluse. Sous réserve de la confirmation du support. |
| **B. Render + Neon** | 0 €, plus mainstream, mais veille de 15 min et avertissement « pas pour la production ». |
| **C. Oracle Always Free** | 0 €, très puissant, mais **carte bancaire** et maintenance. |

### D2 — Domaine

[VÉRIFIÉ] Le domaine du brief **n'existe pas** : `www.xn--atlasdpche-b7a.com` est
NXDOMAIN, `atlasdepeche.com` n'est pas enregistré, aucune archive. Il n'y a donc
**rien à « conserver »** côté DNS.

Trois possibilités :

| Choix | Coût | Conséquence |
|---|---|---|
| **Sous-domaine gratuit** (`atlas-depeche.code.run`, `.onrender.com`, …) | 0 € | immédiat, mais moins crédible et dépendant du fournisseur |
| **Racheter un domaine** (ex. `atlasdepeche.com`) | ≈ 10–15 €/an | **n'est plus 0 €** ; à valider explicitement |
| **Fournir le vrai domaine** si vous en possédez un autre | 0 € | il faut me donner le nom exact et l'état DNS |

> **Question :** quel domaine voulez-vous réellement ? Celui du brief ne résout pas.
> Avez-vous acheté un domaine chez GoDaddy (le brief le mentionne) ? Si oui, lequel ?

### D3 — Base de données : comment récupérer les données ?

[VÉRIFIÉ] Sans accès à Railway, **aucun dump n'est possible**. Trois scénarios :

| Scénario | Ce qu'on récupère | Ce qu'on perd |
|---|---|---|
| **D3a. Dump Railway** (si vous obtenez l'accès) | tout, à l'identique | rien |
| **D3b. Schéma + seed** (12 migrations + `db:seed`) | structure complète, sources, lieux | `source_items`, `articles` historiques, `social_posts`, `audit_logs`, `ad_*` |
| **D3c. Attendre** que la base Railway redevienne joignable | tout | dépend de sa survie |

**Recommandation :** tenter D3a. Si l'accès échoue, faire D3b **sans supprimer la
base Railway**, pour pouvoir réimporter plus tard si elle revient.

### D4 — Correctifs de sécurité avant mise en ligne

| Correctif | Effort | Risque si non fait |
|---|---|---|
| Signer le cookie admin (HMAC) | ~30 min | **n'importe qui devient admin** |
| `ci.yml` : `main` → `master` | 1 ligne | aucun test en CI |
| Rate-limit sur le login | ~1 h | brute-force |

**Recommandation :** faire les deux premiers avant toute exposition publique.
Ils sortent du périmètre « migration » mais conditionnent la sûreté du site.

---

## 5. Ce qui ne change pas

- Aucune fonctionnalité supprimée.
- Aucune réorganisation du code.
- Aucune modification éditoriale.
- Railway reste intact tant que la nouvelle plateforme n'est pas validée.
- Le dépôt reste public ; aucun secret ne sera ajouté.

---

## 6. Résumé de la décision demandée

1. **Hébergeur** : A (Northflank), B (Render+Neon) ou C (Oracle, carte) ?
2. **Domaine** : sous-domaine gratuit, rachat (~10–15 €/an), ou un domaine existant ?
3. **Données** : dump Railway (accès à fournir), ou reconstruction schéma+seed ?
4. **Sécurité** : autorisez-vous les correctifs D4 avant la mise en ligne ?
