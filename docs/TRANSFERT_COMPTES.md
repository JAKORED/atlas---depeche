# Transfert du projet — comptes et accès

> **Aucun mot de passe n'est stocké dans ce fichier, ni dans aucun fichier de ce
> dépôt.** Le dépôt est public : tout identifiant écrit ici serait volé en quelques
> minutes par des robots. Les secrets vivent uniquement dans les *Secrets GitHub*
> et dans les variables d'environnement de l'hébergeur.

---

## 1. Compte principal

| Élément | Valeur |
|---|---|
| Boîte du projet | `atlasdepeche@gmail.com` |
| Usage | création de **tous** les comptes ci-dessous + boîte de récupération |
| Récupération secondaire | `redouanejikh@gmail.com` (à ajouter) |
| Téléphone de récupération | à ajouter |

**Procédure de reprise** : si un mot de passe est inconnu, utiliser « Mot de passe
oublié » sur le service concerné ; le lien arrive sur cette boîte.

---

## 2. Site

| Élément | Valeur |
|---|---|
| Adresse publique | `https://www.atlasdépêche.com` (`xn--atlasdpche-g7an.com`) |
| Langues | `/fr` et `/ar` (RTL) |
| Nature | agrégateur : ~50 articles/jour, liens sortants vers les médias sources |
| IA / API payante | aucune dans le fil public |

---

## 3. Code — GitHub

| Élément | Valeur |
|---|---|
| Compte | `atlasdepeche` |
| Dépôt | `atlasdepeche/atlas---depeche` |
| Branche de production | `master` |
| Visibilité | **publique — ne jamais passer en privé** (Actions gratuites et illimitées sur repo public ; au-delà de 2 000 min/mois en privé, tout s'arrête) |
| Déploiement | chaque push sur `master` déclenche un redéploiement de l'hébergeur |

---

## 4. Hébergement — Railway

| Élément | Valeur |
|---|---|
| Projet | `upbeat-presence` |
| Contenu | service web Next.js + base PostgreSQL |
| Mise à jour | automatique depuis GitHub `master` |
| État constaté le 2026-10-26 | site en **404** ; base injoignable (`ECONNRESET`) ; dernier déploiement réussi le 2026-09-22 |
| Statut tarifaire | Railway n'est **plus gratuit** — à traiter comme un dépannage temporaire, pas comme la cible |

---

## 5. Domaine — GoDaddy

| Élément | Valeur |
|---|---|
| Domaine | `atlasdépêche.com` |
| Registrar | GoDaddy |
| `www` | CNAME vers `nqxyte3f.up.railway.app` |
| Sans `www` | redirection vers `www` |
| **À vérifier** | **date de renouvellement** (risque de perte du domaine) |

> Le DNS fonctionne : le domaine résout correctement. Le 404 vient de
> l'hébergement, pas du domaine.

---

## 6. Réseaux sociaux — publication automatique

| Élément | Valeur |
|---|---|
| Instagram | `@atlasdepeche` (compte professionnel) |
| Facebook | page « Atlas Dépêche » — ID `1327290133801729` |
| Application Meta | « Atlas Depeche Publisher » |
| Jeton Facebook | créé le **2026-09-21**, durée ~60 jours → **à renouveler vers le 2026-11-20** |
| Conséquence si non renouvelé | les publications Facebook s'arrêtent |

Secrets correspondants (valeurs dans **GitHub → Settings → Secrets and variables → Actions**) :

- `INSTAGRAM_BUSINESS_ACCOUNT_ID`
- `INSTAGRAM_ACCESS_TOKEN`
- `FACEBOOK_PAGE_ACCESS_TOKEN`
- `FACEBOOK_PAGE_ID`
- `SITE_URL`

---

## 7. Ce qui reste à faire

- [ ] Confirmer que la première publication automatique Facebook a fonctionné.
- [ ] Vérifier que le jeton Instagram est toujours valide.
- [ ] Renouveler le jeton Facebook **avant le 2026-11-20**.
- [ ] Vérifier la date de renouvellement du domaine chez GoDaddy.
- [ ] Ajouter `redouanejikh@gmail.com` comme récupération sur la boîte projet.

---

## 8. Règle de sécurité

1. Un secret ne se met **jamais** dans un fichier, un commit, un ticket ou un chat.
2. Un mot de passe ne se réutilise **jamais** entre deux services.
3. Toute fuite impose un **changement immédiat** du mot de passe concerné.
4. La boîte `atlasdepeche@gmail.com` est la clé de tout : elle doit avoir une
   double authentification et un numéro de récupération.
