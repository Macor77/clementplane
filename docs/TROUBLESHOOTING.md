# Formaplane — Guide de dépannage

Ce document regroupe les procédures de dépannage déjà rencontrées et validées pendant le développement de Formaplane.

L'objectif est d'éviter de recommencer un diagnostic complet lorsqu'un problème connu réapparaît.

---

# GitHub Codespaces — Erreur 404 / Error forwarding port

## Symptômes

Après avoir lancé :

```bash
npm run dev
```

Vite semble fonctionner, mais l'URL Codespaces du type :

```text
https://<codespace>-5173.app.github.dev
```

renvoie notamment :

- `HTTP ERROR 404`
- `Error forwarding port`
- une page inaccessible
- ou l'application ne s'ouvre plus alors qu'elle fonctionnait auparavant.

---

## Procédure courte — à appliquer en priorité

### 1. Vérifier que Vite répond localement

Exécuter :

```bash
curl -I http://localhost:5173
```

### Si la réponse n'est pas `200 OK`

Le problème est local à Vite ou à l'application.

Vérifier si `npm run dev` tourne encore. Si nécessaire, relancer :

```bash
npm run dev -- --host 0.0.0.0
```

Puis retester :

```bash
curl -I http://localhost:5173
```

### Si la réponse est `200 OK`

Vite fonctionne localement. Continuer.

---

### 2. Vérifier que Vite écoute bien sur toutes les interfaces

Exécuter :

```bash
ss -ltnp | grep 5173
```

Le résultat attendu doit notamment montrer :

```text
0.0.0.0:5173
```

Si nécessaire, relancer Vite avec :

```bash
npm run dev -- --host 0.0.0.0
```

---

### 3. Vérifier le port Codespaces

Exécuter :

```bash
gh codespace ports --codespace "$CODESPACE_NAME"
```

Vérifier que le port `5173` est bien présent.

Si le port n'est pas présent, le recréer depuis l'onglet **Ports** de Codespaces.

---

# Cause importante découverte avec Vite 7 : `allowedHosts`

Même si `localhost:5173` répond en `200 OK`, Vite 7 peut refuser la requête lorsqu'elle arrive avec le nom d'hôte Codespaces.

## Test discriminant

Récupérer le nom du Codespace :

```bash
echo "$CODESPACE_NAME"
```

Puis tester la requête avec le Host Codespaces :

```bash
curl -i \
  -H "Host: <NOM_DU_CODESPACE>-5173.app.github.dev" \
  http://localhost:5173
```

### Si la réponse est `403 Forbidden`

Avec un message du type :

```text
Blocked request. This host (...) is not allowed.
```

le problème vient de Vite.

Le fichier `vite.config.js` doit contenir :

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: '0.0.0.0',
    allowedHosts: [
      '.app.github.dev',
    ],
  },
})
```

Après modification, redémarrer Vite :

```bash
npm run dev
```

Puis refaire le test avec le Host Codespaces.

Le résultat attendu devient :

```text
HTTP/1.1 200 OK
```

---

# Si localhost = 200 ET Host Codespaces = 200, mais l'URL reste en 404

À ce stade :

- Formaplane fonctionne ;
- Vite fonctionne ;
- Vite accepte bien le domaine `app.github.dev` ;
- le port est bien déclaré dans Codespaces.

Le problème se situe alors dans la couche GitHub Codespaces / port forwarding.

## Ne pas faire immédiatement

Ne pas perdre de temps à multiplier :

- les changements de port 5173 / 5174 ;
- les passages private / public successifs ;
- les rechargements de fenêtre à répétition ;
- les suppressions / recréations de forwarding ;
- les recréations de Codespace sans diagnostic ;
- les modifications supplémentaires de Vite.

---

## Étape suivante : vérifier GitHub Status

Avant toute autre manipulation, vérifier l'état des services GitHub.

Si GitHub signale un incident ou une dégradation affectant :

- Codespaces ;
- Web ;
- API ;
- networking ;
- ou plusieurs services GitHub simultanément,

considérer que le problème peut être externe à Formaplane.

Dans ce cas :

1. arrêter le diagnostic local ;
2. conserver Vite lancé si nécessaire ;
3. attendre le rétablissement du service GitHub ;
4. retester ensuite l'URL Codespaces.

---

# Arbre de décision rapide

```text
URL Codespaces en 404
        |
        v
curl localhost:5173
        |
   +----+----+
   |         |
 échec      200
   |         |
Relancer     v
 Vite     ss -ltnp
             |
         vérifier
       0.0.0.0:5173
             |
             v
   tester Host Codespaces
             |
       +-----+-----+
       |           |
      403         200
       |           |
allowedHosts     vérifier
vite.config.js  GitHub Status
                   |
             +-----+-----+
             |           |
          incident     aucun incident
             |           |
          attendre    diagnostic
                     forwarding
```

---

# Sauvegarde du travail avant opération lourde

Avant de recréer un Codespace ou d'effectuer une opération pouvant faire perdre le travail local :

```bash
git status
```

Créer une branche de sauvegarde :

```bash
git switch -c <nom-branche-sauvegarde>
```

Ajouter uniquement les fichiers utiles :

```bash
git add README.md docs src supabase
```

Vérifier :

```bash
git status
```

Attention à ne pas ajouter accidentellement :

- les ZIP intermédiaires ;
- les copies temporaires placées à la racine ;
- les fichiers de test non destinés au dépôt.

Puis sauvegarder :

```bash
git commit -m "Sauvegarde travail en cours"
git push -u origin <nom-branche-sauvegarde>
```

---

# Recréer un Codespace — dernier recours

À utiliser uniquement si :

- Vite fonctionne ;
- `allowedHosts` est correctement configuré ;
- aucun incident GitHub n'est en cours ;
- le forwarding reste durablement défectueux.

Sur GitHub :

1. ouvrir le dépôt Formaplane ;
2. cliquer sur `Code` ;
3. ouvrir `Codespaces` ;
4. choisir `New with options...` ;
5. sélectionner la branche de sauvegarde ;
6. créer le nouveau Codespace.

Une fois le nouveau Codespace ouvert :

```bash
npm run dev
```

Puis ouvrir l'application depuis l'onglet **Ports**.

---

# Cas validés — 17 août 2026

Deux causes distinctes ont été rencontrées le même jour.

## Cause 1 — Vite 7 bloquait le domaine Codespaces

Symptômes :

- `curl -I http://localhost:5173` retournait `200 OK` ;
- le port Codespaces était présent ;
- l'URL `app.github.dev` ne fonctionnait pas.

Le test avec le Host Codespaces a retourné :

```text
403 Forbidden
Blocked request. This host (...) is not allowed.
```

La correction durable a été d'ajouter :

```js
server: {
  host: '0.0.0.0',
  allowedHosts: [
    '.app.github.dev',
  ],
}
```

dans `vite.config.js`.

## Cause 2 — Incident / dégradation GitHub

Après correction de Vite :

- localhost retournait `200 OK` ;
- le test avec le Host Codespaces retournait également `200 OK` ;
- l'URL externe Codespaces renvoyait encore une erreur.

Dans ce cas, le diagnostic local ne doit plus être poursuivi inutilement : vérifier immédiatement l'état des services GitHub.

---

# Principe général

Lorsqu'un problème déjà documenté ici réapparaît, appliquer d'abord la procédure existante avant de recommencer un diagnostic complet.

Chaque fois qu'une nouvelle cause réelle est identifiée et validée, mettre ce document à jour afin que la procédure suivante soit plus courte, plus fiable et plus efficace.
