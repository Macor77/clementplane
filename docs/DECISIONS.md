# DECISIONS — Clementplane

Version : 0.20  Dernière mise à jour : 27/08/2026

------------------------------------------------------------------------

# Objectif

Ce document recense les décisions d'architecture et de conception qui
structurent durablement Clementplane. Chaque décision est conservée afin
d'expliquer les choix effectués et d'éviter de revenir sur des
arbitrages déjà validés.

------------------------------------------------------------------------

# Sprint 6 --- Moteur de missions

## Décision 1 --- Une mission est indépendante des formateurs

Une mission peut être créée, enregistrée et modifiée avant même qu'un
formateur soit sélectionné.

**Pourquoi ?**

-   préparation en amont ;
-   recherche plus tardive ;
-   meilleure flexibilité.

------------------------------------------------------------------------

## Décision 2 --- Distinction Option / Mission

Le statut **Accepté** représente une **Option**.

Le statut **Affecté** représente une **Mission confirmée**.

Une acceptation ne bloque jamais automatiquement le planning.

------------------------------------------------------------------------

## Décision 3 --- Une Option ne pénalise pas les recommandations

Un formateur ayant accepté une proposition continue :

-   à apparaître dans les recherches ;
-   à recevoir d'autres propositions ;
-   à conserver le même score.

------------------------------------------------------------------------

## Décision 4 --- Une Mission bloque le planning

Une mission affectée rend le formateur indisponible sur les dates
concernées.

Cette indisponibilité est calculée automatiquement.

------------------------------------------------------------------------

## Décision 5 --- Confidentialité entre organismes

Un organisme de formation ne doit jamais connaître :

-   les clients d'un autre OF ;
-   ses missions ;
-   ses propositions ;
-   le nombre d'options concurrentes.

En cas de conflit, seul un statut neutre est affiché.

------------------------------------------------------------------------

## Décision 6 --- Planning calculé

Le planning est construit à partir de :

-   trainer_availability ;
-   mission_formateurs ;
-   mission_dates.

Les états **Option** et **Mission** ne sont jamais enregistrés dans
`trainer_availability`.

------------------------------------------------------------------------

## Décision 7 --- Une seule source de vérité

Chaque donnée est stockée une seule fois.

Les vues de l'application déduisent ensuite les états nécessaires.

------------------------------------------------------------------------

## Décision 8 --- Une seule affectation

Une mission ne peut posséder qu'un seul formateur affecté.

Cette règle est garantie :

-   par la logique métier ;
-   par une contrainte SQL.

------------------------------------------------------------------------

## Décision 9 --- Gestion automatique des conflits

Lorsqu'un formateur est affecté à une mission, toutes les autres
propositions acceptées en conflit deviennent :

`indisponible_affecte_ailleurs`

Si le conflit disparaît, elles reviennent automatiquement à :

`accepte`

------------------------------------------------------------------------

## Décision 10 --- Développement incrémental

Chaque sprint doit produire une fonctionnalité immédiatement
exploitable.

La documentation est mise à jour avant la clôture du sprint.

------------------------------------------------------------------------

# Principes conservés

-   simplicité d'utilisation ;
-   séparation des responsabilités ;
-   architecture modulaire ;
-   confidentialité par défaut ;
-   préparation au SaaS multi-organismes ;
-   priorité à la valeur métier.


------------------------------------------------------------------------

# Décisions Sprints 8 à 10

## Décision 11 — Un compte peut avoir plusieurs espaces

Un même utilisateur peut être membre d'un organisme, formateur, ou cumuler les deux rôles. Le changement d'espace ne nécessite pas plusieurs comptes d'authentification.

## Décision 12 — Profil global et données privées OF sont séparés

Un OF ne doit pas pouvoir imposer à tous les autres organismes les informations privées qu'il conserve sur un formateur. Avant revendication, la localisation peut être propre à la relation OF / formateur. Après revendication, les données globales pilotées par le formateur deviennent la référence.

## Décision 13 — Les compétences et le matériel utilisent des référentiels

Les saisies sont normalisées par des catalogues partagés. Le moteur historique reste compatible afin d'éviter une refonte risquée avant la bêta.

## Décision 14 — Plusieurs options peuvent coexister

Plusieurs formateurs peuvent accepter la même mission. Une acceptation n'est pas une affectation définitive. L'OF conserve le choix final.

## Décision 15 — Affecter un formateur clôt les autres options

Lorsqu'un formateur est affecté, les autres propositions/options encore actives de cette mission passent à **Mission pourvue ailleurs**. Cette opération doit être atomique pour garantir la cohérence de la base.

## Décision 16 — Une modification de mission peut exiger une revalidation

L'OF peut modifier la mission, mais un formateur déjà engagé ne doit pas être considéré comme ayant accepté automatiquement les nouvelles conditions. Si son accord est requis, son état devient **Revalidation en attente** et toute confirmation d'affectation est bloquée jusqu'à sa réponse.

## Décision 17 — Les actions et commentaires métier sont historisés

Acceptation, refus, désistement, affectation, clôture et revalidation doivent rester traçables avec l'auteur et, lorsqu'il existe, le commentaire associé.

## Décision 18 — Les missions annulées restent dans Missions, pas dans le planning

Le planning sert à piloter l'activité opérationnelle. Une mission annulée doit rester retrouvable dans le listing Missions mais ne doit plus encombrer le calendrier.

## Décision 19 — Suppression du statut Brouillon

Une mission créée est immédiatement une mission métier **À pourvoir**. Le statut `brouillon` est supprimé du modèle afin d'éviter un parcours parallèle sans utilité opérationnelle.

# Décisions Sprint 11

## Décision 20 — L'action métier et le canal de communication sont distincts

L'OF doit pouvoir enregistrer une action dans Formaplane tout en choisissant comment le destinataire sera informé. L'E-mail Formaplane est proposé par défaut lorsqu'il est pertinent, mais un canal externe peut être déclaré.

## Décision 21 — Un formateur sans compte peut répondre aux sollicitations prévues pour lui

La création d'un compte ne doit pas être un préalable systématique à l'acceptation ou au refus d'une proposition ou d'une revalidation. Le parcours public reste limité à l'action autorisée.

## Décision 22 — Les e-mails doivent ramener au contexte métier

Lorsqu'un utilisateur possède un espace Formaplane, les boutons d'e-mail doivent viser la mission ou la page utile plutôt qu'un accueil générique.

## Décision 23 — Une mission pourvue ferme les autres engagements concurrents

Dès qu'un formateur est affecté, les autres formateurs ne doivent plus pouvoir accepter ou revalider une place devenue indisponible.

## Décision 24 — Le formateur peut se désister même après affectation

Un formateur doit pouvoir signaler son désistement depuis Formaplane qu'il soit encore en option ou déjà affecté. Un désistement après affectation libère la mission afin que l'OF puisse la réaffecter.

## Décision 25 — Les communications doivent favoriser l'adoption sans bloquer le métier

Lorsqu'un destinataire n'a pas encore de compte, Formaplane peut l'inviter à créer son espace après l'action principale, sans rendre cette inscription obligatoire pour traiter la sollicitation.

------------------------------------------------------------------------

# Décisions Sprints 12 à 20

## Décision 26 — Les disponibilités restent consultables en permanence

Le partage par e-mail sert à signaler une mise à jour. Clementplane reste la source de vérité consultable par les organismes partenaires.

## Décision 27 — Le partage de disponibilités est protégé côté serveur

Le délai anti-spam ne repose pas uniquement sur l’interface. Le contrôle du délai de 20 jours utilise l’historique serveur du couple formateur + destinataire.

## Décision 28 — Les réseaux OF restent privés

Un organisme ne doit jamais disposer d’une vision du réseau interne d’un autre organisme.

## Décision 32 — Les déclarations de disponibilité OF et formateur restent séparées

La disponibilité globale déclarée par le formateur et la disponibilité déclarée localement par un OF sont deux données métier distinctes.

Pour un OF donné, lorsque les deux déclarations existent, la plus récemment modifiée détermine l'état effectif affiché. Une modification du formateur peut donc prendre le dessus sur une déclaration locale de l'OF.

La déclaration locale n'est jamais supprimée par cette priorité. L'OF peut réaffirmer directement sa propre déclaration depuis son interface. Une modification faite par un OF reste limitée à cet OF et ne modifie ni le formateur ni les autres organismes.

Les états calculés liés aux missions et aux conflits de planning restent distincts des déclarations de disponibilité.

## Décision 29 — Les tests automatisés ne doivent jamais détruire la production

Les scénarios nécessitant des écritures destructives doivent utiliser un environnement E2E séparé. La référence Supabase de production est explicitement protégée.

## Décision 30 — L’instrumentation produit reste légère

`product_events` mesure les usages utiles au pilotage sans enregistrer de données matérielles inutiles.

## Décision 31 — Clementplane reste une seule application web

La version mobile installable est une PWA. Il n’est pas créé de second produit natif Android/iOS à maintenir en parallèle.

## Décision 32 — Les données métier ne sont pas synchronisées hors connexion

Le service worker peut conserver le shell et les ressources statiques. Les réponses Supabase ne doivent pas être présentées comme une base métier offline synchronisable.

## Décision 33 — L’installation PWA est liée à l’appareil

L’état d’installation n’est pas stocké comme un attribut global du compte Clementplane. Un utilisateur changeant de téléphone peut recevoir une nouvelle proposition d’installation.

## Décision 34 — Fermer l’invitation ne vaut pas refus définitif

Lorsqu’un utilisateur ferme l’invitation PWA sans installer, Clementplane peut la reproposer après 7 jours.

## Décision 35 — L’adoption PWA se mesure par l’usage réel

L’indicateur principal est le nombre d’utilisateurs ayant effectivement ouvert Clementplane en mode PWA, ainsi que la répartition PWA / navigateur.

## Décision 36 — La documentation fait partie de la définition de terminé

Un sprint ne peut pas être clôturé avant la mise à jour de la documentation, de la roadmap, du changelog, de la version affichée et de la rubrique « Découvrir Clementplane » lorsque le sprint l’exige.
