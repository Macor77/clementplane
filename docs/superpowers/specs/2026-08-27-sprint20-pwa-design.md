# Sprint 20 — Clementplane PWA Design

## Objective

Transformer Clementplane v0.19.6 en PWA installable sur iPhone/iPad et Android, avec une expérience proche d’une application native, sans modifier les workflows métier existants ni introduire de synchronisation de données hors connexion.

## Scope

Le Sprint 20 couvre :

- un manifest PWA Clementplane complet ;
- un service worker généré et maintenu avec `vite-plugin-pwa` ;
- une installation Android via le mécanisme natif `beforeinstallprompt` lorsqu’il est disponible ;
- une aide d’installation iOS/iPadOS indiquant le chemin Safari « Partager → Sur l’écran d’accueil → Ajouter » ;
- un fonctionnement en `display: standalone` avec l’identité Clementplane ;
- un cache limité au shell applicatif et aux ressources statiques ;
- un état hors connexion explicite dans l’interface ;
- une détection des nouvelles versions avec mise à jour déclenchée par l’utilisateur ;
- des tests automatisés de la configuration et des utilitaires PWA ;
- la mise à jour de la roadmap, de la FAQ « Découvrir Clementplane », de la version et de la documentation de test.

## Out of scope

Le Sprint 20 ne doit pas :

- permettre la création, modification ou suppression de données métier hors connexion ;
- stocker localement des missions, disponibilités ou informations Supabase afin de les resynchroniser plus tard ;
- mettre en cache les réponses Supabase comme source métier hors connexion ;
- modifier les règles métier, RLS, Edge Functions ou schémas Supabase ;
- publier Clementplane dans l’App Store ou Google Play ;
- recréer ou redessiner le logo Clementplane.

## Technical approach

Utiliser `vite-plugin-pwa` en mode `generateSW`, intégré à Vite 7. Le plugin génère le service worker et le manifest au build. Le service worker précache les fichiers construits par Vite et les assets Clementplane nécessaires à l’enveloppe applicative. Les API Supabase et autres requêtes métier réseau ne reçoivent pas de stratégie de cache applicative.

La configuration PWA est définie dans un module racine `pwa.config.js` importé par `vite.config.js`. Cette séparation permet de tester directement le manifest et les contraintes PWA sans démarrer le navigateur.

## Manifest and visual identity

Le manifest utilise :

- `name`: `Clementplane`
- `short_name`: `Clementplane`
- `lang`: `fr-FR`
- `start_url`: `/`
- `scope`: `/`
- `display`: `standalone`
- `theme_color`: `#0B132B`
- `background_color`: `#0B132B`
- icône 192×192 : `/icons/clementplane-icon-192.png`
- icône 512×512 : `/icons/clementplane-icon-512.png`

Les mêmes fichiers validés au Sprint 19.6 sont utilisés. Aucune nouvelle interprétation graphique du symbole n’est autorisée. Les entrées `purpose: any` et `purpose: maskable` utilisent les assets existants seulement après vérification visuelle de la zone de sécurité ; si l’icône 512 existante ne respecte pas la safe zone maskable, le Sprint doit produire une variante technique dérivée du même symbole, sans modifier son dessin.

`index.html` conserve le favicon, l’Apple Touch Icon et le `theme-color`, et reçoit les métadonnées iOS utiles au mode web app.

## Caching and offline behavior

Le service worker précache le shell construit : HTML, JavaScript, CSS, icônes, logos et ressources locales générées par Vite. La navigation SPA utilise `index.html` comme fallback de navigation afin que les routes React déjà installées puissent se rouvrir depuis l’écran d’accueil.

Aucune règle `runtimeCaching` ne doit mettre en cache les endpoints Supabase. Une perte de réseau déclenche un état global visible :

`Vous êtes hors connexion. Clementplane nécessite une connexion Internet pour accéder aux données et les modifier.`

Le retour du réseau fait disparaître automatiquement cet état. Les erreurs métier existantes restent gérées par les composants/services actuels.

## Install UX

Un composant global `PwaManager` écoute :

- `beforeinstallprompt` pour Android/Chromium ;
- `appinstalled` pour savoir que l’installation est terminée ;
- `online` / `offline` ;
- `matchMedia('(display-mode: standalone)')` et `navigator.standalone` pour détecter le mode installé ;
- les événements de mise à jour fournis par `virtual:pwa-register/react`.

Sur Android/Chromium, une invitation compacte permet de lancer le prompt natif. Si l’utilisateur refuse/ferme l’invitation, un délai local empêche sa réapparition immédiate.

Sur Safari iOS/iPadOS hors mode standalone, l’aide indique : `Partager → Sur l’écran d’accueil → Ajouter`. Elle peut être fermée et ne doit pas réapparaître à chaque navigation.

L’interface d’installation ne doit jamais bloquer l’application ni masquer les fonctions métier.

## Update UX

`vite-plugin-pwa` est configuré avec `registerType: 'prompt'`. Lorsqu’une nouvelle version du service worker est prête, Clementplane affiche une notification compacte :

`Une nouvelle version de Clementplane est disponible.`

Le bouton `Mettre à jour` appelle la fonction fournie par `useRegisterSW` afin d’activer la nouvelle version puis recharger proprement l’application. Une mise à jour ne doit pas forcer un reload pendant une saisie sans action utilisateur.

## React boundaries

Créer un dossier `src/pwa/` pour la détection et les constantes de comportement, et `src/components/pwa/` pour la présentation.

`PwaManager` est monté une seule fois au niveau racine, hors des routes OF/Formateur, afin que son comportement soit identique sur les pages publiques, l’authentification et les deux espaces connectés.

## Roadmap and Discover

La roadmap doit devenir :

- Sprint 20 — Clementplane installable sur mobile (PWA)
- Sprint 21 — Création autonome de missions par le formateur
- Sprint 22 — Synchronisation Google Agenda

Les fichiers `ROADMAP.md` et `docs/ROADMAP.md` doivent être cohérents et utiliser le nom Clementplane pour les sections concernées.

`src/content/discoverContent.js` doit :

- passer la version à `v0.20.0` lors de la clôture ;
- ajouter l’installation mobile aux fonctionnalités disponibles ;
- retirer l’installation PWA des évolutions futures ;
- conserver la création autonome de mission avant la synchronisation Google Agenda ;
- ajouter une FAQ expliquant l’installation sur Android et iPhone/iPad et préciser que Clementplane reste dépendant d’Internet pour les données métier.

## Testing strategy

### Automated

- test de contrat du manifest : nom, mode standalone, couleurs, start URL, icônes 192/512 ;
- tests unitaires des fonctions de détection : standalone, iOS, disponibilité du prompt et temporisation de l’invitation ;
- build Vite avec génération du manifest et du service worker ;
- suite Vitest complète ;
- lint ;
- suite E2E existante pour vérifier l’absence de régression.

### Manual — Codespaces

- ouvrir le port Vite en HTTPS/public ;
- vérifier le manifest dans DevTools/Application ;
- vérifier l’enregistrement du service worker ;
- vérifier l’absence d’erreur console ;
- simuler offline après un premier chargement ;
- vérifier l’état hors connexion puis le retour en ligne ;
- vérifier la détection d’une nouvelle version avec deux builds successifs.

### Manual — mobile

Sur Android/Chrome si disponible : installation, icône, lancement standalone, authentification, navigation, fermeture/réouverture, offline/online, désinstallation/réinstallation.

Sur iPhone/Safari : ajout à l’écran d’accueil, icône, lancement standalone, authentification, navigation OF/Formateur, clavier, modales, liens internes, offline/online.

## Release

La clôture cible `v0.20.0`. La documentation, `Découvrir Clementplane`, `CHANGELOG.md` et les deux roadmaps sont mis à jour après recette. Le ZIP de clôture doit être nommé `Clementplane_v0.20.0_Sprint20_Closure.zip` et vérifié avec `unzip -t`.

## Addendum — adoption et statistiques PWA

Avant clôture, le Sprint 20 est étendu avec une invitation d’installation visible pour les utilisateurs authentifiés. Sur Android compatible, le bouton **Installer Clementplane** déclenche le prompt natif exposé par le navigateur. Sur iPhone/iPad, le même appel à l’action affiche les instructions **Partager → Sur l’écran d’accueil → Ajouter**. Une fermeture masque l’invitation pendant 7 jours ; en mode standalone, elle n’est jamais affichée.

L’adoption est mesurée à partir des ouvertures authentifiées, pas uniquement des authentifications email/mot de passe. Chaque chargement authentifié enregistre `app_opened` avec `access_mode = pwa|browser` dans `product_events`. Aucun modèle de téléphone, identifiant matériel ni donnée technique détaillée n’est stocké.

L’Admin expose un bloc **Application mobile / PWA** avec : utilisateurs ayant lancé la PWA, taux global, taux OF, taux formateurs, utilisateurs PWA actifs sur 30 jours, et répartition des ouvertures PWA / navigateur sur 30 jours. Le statut « installé » n’est pas présenté comme une donnée distante certaine : le chiffre d’adoption correspond aux utilisateurs ayant effectivement lancé Clementplane en mode PWA.
