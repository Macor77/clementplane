# ARCHITECTURE — Clementplane

Version : 0.20
Dernière mise à jour : 27/08/2026
Correspond au Sprint 20 terminé et validé.

------------------------------------------------------------------------

# Objectif

Ce document décrit l'architecture technique de Clementplane et les
principes qui guident son évolution.

L'objectif est de conserver une architecture :

-   simple ;
-   lisible ;
-   modulaire ;
-   évolutive ;
-   adaptée à une future version SaaS.

------------------------------------------------------------------------

# Stack technique

## Frontend

-   React
-   Vite
-   JavaScript

## Backend

-   Supabase
-   PostgreSQL

## Déploiement

-   GitHub
-   GitHub Codespaces
-   Vercel

## Cartographie

-   Leaflet
-   OpenStreetMap
-   Nominatim via Edge Function

------------------------------------------------------------------------

# Architecture générale

``` text
Utilisateur
      │
      ▼
Pages React
      │
      ▼
Hooks
      │
      ▼
Services
      │
      ▼
Supabase
      │
      ▼
PostgreSQL
```

Les pages orchestrent, les hooks coordonnent, les services exécutent la
logique métier et les accès aux données.

------------------------------------------------------------------------

# Organisation du projet

``` text
src/
 ├── components/
 ├── hooks/
 ├── pages/
 ├── services/
 ├── utils/
 └── lib/
```

Chaque dossier possède une responsabilité unique.

------------------------------------------------------------------------

# Architecture du moteur de missions

Le Sprint 6 introduit trois tables métier :

``` text
missions
mission_dates
mission_formateurs
```

Le moteur suit le flux :

``` text
Mission
    ↓
Recherche
    ↓
Sélection
    ↓
Proposition
    ↓
Acceptation
    ↓
Option
    ↓
Affectation
    ↓
Mission confirmée
```

------------------------------------------------------------------------

# Planning intelligent

Le planning n'est plus basé sur une seule table.

Il est calculé à partir de deux sources :

``` text
trainer_availability
        +
mission_formateurs
        +
mission_dates
```

## Rôle de chaque table

### trainer_availability

Contient uniquement les disponibilités déclarées par le formateur :

-   Disponible
-   Indisponible
-   Non renseigné
-   Notes

### mission_formateurs

Contient les états métier :

-   Sélectionné
-   Proposition envoyée
-   Accepté
-   Refusé
-   Affecté
-   indisponible_affecte_ailleurs

### mission_dates

Détermine les journées réellement concernées par les missions.

------------------------------------------------------------------------

# Fusion des données

Le planning applique la priorité suivante :

``` text
Mission
↓
Option
↓
Indisponible déclaré
↓
Disponible
↓
Non renseigné
```

Les états Option et Mission ne sont jamais enregistrés dans
`trainer_availability`.

Ils sont calculés dynamiquement.

Cette architecture évite les incohérences lors :

-   d'une suppression de mission ;
-   d'une modification de dates ;
-   d'une désaffectation.

------------------------------------------------------------------------

# Confidentialité

Le moteur est conçu pour un futur fonctionnement multi-organismes.

Par conséquent :

-   aucun OF ne voit les missions d'un autre ;
-   aucune information client n'est partagée ;
-   seuls les statuts utiles sont exposés.

------------------------------------------------------------------------

# Services principaux

-   formateursService
-   availabilityService
-   missionMatchingService
-   missionsService
-   geocodingService
-   distanceService

Toute la logique métier est centralisée dans les services.

------------------------------------------------------------------------

# Hooks principaux

-   useFormateurs
-   usePlanningAvailability
-   useListingFilters
-   useSort
-   useDistances

Les hooks orchestrent les appels aux services sans accéder directement à
Supabase.

------------------------------------------------------------------------

# Décisions structurantes

-   Une mission est indépendante d'un formateur.
-   Une option n'est pas une mission.
-   Une option ne pénalise pas les recommandations.
-   Une mission bloque automatiquement les dates concernées.
-   Une seule source de vérité est conservée pour chaque information.

------------------------------------------------------------------------

# Cycle de développement

``` text
Développement
      ↓
Tests
      ↓
Documentation
      ↓
Git Commit
      ↓
Git Push
      ↓
Vercel
      ↓
Validation
```

La documentation est considérée comme une partie intégrante du
développement.

------------------------------------------------------------------------

# Philosophie

L'architecture privilégie toujours :

-   la séparation des responsabilités ;
-   la réutilisation ;
-   la simplicité ;
-   la maintenabilité ;
-   l'évolutivité.


------------------------------------------------------------------------

# Évolution v0.6.1

La consultation d'une mission est désormais séparée de la liste des missions.

- page dédiée par mission ;
- panneau latéral d'informations ;
- réutilisation du moteur de filtres du listing ;
- calcul des distances partagé avec le listing ;
- tri par proximité ou par nom ;
- consultation de la fiche formateur dans un nouvel onglet.


------------------------------------------------------------------------

# Évolutions Sprint 7

## Nouvelles vues

L'architecture intègre désormais les pages :

- Dashboard
- Planning
- Missions
- Carte
- Paramètres

Ces vues réutilisent les mêmes services métier afin d'éviter toute duplication de logique.

------------------------------------------------------------------------

## Moteur de proximité

Le calcul de proximité repose désormais exclusivement sur :

- adresse ;
- code postal ;
- ville.

Le champ « Nom du site » est conservé à des fins descriptives uniquement et n'intervient plus dans le géocodage.

------------------------------------------------------------------------

## Planning

Le planning mensuel est devenu une vue dédiée.

Les composants ont été optimisés afin de conserver une hauteur fixe des cellules, d'afficher un compteur de missions et d'améliorer la lisibilité générale de l'interface.
------------------------------------------------------------------------

# Évolutions Sprint 8 — Authentification et architecture multi-organismes

Le Sprint 8 introduit une couche d'identité et de rattachement permettant à Clementplane de fonctionner avec plusieurs utilisateurs, plusieurs organismes et des profils formateurs partagés.

## Modèle d'identité

L'architecture distingue désormais :

``` text
Utilisateur Supabase Auth
        │
        ▼
profiles
        │
        ├──────── memberships ──────── Organisation(s)
        │
        └──────── trainer_profiles ─── Profil formateur
```

Un même utilisateur peut donc disposer de plusieurs contextes sans multiplier les comptes d'authentification.

## Relations organisme / formateur

La relation entre un organisme et un formateur est désormais distincte de l'identité globale du formateur.

``` text
Organisation
     │
     ▼
organization_trainers
     │
     ▼
Formateur
```

Cette séparation permet :

- à plusieurs OF de référencer le même formateur ;
- d'éviter la duplication des profils ;
- de partager les données communes autorisées ;
- de conserver séparément les données propres à chaque relation OF / formateur.

## Services ajoutés

Le Sprint 8 ajoute notamment les services suivants :

- `authService`
- `currentUserService`
- `organizationSignupService`
- `proposalService`
- `trainerAvailabilityService`
- `trainerClaimService`
- `trainerProfileService`
- `trainerProposalService`
- `trainerSearchService`

Ils complètent les services historiques du moteur de missions.

## Nouvelles pages et composants

L'application intègre désormais notamment :

- `Login`
- `Signup`
- `OrganizationSignup`
- `ForgotPassword`
- `ResetPassword`
- `SpaceChooser`
- `TrainerClaimStart`
- `TrainerHome`
- `TrainerSearch`
- les pages de l'espace `trainer/`
- des composants dédiés à l'authentification et à l'espace formateur.

## Authentification

Supabase Auth devient la source d'authentification.

Le contexte React d'authentification :

- suit la session ;
- charge le contexte utilisateur ;
- détermine les espaces disponibles ;
- permet le routage entre espace OF et espace formateur ;
- gère la déconnexion.

## Disponibilités

L'architecture des disponibilités évolue pour gérer plusieurs sources de modification et leur historique.

Les migrations du Sprint 8 introduisent ou renforcent :

- l'édition des disponibilités par le formateur ;
- les notes ;
- la propriété des notes ;
- l'historique ;
- la lecture sécurisée de l'historique ;
- la traçabilité de la source de modification.

Le planning reste calculé à partir des disponibilités déclarées et des engagements de mission.

## Recherche globale et réseau

Une recherche globale permet de retrouver un formateur existant au-delà du seul réseau local d'un OF.

La relation `organization_trainers` rattache ensuite ce profil à l'organisme demandeur.

Le profil global et les données spécifiques à l'OF sont volontairement séparés.

## Multi-organismes et missions

Les migrations du Sprint 8 adaptent progressivement le modèle des missions au multi-organismes.

Les accès aux missions sont cloisonnés par organisation.

Les engagements d'un formateur restent toutefois utilisables pour détecter un conflit de planning entre plusieurs OF.

## RPC de confidentialité des engagements

La fonction :

``` text
get_trainer_mission_commitments_safe
```

est appelée par `getTrainerMissionCommitments()`.

Elle utilise une logique sécurisée côté base afin de fournir uniquement les informations nécessaires au calcul d'une disponibilité.

Principe :

``` text
OF propriétaire de la mission
        → peut obtenir l'état Mission nécessaire à son affichage

OF tiers
        → reçoit uniquement une indisponibilité neutre
```

Aucune donnée métier de la mission externe n'est exposée.

Cette couche est essentielle : la détection globale des conflits doit fonctionner sans casser l'isolation entre organismes.

## Migrations Sprint 8

Les migrations ajoutées pendant le Sprint 8 couvrent notamment :

- propositions publiques de mission ;
- revendication de profil formateur ;
- profil et disponibilités en libre-service formateur ;
- correction des RPC de disponibilité ;
- propositions côté formateur ;
- notes et historique de disponibilités ;
- consultation des missions côté formateur ;
- relation `organization_trainers` ;
- recherche globale des formateurs ;
- inscription d'un organisme ;
- missions multi-organisations ;
- confidentialité des missions externes.

## Principe de sécurité

Le modèle vise désormais explicitement le fonctionnement suivant :

``` text
Données globales du formateur
        +
Relation privée OF / formateur
        +
Données privées de l'organisation
        +
Engagements globaux exposés uniquement sous forme minimale
```

Le besoin métier de prévention des doubles affectations est ainsi concilié avec la confidentialité inter-organismes.

------------------------------------------------------------------------

# État architectural après le Sprint 8

Clementplane n'est plus architecturé comme une application mono-organisme avec un futur multi-tenant théorique.

Les briques fondamentales du multi-organismes sont désormais présentes :

- authentification ;
- profils utilisateurs ;
- memberships ;
- profil formateur rattachable ;
- double espace ;
- réseau de formateurs ;
- inscription d'organismes ;
- cloisonnement des données ;
- détection sécurisée des conflits entre OF.


------------------------------------------------------------------------

# Évolutions Sprints 9 et 10

## Identité Formaplane

À partir du Sprint 9, le produit est exploité sous le nom Formaplane. Les ressources publiques de marque sont regroupées sous `public/brand/`.

## Confidentialité du réseau formateurs

Le Sprint 10 renforce la séparation entre profil global et relation privée OF / formateur. La recherche globale passe par des fonctions sécurisées et la localisation d'un profil non revendiqué peut rester spécifique à chaque organisme. Une fois le profil revendiqué, les données pilotées par le formateur deviennent la référence commune.

## Référentiels de saisie

Les composants `CompetencyInput` et `EquipmentInput` s'appuient sur des services et catalogues dédiés. Cette couche normalise progressivement les compétences et le matériel tout en conservant la compatibilité avec les données métier existantes.

## Workflow mission enrichi

Le moteur de mission comprend désormais :

- plusieurs options acceptées en parallèle ;
- désistement formateur ;
- clôture automatique des autres options lors de l'affectation ;
- historique des actions avec auteur et commentaires ;
- revalidation lorsqu'une mission engagée est modifiée ;
- blocage d'une affectation tant qu'une revalidation nécessaire est en attente.

L'affectation finale est réalisée par une opération SQL atomique afin d'éviter les états intermédiaires incohérents.

## Espace formateur

L'espace formateur possède des vues dédiées pour les propositions, les missions, le planning, les disponibilités, le profil et le contact avec l'organisme. Les cartes de planning et de disponibilité donnent accès à la fiche mission concernée.

## Suppression de compte

Le projet contient une Edge Function `delete-account` et un service `accountDeletionService`. La suppression est protégée par les règles métier et de sécurité mises en place côté Supabase.

# État architectural après le Sprint 10

Clementplane dispose désormais d'un socle pré-bêta multi-organismes : authentification, espaces OF/formateur, confidentialité renforcée, réseau partagé, référentiels, workflow mission traçable, revalidation et prévention des doubles affectations. Le Sprint 11 peut se concentrer sur les e-mails transactionnels sans remettre en cause ce socle.

# Évolution Sprint 19.5 — Rebranding Clementplane

Le produit est renommé **Clementplane** avant son lancement public.

Le rebranding porte sur :
- le nom du produit ;
- les domaines ;
- les e-mails ;
- les ressources publiques ;
- les textes applicatifs ;
- les ressources de marque regroupées sous `public/brand/`.

Le fonctionnement métier et l’architecture multi-organismes restent inchangés.

# Évolutions Sprint 11 — Couche transactionnelle et parcours publics

## Architecture des communications

Les communications métier reposent désormais sur :
- le frontend React/Vite pour déclencher les actions et recueillir le choix de canal ;
- Supabase pour la persistance, les RPC métier et la sécurité ;
- des Supabase Edge Functions pour les notifications transactionnelles ;
- le service d'envoi d'e-mails configuré pour Clementplane ;
- Vercel pour l'application web publique.

Le déclenchement d'un e-mail est séparé autant que possible de l'enregistrement de l'action métier : une erreur d'e-mail ne doit pas annuler une décision métier déjà enregistrée.

## Parcours publics sécurisés

Certains destinataires ne disposent pas encore de compte Clementplane. Des parcours publics dédiés permettent de répondre aux propositions ou aux demandes de revalidation prévues à cet effet, sans exposer le reste des données de l'application.

Les liens et fonctions publiques doivent rester limités au contexte nécessaire à l'action et utiliser les mécanismes de sécurité prévus par les migrations/RPC correspondantes.

## Revalidation

Le sous-système de revalidation s'appuie sur les demandes de modification de mission et leurs destinataires formateurs. La mission peut être mise à jour tandis que l'engagement de chaque formateur est revalidé séparément.

## Notifications OF

Les réponses et désistements peuvent déclencher une notification vers l'organisme concerné. Les liens profonds utilisent l'identifiant de mission afin de ramener l'utilisateur au bon contexte métier.

## État architectural après le Sprint 11

Clementplane dispose maintenant d'un workflow complet OF ↔ formateur couvrant proposition, réponse, affectation, désaffectation, modification importante, revalidation, annulation et désistement, avec prise en charge des utilisateurs inscrits et de certains parcours publics pour les destinataires non inscrits.

------------------------------------------------------------------------

# Évolutions architecturales Sprints 12 à 20

## Partage des disponibilités

Le partage de disponibilités s’appuie sur les disponibilités réelles du formateur, un carnet privé de contacts OF, les journaux d’e-mails et un contrôle serveur du délai anti-spam.

## Administration et instrumentation

L’administration repose notamment sur `platform_admins`, `is_platform_admin()`, `support_requests` et `product_events`.

Le Sprint 20 réutilise `product_events` pour enregistrer `app_opened` avec un mode d’accès limité à `pwa` ou `browser`.

Aucune donnée matérielle du téléphone n’est stockée.

## PWA — Sprint 20

La PWA repose notamment sur Vite, `vite-plugin-pwa`, Workbox, `pwa.config.js`, `src/components/pwa/PwaManager.jsx` et `src/pwa/pwaEnvironment.js`.

Le build génère notamment `manifest.webmanifest`, `sw.js` et les fichiers Workbox nécessaires.

Le service worker conserve uniquement le shell et les ressources statiques utiles au démarrage. Les données métier Supabase ne constituent pas une base hors connexion synchronisable.

En cas de perte du réseau, le shell peut rester visible et Clementplane affiche un message hors connexion. Au retour du réseau, le fonctionnement normal reprend.

## Installation mobile

Sur Chromium compatible, Clementplane utilise `beforeinstallprompt` lorsqu’il est disponible.

Sur iPhone/iPad, l’installation reste pilotée par Safari : Partager → Sur l’écran d’accueil → Ajouter.

L’état d’installation reste propre à l’appareil et au navigateur ; il n’est pas enregistré comme un attribut global du compte utilisateur.

## État architectural après le Sprint 20

Clementplane est une application web SaaS multi-organismes disposant d’un frontend React/Vite, d’un backend Supabase/PostgreSQL, d’Edge Functions, d’une couche transactionnelle Brevo, d’une administration interne, de tests automatisés, d’un déploiement Vercel et d’une PWA installable sans duplication du produit en application native.
