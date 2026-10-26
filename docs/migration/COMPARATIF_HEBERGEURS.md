# Comparatif des hébergeurs 0 €

**Date de vérification : 2026-10-25.** Toutes les limites ci-dessous viennent des
pages officielles listées en fin de fiche. Les prix et quotas changent souvent :
re-vérifier avant de s'engager.

## Le besoin réel (rappel)

[VÉRIFIÉ] Atlas Dépêche a besoin de :

1. **un process Node long** (`next start`, pas de `output: standalone`) ;
2. **une base PostgreSQL persistante** (20 tables, dont la configuration des sources) ;
3. **aucun** Redis, stockage objet, disque persistant, ou calcul lourd (tout le
   calcul est dans GitHub Actions) ;
4. **un domaine personnalisé** si possible ;
5. **zéro carte bancaire, zéro débit, zéro expiration** ;
6. assez de RAM pour un serveur Next.js (512 Mo est un plancher réaliste,
   256 Mo est très juste).

Contrainte forte : les pages publiques sont **dynamiques** (`force-dynamic`). Un
hébergeur qui facture à l'exécution de fonction (serverless) est donc structurellement
plus risqué qu'un petit serveur toujours allumé.

---

## Option 1 — Northflank Sandbox **(recommandée)**

**Offre :** plateforme PaaS (conteneurs + bases managées). Plan « Sandbox » gratuit.

| Limite | Valeur | Source |
|---|---|---|
| Carte bancaire | **non requise** | pricing |
| Coût | **0 $**, « up to $20/mo of resources » inclus | pricing |
| Services | 2 | pricing |
| Jobs (cron) | 2 | pricing |
| Addons (bases) | **1** | pricing |
| Mise en veille | **jamais** (« Always on, no sleeping ») | pricing |
| Domaines personnalisés | inclus, TLS automatique | pricing |
| Volumes persistants | inclus | pricing |
| Sauvegardes / restauration DB | inclus | pricing |
| Scaling horizontal / autoscaling | **non** | pricing |
| Scaling vertical | « Limited » | pricing |
| Support | « Best effort » | pricing |

**Tarifs à l'usage (pour calculer ce que couvrent les 20 $) :**

| Ressource | Prix |
|---|---|
| CPU | 0,01667 $ / vCPU / heure (≈ 12,17 $/mois par vCPU) |
| RAM | 0,00833 $ / Go / heure (≈ 6,08 $/mois par Go) |
| Disque persistant | 0,11657 $ / GiB / mois |
| Egress réseau | 0,06 $ / Go |

**Dimensionnement qui tient dans les 20 $/mois :**

| Composant | Config | Coût estimé |
|---|---|---|
| Service web Next.js | 0,2 vCPU + 512 Mo | ≈ 5,47 $ |
| PostgreSQL | 0,1 vCPU + 256 Mo + 10 Go | ≈ 3,91 $ |
| **Total** | | **≈ 9,40 $/mois** |

Variante plus confortable (0,5 vCPU + 1 Go pour le web, 0,2 vCPU + 512 Mo pour
Postgres) : ≈ 18,80 $/mois — tient encore, mais sans marge.

**Pourquoi ça colle :** un seul fournisseur pour le web **et** la base, toujours
allumé (donc pas de démarrage à froid d'une minute), domaine + TLS inclus,
sauvegardes incluses, aucune carte. C'est le seul PaaS gratuit sans carte qui
réunisse « toujours allumé + base incluse + domaine ».

**Risques / réserves :**

- [NON VÉRIFIÉ] **Le nom « Sandbox » et l'absence de mention explicite de
  production.** La page produit parle de « sandboxes » pour du prototypage et des
  agents. Rien n'interdit explicitement un site public, mais rien ne l'autorise
  noir sur blanc non plus. À faire confirmer par le support avant de s'engager.
- [NON VÉRIFIÉ] **Comportement au-delà de 20 $/mois** : coupure, mise en pause,
  ou facturation ? Aucune carte n'étant enregistrée, une facturation est peu
  probable, mais il faut le faire préciser.
- [NON VÉRIFIÉ] **Les builds comptent-ils dans les 20 $ ?** Non documenté.
- [VÉRIFIÉ] Les **conditions générales** n'interdisent pas explicitement un usage
  commercial, mais contiennent une clause générale (« The Services may not be used
  in connection with any commercial endeavors except those that are specifically
  endorsed or approved by us ») qu'il faut lire comme visant le contenu de
  Northflank, pas votre application. Zone grise à clarifier si le site porte de la
  publicité.
- [VÉRIFIÉ] Pas de scaling horizontal : un seul conteneur. Suffisant pour un site
  d'actualité à trafic modéré, pas pour un pic viral.

---

## Option 2 — Render Free + Neon Free

**Offre :** PaaS gratuit (web) + Postgres serverless gratuit (Neon).

| Limite | Valeur | Source |
|---|---|---|
| Render : carte | non requise | docs/free |
| Render : compute gratuit | **0,1 CPU / 512 Mo** | docs/free |
| Render : heures | **750 h/mois** par workspace | docs/free |
| Render : mise en veille | après **15 min** sans trafic ; réveil ≈ **1 min** | docs/free |
| Render : domaine perso + TLS | oui | docs/free |
| Render : disque persistant | **non** sur le plan gratuit | docs/free |
| Render : Postgres gratuit | **expire après 30 jours**, puis supprimé après 14 j de grâce | docs/free |
| Render : position officielle | « **Do not use them for production applications.** » | docs/free |
| Neon : carte | non requise | pricing |
| Neon : plan gratuit | **permanent**, pas un essai | pricing |
| Neon : compute | **100 CU-heures/projet/mois** | pricing |
| Neon : stockage | **1 Go/projet**, 20 Go/compte | pricing |
| Neon : egress | 5 Go/projet | pricing |
| Neon : scale-to-zero | après **5 min** d'inactivité | pricing |
| Neon : projets | 100 | pricing |

**Pourquoi ça peut marcher :** Render héberge le Node, Neon la base. Les deux sont
gratuits sans carte et sans date d'expiration (à condition d'utiliser Neon, **pas**
le Postgres gratuit de Render qui meurt à 30 jours). Le cron de 30 min maintient
Neon éveillé et consomme très peu de CU-heures (≈ 9 CU-h/mois sur 100).

**Pourquoi ce n'est pas mon premier choix :**

- [VÉRIFIÉ] **Render dit explicitement de ne pas l'utiliser en production.** C'est
  un avertissement officiel, pas une rumeur.
- [VÉRIFIÉ] **Veille de 15 min → 1 min de latence** pour le premier visiteur après
  une accalmie, avec une page d'attente Render. Mauvais pour la crédibilité d'un
  site d'actualité.
- [VÉRIFIÉ] **Risque de suspension spécifique à notre cas** : Render peut suspendre
  un service gratuit qui génère « un volume inhabituellement élevé de trafic sortant
  vers l'internet », et cite **explicitement « Accessing an external database »**
  comme exemple. Or notre base serait précisément externe (Neon). Risque non
  quantifié mais réel.
- [VÉRIFIÉ] 750 h/mois ≈ 744 h dans un mois de 31 jours : la marge est de ~6 h.
  Un seul service qui resterait éveillé tout le mois consomme quasiment tout le
  quota ; au-delà, **tous** les services gratuits sont suspendus jusqu'au mois
  suivant. Aucune astuce de « ping » n'est donc vraiment sûre.
- [VÉRIFIÉ] Pas de sauvegardes sur le Postgres gratuit Render (de toute façon
  inutilisable > 30 j).

**Verdict :** bon **plan de secours** si Northflank refuse le cas d'usage. Pas
recommandé en premier.

---

## Option 3 — Oracle Cloud « Always Free » (VM + Postgres auto-hébergé)

**Offre :** infrastructure IaaS gratuite à vie (VM + stockage + réseau).

| Limite | Valeur | Source |
|---|---|---|
| Carte bancaire | **requise à l'inscription** (vérification d'identité, empreinte ~1 $ remboursée) | à confirmer au signup |
| Durée | « for the life of the account » | docs Always Free |
| Compute A1 (ARM) | **1 500 OCPU-h + 9 000 Go-h/mois** = **2 OCPU + 12 Go en permanence** | docs Always Free |
| Compute AMD | jusqu'à **2 VM** `VM.Standard.E2.1.Micro` (1/8 OCPU, **1 Go** chacune) | docs Always Free |
| Stockage bloc | **200 Go** au total (boot + volumes) | docs Always Free |
| Stockage objet | 20 Go | docs Always Free |
| Egress | **10 To/mois** | docs Always Free |
| Base managée gratuite | 2 × Autonomous AI Database (20 Go) — **pas PostgreSQL** | docs Always Free |
| Load balancer | 1 flexible 10 Mbps | docs Always Free |

**Pourquoi c'est puissant :** 2 OCPU + 12 Go + 200 Go + 10 To de trafic, gratuit
sans limite de durée. C'est de très loin la meilleure puissance. On y installerait
Node + PostgreSQL (ou Postgres dans un conteneur), avec Caddy/Nginx pour le TLS.

**Pourquoi ce n'est pas mon premier choix :**

- [VÉRIFIÉ] **Carte bancaire obligatoire** à l'inscription. Même sans débit, cela
  contredit votre exigence « aucune carte ». **Décision vous appartient.**
- [VÉRIFIÉ] **Récupération des instances inactives.** Oracle peut reprendre une
  instance Always Free jugée inactive si, sur 7 jours : CPU 95ᵉ percentile < 20 %,
  réseau < 20 %, et mémoire < 20 %. Un petit site d'actualité est **exactement**
  dans cette zone. Risque de suppression non nul, explicitement documenté.
- [VÉRIFIÉ] **Pénurie de capacité** : erreurs « out of host capacity » fréquentes
  sur les shapes A1 selon la région ; il faut parfois réessayer pendant des jours.
- [VÉRIFIÉ] **Aucun PostgreSQL managé gratuit** : il faut administrer la base
  soi-même (mises à jour, sauvegardes, TLS, redémarrages). C'est un travail
  récurrent, pas un hébergement « clé en main ».
- [VÉRIFIÉ] Aucune sauvegarde automatique : il faut écrire les scripts.

**Verdict :** la seule option réellement « production » gratuite à vie, mais au
prix d'une carte et d'une administration système. À considérer si vous voulez de
la puissance et acceptez la maintenance.

---

## Option 4 — Netlify Free + Neon Free

**Offre :** plateforme serverless/JAMstack avec un quota de « crédits ».

| Limite | Valeur | Source |
|---|---|---|
| Carte | non requise | pricing |
| Crédits | **300 crédits/mois** | pricing |
| Déploiements de production | **15 crédits** chacun | pricing |
| Compute | **10 crédits / Go-heure** | pricing |
| Bande passante | **20 crédits / Go** | pricing |
| Requêtes web | **2 crédits / 10 000 requêtes** | pricing |
| Domaines perso + TLS | inclus | pricing |

**Pourquoi ça peut marcher :** 300 crédits ≈ 30 Go-heures de compute. Avec des
pages dynamiques à ~200 ms et 512 Mo, cela représente environ 200 000 pages vues
par mois, plus ~10 déploiements (150 crédits) et la bande passante. Sur le papier,
suffisant pour un site de niche.

**Pourquoi ce n'est pas recommandé :**

- [VÉRIFIÉ] Le modèle **à crédits** rend le coût imprévisible : un crawl agressif
  (Googlebot, réseaux sociaux) consomme du compute **et** de la bande passante
  **et** des requêtes. Un pic peut épuiser le mois.
- [VÉRIFIÉ] Les pages sont `force-dynamic` : chaque visite = une exécution de
  fonction. Aucune page statique à servir depuis le CDN.
- [NON VÉRIFIÉ] Le support de Next.js 16 par l'adaptateur Netlify pour les Server
  Actions, le proxy et les routes API du projet — non testé, et l'adaptateur doit
  souvent être ajouté au code (modification du projet).
- [VÉRIFIÉ] 10 déploiements/mois = 150 des 300 crédits. La marge réelle est donc
  **la moitié** de ce qu'on croit.

**Verdict :** viable seulement en faible trafic et faible fréquence de déploiement.
Trop fragile pour un site d'actualité.

---

## Option 5 — Cloudflare Workers Free

| Limite | Valeur | Source |
|---|---|---|
| Requêtes | **100 000 / jour** | Workers limits |
| CPU par requête | **10 ms** | Workers limits |
| Mémoire | **128 Mo** | Workers limits |
| Sous-requêtes | 50 / requête | Workers limits |
| Cron triggers | 5 / compte | Workers limits |

**Pourquoi c'est éliminé :** 10 ms de CPU par requête est **incompatible** avec un
rendu Next.js dynamique. La documentation Cloudflare indique elle-même que les
charges de « server-side rendering » consomment typiquement 10 à 20 ms — soit le
plafond, voire au-delà. Il faudrait réécrire l'application pour l'edge (adaptateur
OpenNext, contournements), ce qui sort du périmètre « ne pas réorganiser le code ».

**Verdict :** écarté.

---

## Options écartées d'office

| Offre | Raison | Source |
|---|---|---|
| **Vercel Hobby** | politique d'usage loyal réservée à un usage **personnel non commercial** ; un site d'actualité avec publicité n'est pas couvert | Vercel fair use |
| **Fly.io** | plus d'offre gratuite ; la plus petite machine toujours allumée coûte ≈ 2,19 $/mois | pricing Fly |
| **Koyeb** | plus d'offre gratuite ; plans à partir de 29 $/mois | pricing Koyeb |
| **Railway** | offre d'essai, puis facturation ; c'est la plateforme que l'on quitte | — |
| **Supabase Free** | 500 Mo, **pause après 1 semaine d'inactivité** (le cron de 30 min l'éviterait) ; bon candidat **base seule** | pricing Supabase |
| **Prisma Postgres Free** | 2 Go, 200 000 opérations/mois, sans carte ; bon candidat **base seule** | pricing Prisma |

---

## Base de données : quelle option gratuite pour un usage durable ?

| Fournisseur | Gratuit | Carte | Expiration | Limite gênante |
|---|---|---|---|---|
| **Neon** | 100 CU-h + 1 Go | non | **aucune** | scale-to-zero 5 min, 5 Go d'egress |
| **Prisma Postgres** | 2 Go + 200k op./mois | non | aucune | 200k opérations = vite atteint avec un site dynamique |
| **Supabase** | 500 Mo | non | pause après 7 j d'inactivité | 500 Mo |
| **Northflank** (addon) | inclus dans les 20 $ | non | aucune | 1 seul addon |
| **Render Postgres** | 1 Go | non | **30 jours** | inutilisable |

**Conclusion base :** Neon est la meilleure base gratuite autonome (pas
d'expiration, la plus généreuse). Si on prend Northflank pour le web, prendre sa
base incluse évite un fournisseur de plus.

---

## Tableau de synthèse

| Critère | Northflank | Render+Neon | Oracle | Netlify+Neon | Cloudflare |
|---|---|---|---|---|---|
| Coût réel | 0 $ | 0 $ | 0 $ (carte) | 0 $ | 0 $ |
| Carte requise | non | non | **oui** | non | non |
| Toujours allumé | **oui** | non (15 min) | oui | oui (serverless) | oui |
| Latence à froid | 0 | **~1 min** | 0 | ~0 | 0 |
| PostgreSQL inclus | **oui** | non (Neon) | à installer | non (Neon) | non |
| Domaine perso | oui | oui | oui | oui | oui |
| Sauvegardes DB | **oui** | non | à écrire | non | non |
| Ram realistic | 512 Mo–1 Go | 512 Mo | 12 Go | 512 Mo | 128 Mo |
| Position « production » | ambiguë | **déconseillé** | oui | oui | non |
| Maintenance | nulle | nulle | **élevée** | nulle | moyenne |
| Risque principal | conditions « Sandbox » | veille + suspension | récupération d'inactivité | épuisement des crédits | 10 ms CPU |
| **Verdict** | **1ᵉʳ choix** | **secours** | si carte OK | non | non |

---

## Sources consultées le 2026-10-25

- Northflank — tarifs et matrice de fonctionnalités : <https://northflank.com/pricing>
- Northflank — conditions générales : <https://northflank.com/legal/terms>
- Render — « Deploy for Free » (limites, 750 h, veille, Postgres 30 j) : <https://render.com/docs/free>
- Neon — tarifs (Free permanent, CU-heures, scale-to-zero) : <https://neon.com/pricing>
- Oracle — « Always Free Resources » (2 OCPU/12 Go, 200 Go, récupération d'inactivité) : <https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm>
- Netlify — tarifs et coût en crédits : <https://www.netlify.com/pricing/>
- Cloudflare — limites Workers (100k/j, 10 ms, 128 Mo) : <https://developers.cloudflare.com/workers/platform/limits/>
