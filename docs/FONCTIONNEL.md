# FONCTIONNEL — Clementplane

Version : 0.20
Dernière mise à jour : 27/08/2026
Correspond au Sprint 20 terminé et validé.

------------------------------------------------------------------------

# Présentation

Clementplane est une plateforme collaborative de gestion des relations entre organismes de formation et formateurs indépendants.

Son objectif est de permettre à un coordinateur de préparer, proposer,
affecter et suivre une mission depuis une seule interface.

------------------------------------------------------------------------

# Les grands modules

-   Gestion des formateurs
-   Planning
-   Recherche multicritères
-   Géolocalisation
-   Gestion des missions
-   Moteur de recommandation
-   Workflow de propositions
-   Affectation
-   Tableau de bord
-   Planning des missions
-   Navigation multi-vues

------------------------------------------------------------------------

# Cycle complet d'une mission

``` text
Création
    ↓
Recherche des formateurs
    ↓
Sélection
    ↓
Proposition envoyée
    ↓
Acceptation / Refus
    ↓
OPTION
    ↓
Affectation par l'OF
    ↓
MISSION
```

## Principe fondamental

Une mission existe indépendamment des formateurs.

Elle peut être créée sans qu'aucun formateur ne soit encore sélectionné.

------------------------------------------------------------------------

# Les statuts d'une proposition

-   Sélectionné
-   Proposition envoyée
-   Accepté
-   Refusé
-   Affecté
-   Indisponible (affecté ailleurs)

## Accepté ≠ Affecté

L'acceptation signifie :

-   le formateur est d'accord ;
-   l'OF ne l'a pas encore confirmé.

L'affectation signifie :

-   le formateur est officiellement retenu ;
-   les dates sont bloquées.

------------------------------------------------------------------------

# La notion d'OPTION

Une OPTION apparaît lorsqu'un formateur accepte une proposition.

Elle signifie :

-   le formateur reste disponible ;
-   il peut recevoir d'autres propositions ;
-   elle n'influence pas son score dans les recommandations.

Une option devient automatiquement une Mission lorsque l'OF clique sur «
Affecter ».

------------------------------------------------------------------------

# Confidentialité

Un organisme de formation ne voit jamais :

-   les autres missions ;
-   les autres organismes ;
-   les autres clients ;
-   le nombre d'options concurrentes.

En cas de conflit, seul le message « Indisponible » est affiché.

------------------------------------------------------------------------

# Planning intelligent

Le planning est calculé à partir de deux sources :

-   disponibilités déclarées ;
-   missions.

Priorité :

1.  Mission
2.  Option
3.  Indisponible déclaré
4.  Disponible
5.  Non renseigné

Les états Option et Mission sont calculés automatiquement.

------------------------------------------------------------------------

# Moteur de recommandation

Les recommandations prennent en compte :

-   les compétences ;
-   le matériel ;
-   la distance ;
-   le statut du formateur ;
-   les disponibilités déclarées.

Une Option n'est jamais pénalisante.

Une Mission rend le formateur indisponible.

------------------------------------------------------------------------

# Résultat attendu

Le coordinateur peut gérer une mission complète sans quitter Formaplane :

-   création ;
-   recherche ;
-   comparaison ;
-   proposition ;
-   suivi ;
-   affectation ;
-   contrôle des conflits ;
-   visualisation dans le planning.


------------------------------------------------------------------------

# Évolutions v0.6.1

L'écran Mission devient l'écran principal de travail.

Le coordinateur dispose :
- d'une colonne d'informations sur la mission ;
- des mêmes filtres que le listing ;
- d'un tri par proximité ;
- de l'affichage du lieu réellement reconnu ;
- d'un accès direct à la fiche de chaque formateur.


------------------------------------------------------------------------

# Évolutions Sprint 7

Le Sprint 7 apporte principalement des améliorations ergonomiques et une
nouvelle organisation de l'application.

## Navigation

Le logiciel est désormais organisé autour des pages :

- Accueil
- Planning
- Missions
- Formateurs
- Carte
- Paramètres

## Planning

Le planning mensuel devient la vue principale de planification.

Il permet :

- de visualiser toutes les missions du mois ;
- d'afficher un compteur lorsqu'une journée comporte plusieurs missions ;
- de conserver une hauteur fixe des cellules ;
- d'accéder rapidement aux informations de chaque mission.

## Gestion des missions

Les évolutions principales sont :

- remplacement du champ « Intitulé de la mission » par « Code interne de session » ;
- remplacement du champ « Lieu » par « Nom du site » (facultatif) ;
- calcul des distances exclusivement à partir de l'adresse, du code postal et de la ville afin de fiabiliser les recommandations.
------------------------------------------------------------------------

# Évolutions Sprint 8

Le Sprint 8 introduit les comptes utilisateurs réels et transforme Formaplane en plateforme multi-organismes dans laquelle un même formateur peut collaborer avec plusieurs OF.

## Compte utilisateur unique

Un utilisateur possède un seul compte d'authentification.

Ce compte peut donner accès à :

- un espace organisme de formation ;
- un espace formateur ;
- les deux espaces simultanément.

Lorsqu'un utilisateur cumule les deux rôles, il peut choisir son espace et passer de l'un à l'autre sans créer un second compte.

## Authentification

Formaplane permet désormais :

- la création d'un compte organisme ;
- la création d'un compte formateur ;
- la connexion ;
- la déconnexion ;
- la récupération d'un mot de passe oublié ;
- la définition d'un nouveau mot de passe ;
- l'affichage ou le masquage des mots de passe dans les formulaires concernés.

## Revendication d'une fiche formateur

Lorsqu'un formateur crée son compte, Formaplane cherche à le rattacher à une fiche existante.

Le principe est de ne pas dupliquer un formateur déjà présent dans la base.

Une fiche revendiquée devient le profil professionnel du compte formateur.

## Espace formateur

Le formateur dispose d'un espace dédié lui permettant notamment de :

- consulter son tableau de bord ;
- consulter et modifier son profil ;
- gérer ses disponibilités ;
- consulter son planning ;
- consulter ses propositions ;
- accepter ou refuser une proposition ;
- consulter ses missions.

## Disponibilités et historique

Les disponibilités appartiennent au profil formateur et peuvent être mises à jour depuis plusieurs espaces autorisés.

Chaque modification est historisée afin de conserver la traçabilité.

L'affichage de l'auteur respecte la confidentialité :

- le formateur peut identifier l'organisme ayant modifié sa disponibilité ;
- l'organisme auteur voit « Vous » ;
- un autre organisme voit une indication neutre de type « Un organisme partenaire ».

Les notes associées aux disponibilités suivent les mêmes principes de propriété et de confidentialité.

## Réseau multi-organismes

Une même fiche formateur peut appartenir au réseau de plusieurs organismes.

Un OF peut :

- rechercher un formateur déjà présent dans Formaplane ;
- consulter les informations communes autorisées ;
- l'ajouter à son propre réseau sans créer de doublon.

Les informations propres à la relation entre un OF et un formateur restent isolées des autres organismes.

## Confidentialité inter-organismes

Lorsqu'un formateur est affecté sur une mission d'un autre organisme, l'OF tiers ne doit jamais connaître :

- le nom de l'autre OF ;
- le client ;
- le contenu de la mission ;
- le lieu ou les détails de cette mission.

Il voit uniquement que le formateur est « Indisponible » pour la date concernée.

L'OF propriétaire de la mission conserve, lui, l'affichage normal de la mission.

## Inscription des organismes

Un nouvel organisme peut créer son compte et son espace Formaplane.

Les données et relations sont rattachées à l'organisation concernée afin de préparer l'exploitation SaaS multi-organismes.

## Résultat fonctionnel

À l'issue du Sprint 8, Formaplane permet à plusieurs organismes de travailler avec une même base de profils formateurs tout en conservant leurs informations métier confidentielles.

Le formateur devient également un utilisateur actif de la plateforme : il peut gérer son profil, ses disponibilités et ses réponses aux propositions.


------------------------------------------------------------------------

# Évolutions Sprint 9 — Identité Formaplane

L'application porte désormais officiellement le nom **Formaplane**. L'identité visuelle, les domaines et l'adresse de contact ont été préparés pour la mise en bêta.

------------------------------------------------------------------------

# Évolutions Sprint 10 — Préparation bêta et workflow missions

## Confidentialité et réseau formateurs

La recherche globale est sécurisée et évite d'exposer inutilement les données d'un formateur à un OF tiers. Avant revendication, certaines informations de localisation peuvent rester propres à l'organisme. Après revendication, le formateur pilote les données globales de son profil.

## Compétences et matériel

Les saisies de compétences et de matériel reposent désormais sur des référentiels communs afin d'améliorer la cohérence des données sans casser le matching existant.

## Options et affectation

Un formateur qui accepte une proposition crée une **option**. Plusieurs formateurs peuvent accepter la même mission tant que l'OF n'a pas choisi. Lorsque l'OF affecte un formateur :

- le formateur retenu devient **Affecté** ;
- les autres propositions/options actives deviennent **Mission pourvue ailleurs** ;
- l'opération est traitée de façon atomique.

## Désistement et désaffectation

Un formateur peut se désister d'une option tant qu'il n'est pas définitivement affecté. L'OF peut désaffecter un formateur déjà retenu, avec une confirmation explicite rappelant qu'un contact direct avec le formateur est nécessaire. Les actions sont historisées.

## Modification d'une mission engagée

La mission elle-même est mise à jour lorsque l'OF modifie ses conditions. Si un formateur avait déjà accepté ou été affecté et que le changement nécessite son accord, son engagement passe en **revalidation en attente**.

Le formateur peut consulter la mission complète avant de répondre, puis accepter ou refuser les nouvelles conditions et ajouter un commentaire. Tant que sa réponse est attendue, l'OF ne peut pas confirmer son affectation. Une mission précédemment affectée n'est plus présentée comme définitivement confirmée pendant cette revalidation.

## Historique des propositions

`Mes propositions` est organisé autour de :

- **À répondre** : propositions et revalidations nécessitant une action ;
- **Historique** : refus, désistements, missions pourvues ailleurs et autres propositions clôturées, avec filtres par date et statut.

Les missions acceptées restent accessibles dans **Mes missions**.

## Historique et commentaires

Les actions importantes du workflow sont historisées avec leur auteur. Les commentaires laissés lors d'une réponse, d'une revalidation ou d'un désistement sont rattachés à l'action correspondante afin de conserver le contexte.

## Planning et disponibilités formateur

Les options et missions sont visibles dans les calendriers. Une option ou une mission affichée peut être ouverte directement pour consulter sa fiche. Les journées comportant une option restent protégées contre une modification incohérente de disponibilité.

## Planning OF

Le planning OF se concentre sur les états réellement utiles à la coordination : nombre total de missions, missions validées/affectées et missions restant à affecter. Les missions annulées ne sont plus affichées dans le planning et restent consultables dans le module Missions.

## Suppression du brouillon

Le statut **Brouillon** n'est plus utilisé. Une mission nouvellement créée entre directement dans le workflow **À pourvoir**.

# Évolutions Sprint 11 — Communications et workflows transactionnels

## Principe de communication

Formaplane distingue l'action métier de son canal d'information. Lorsqu'une action nécessite de prévenir un formateur, l'OF peut utiliser l'E-mail Formaplane, proposé par défaut, ou indiquer qu'il informe le formateur par un autre moyen lorsque le workflow le permet.

Le choix d'un canal externe n'empêche pas l'enregistrement de l'action métier et ne doit pas déclencher d'e-mail Formaplane.

## Formateurs avec ou sans compte

Les workflows importants restent accessibles aux formateurs qui ne possèdent pas encore de compte. Les liens publics permettent notamment de répondre aux propositions et aux demandes de revalidation prévues pour eux.

Après leur action, une invitation synthétique leur permet de découvrir Formaplane et de créer leur espace formateur.

Lorsqu'un formateur possède déjà un compte, les e-mails privilégient les liens vers son espace et les pages concernées.

## Proposition, réponse et affectation

Une proposition n'est pas une affectation. Plusieurs formateurs peuvent accepter une même mission tant qu'aucun n'est définitivement affecté.

Après réponse du formateur, l'OF est informé. Lorsqu'un formateur est affecté, les autres options deviennent non actionnables et sont présentées comme mission pourvue.

L'affectation et la désaffectation intègrent désormais le choix du canal d'information.

## Modification importante d'une mission

Une mission déjà engagée peut être modifiée immédiatement, mais certaines modifications imposent de redemander l'accord des formateurs concernés.

Le formateur peut accepter ou refuser les nouvelles conditions. Un refus retire son engagement. Lorsqu'un formateur est affecté, les autres revalidations encore ouvertes sont clôturées fonctionnellement et ne doivent plus être présentées comme en attente.

## Annulation

L'annulation conserve l'historique de la mission tout en retirant ses effets actifs. Le formateur est informé selon le canal choisi. Les disponibilités et le planning sont remis en cohérence avec la disparition de l'engagement.

## Désistement

Le formateur peut se désister :
- d'une option qu'il avait acceptée ;
- d'une mission sur laquelle il est déjà affecté.

Dans le second cas, l'affectation est libérée et la mission redevient à pourvoir lorsque son statut le permet. L'OF reçoit une notification et peut ouvrir directement la mission depuis le mail.

## Principe des liens e-mail

Un e-mail transactionnel doit conduire vers l'action ou l'objet métier concerné, et non vers une page d'accueil générique lorsque le contexte permet un lien direct.


------------------------------------------------------------------------

# Évolutions fonctionnelles — Sprints 12 à 20

## Partage des disponibilités — Sprints 12 et 13

Le formateur peut partager ses disponibilités avec ses contacts OF depuis Clementplane. Le planning transmis reflète l’état utile au destinataire sans exposer le détail confidentiel des missions confiées par d’autres organismes.

Le partage est protégé par un délai anti-spam de 20 jours pour un même couple formateur + destinataire. Le contrôle est réalisé côté serveur et l’interface indique quand un nouvel envoi sera possible.

## Harmonisation des communications — Sprint 14

Les principales communications OF liées aux missions utilisent des parcours et modales cohérents. Les e-mails transactionnels restent séparés de l’action métier : une décision enregistrée ne doit pas être annulée par un échec d’envoi.

## Découvrir Clementplane — Sprint 15

La rubrique « Découvrir Clementplane » regroupe les explications produit, tutoriels pas à pas, FAQ, roadmap publique et contact support. Elle est revue à chaque clôture de sprint lorsque les évolutions le nécessitent.

## Site public — Sprint 16

Clementplane dispose d’une landing page publique présentant la proposition de valeur pour les organismes et les formateurs ainsi qu’un formulaire de prise de contact.

## Administration et statistiques — Sprint 17

L’espace Admin centralise les principaux indicateurs d’inscription et d’activité, un mini-CRM pour les demandes publiques/support et l’envoi d’e-mails de nouveautés avec gestion du désabonnement spécifique à ces communications.

## Qualité et surveillance — Sprint 18

Le produit dispose de tests Vitest, de contrats de sécurité, de scénarios Playwright préparés et d’une CI. Les erreurs client authentifiées peuvent être journalisées sans bloquer l’utilisateur.

## UX et mobile — Sprint 19

Les plannings OF et Formateur ont été simplifiés avec des filtres plus lisibles et un accès au détail d’une journée. L’espace Formateur a été optimisé pour mobile. La rubrique « Mes OF » permet de gérer les organismes partenaires et de les inviter à rejoindre Clementplane.

## Rebranding — Sprints 19.5 et 19.6

Le produit a été renommé Formaplane → Clementplane avant son lancement public. Les domaines, textes, e-mails, ressources de marque, favicon et icônes ont été alignés sur l’identité Clementplane et le pack logo final.

## PWA — Sprint 20

Clementplane est installable sur Android et iPhone/iPad comme Progressive Web App. Une invitation d’installation est proposée de manière non intrusive ; si elle est fermée sans installation, elle peut être reproposée après 7 jours.

Sur Android compatible, Clementplane utilise la fenêtre native d’installation. Sur iPhone/iPad, l’utilisateur est guidé vers Safari → Partager → Sur l’écran d’accueil → Ajouter. Un guide manuel est également disponible dans « Découvrir Clementplane ».

Une fois lancé depuis l’icône, Clementplane fonctionne en mode `standalone`. Le shell et les ressources statiques peuvent rester disponibles hors connexion, mais les données métier nécessitent Internet et ne sont pas présentées comme synchronisables hors ligne.

L’Admin mesure l’adoption réelle de la PWA et distingue les ouvertures `pwa` et `browser`.

# État fonctionnel après le Sprint 20

Clementplane couvre le cycle principal OF ↔ formateur, le partage des disponibilités, l’administration, l’aide utilisateur et l’usage mobile installable. La priorité suivante est la création autonome de missions par le formateur afin que Clementplane puisse devenir son planning professionnel de référence, y compris pour des missions confiées par des OF extérieurs à la plateforme.
