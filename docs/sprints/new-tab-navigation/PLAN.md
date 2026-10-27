> Production autorisée ensuite par Vincent le 27 octobre 2026 (« tu peux publier en production »). PR #18 fusionnée. Voir `DEPLOYMENT.md`.

# Ouverture des fiches dans un nouvel onglet

Mandat du 27 octobre 2026 : périmètre approuvé, « Vas-y développe ». Développement sur branche dédiée ; production non demandée dans ce mandat.

## Design
Liens React Router natifs pour les navigations (missions, fiches formateurs, recherche, édition et accès de listes). Clic droit, Ctrl/Cmd-clic et molette sont laissés au navigateur. Clic simple inchangé. Les cartes des plannings conservent la fenêtre journée au clic simple et fournissent l'adresse de leur mission pour un autre onglet. Aucun lien imbriqué dans un bouton.
Un chemin OF explicite doit primer sur l'espace mémorisé dans l'onglet pour un compte à double rôle. Les gardes d'authentification, services et droits serveur restent applicables. Racine et choix d'espace inchangés.

Approche retenue : liens natifs, plutôt qu'un menu contextuel maison ou window.open (qui ne donnent pas toutes les fonctions du navigateur).

## Plan d'exécution
- [x] Test navigateur avec API fictive : liens missions, fiches formateurs, clic droit sans navigation, Ctrl-clic/molette dans une vraie nouvelle page, clic simple, liens planning et double rôle sans espace mémorisé.
- [x] Remplacer les actions de navigation par Link ; préserver les actions métier et les fenêtres de journée.
- [x] Résoudre l'espace OF des chemins explicites ; tests des droits et liens profonds.
- [x] Tests complets, lint, build, recette navigateur desktop/mobile, audit ; revue du diff.
- [x] Documentation, commit, push de branche, PR et CI. Ne pas fusionner ni déclarer une mise en production.

## Points de revue
Plusieurs missions le même jour ; missions personnelles et reçues ; Ctrl/Cmd et molette sans ouvrir la fenêtre de journée ; compte double rôle avec espace absent ou formateur ; compte sans droits et session absente ; styles des liens et focus clavier.

## Suivi
Base : 9e2ba74cbfcae5af9679b4bdfc09acddf464e1ff. Aucune migration ni fonction serveur nécessaire.

### Décisions de réalisation et revue
- Liens natifs au lieu d’un menu spécifique : mêmes commandes clavier et navigateur.
- Correction d’un chevauchement mobile observé à 390 px : espace réservé au numéro du jour au-dessus des missions.
- Revue indépendante : couleurs des statuts et taille des numéros conservées ; détection de chemin OF limitée aux comptes double rôle pour préserver le parcours de revendication des comptes OF seuls.
- Les premiers tests de rendu étaient rouges avant le remplacement des boutons. L’essai navigateur mobile a reproduit le chevauchement ; le test onboarding a reproduit le contournement sur le build précédent.
- Tests locaux utilisent Chromium 140 : le téléchargement automatique Chromium 151 renvoyait une archive invalide. Aucun changement des dépendances du projet.
