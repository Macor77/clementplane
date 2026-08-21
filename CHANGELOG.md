# CHANGELOG - Formaplane

## v0.14.0 — Sprint 14 — Harmonisation des e-mails côté OF — 21 août 2026

### Ajouté
- option commune **« Recevoir une copie de cet e-mail »** dans les parcours e-mail déclenchés depuis l’espace OF ;
- prise en charge des invitations formateurs, invitations en masse, propositions et relances de mission, affectations, désaffectations, revalidations et annulations ;
- récupération sécurisée de l’adresse de copie depuis le compte Formaplane authentifié ;
- composant réutilisable pour harmoniser l’option de copie dans l’application.

### Sécurité
- remplacement du CC identique par un e-mail de copie distinct destiné à l’utilisateur OF ;
- neutralisation dans la copie OF des liens et boutons d’action réservés au formateur ;
- maintien du message principal comme seul événement métier journalisé ;
- traçabilité de l’option de copie dans les métadonnées de l’envoi ;
- redéploiement de l’Edge Function `send-transactional-email`.

### UX
- harmonisation des fenêtres d’envoi sur le modèle de proposition de mission ;
- option e-mail Formaplane affichée en premier ;
- case de copie positionnée immédiatement sous l’option e-mail ;
- autres moyens de contact regroupés ensuite ;
- libellé adapté lorsque plusieurs e-mails sont envoyés.

### Corrigé
- cooldown d’invitation depuis le listing formateurs : prise en compte des statuts `sent` et `delivered` ;
- conservation de la réinvitation volontaire depuis la fiche formateur ;
- statut erroné « revalidation en attente » d’une mission déjà affectée lorsque seul un autre formateur devait encore revalider ;
- cohérence du statut d’affectation entre la liste des missions et le planning.

### Recette
Validés en conditions réelles :
- envoi avec et sans copie ;
- copie sécurisée reçue par l’utilisateur OF ;
- impossibilité d’utiliser la copie pour agir à la place du formateur ;
- invitation ;
- proposition / relance ;
- affectation ;
- désaffectation ;
- revalidation ;
- annulation ;
- envois simples et multiples ;
- harmonisation visuelle des fenêtres ;
- build de production réussi.

---


## v0.13.0 — Sprint 13 — Sécurisation du partage des disponibilités — 21 août 2026

### Ajouté
- délai minimal de 20 jours complets entre deux partages de disponibilités par e-mail d'un même formateur vers une même adresse destinataire ;
- contrôle côté PostgreSQL et Edge Function, indépendant de l'identifiant du contact ;
- réservation atomique avant envoi afin d'éviter les doubles envois concurrents ;
- affichage de la date et de l'heure exactes du prochain envoi autorisé ;
- possibilité pour le formateur de recevoir une copie de l'e-mail envoyé ;
- génération et téléchargement d'un PDF personnalisé des disponibilités ;
- personnalisation du PDF selon l'organisme destinataire ;
- intégration du commentaire du formateur dans le PDF ;
- séparation claire des trois modes de partage : e-mail Formaplane, PDF et réseaux sociaux.

### Sécurité et garde-fous
- impossibilité de contourner le délai de 20 jours en supprimant puis recréant un contact avec la même adresse e-mail ;
- contrôle basé sur le couple formateur + adresse e-mail normalisée ;
- blocage appliqué côté serveur et non uniquement dans l'interface ;
- maintien du téléchargement PDF même lorsqu'un destinataire est temporairement bloqué pour l'envoi par e-mail.

### UX
- contacts temporairement bloqués clairement identifiés ;
- information sur la prochaine date d'envoi possible ;
- rappel qu'un organisme inscrit peut consulter les disponibilités actualisées directement dans Formaplane ;
- invitation à encourager les organismes partenaires à utiliser Formaplane ;
- cartes contacts compactées ;
- parcours de partage réorganisé en trois parties distinctes.

### Recette
Validés :
- envoi vers un contact autorisé ;
- blocage immédiat après envoi ;
- délai de 20 jours ;
- suppression/recréation d'un contact avec la même adresse ;
- mélange de destinataires bloqués et autorisés ;
- copie facultative au formateur ;
- PDF disponible indépendamment du délai anti-spam ;
- PDF personnalisé par organisme ;
- commentaire intégré au PDF.

---

Version : 10.0
Date : 18/08/2026

------------------------------------------------------------------------

# Sprint 6 --- Moteur de missions (Terminé)

Le Sprint 6 transforme Formaplane d'un gestionnaire de formateurs en un
véritable moteur de gestion des missions.

## Mini Sprint 6.1 --- Base de données

### Ajouts

-   Création de la table `missions`
-   Création de la table `mission_dates`
-   Création de la table `mission_formateurs`
-   Relations entre les trois tables
-   Contraintes d'intégrité
-   Préparation de l'architecture multi-organismes

------------------------------------------------------------------------

## Mini Sprint 6.2 --- Gestion des missions

### Fonctionnalités

-   Création d'une mission
-   Modification d'une mission
-   Suppression d'une mission
-   Duplication d'une mission
-   Gestion de plusieurs dates
-   Bandeau récapitulatif de la mission
-   Écran unique de gestion

------------------------------------------------------------------------

## Mini Sprint 6.3 --- Recommandation des formateurs

### Ajouts

-   Classement automatique
-   Calcul des distances
-   Filtres multicritères
-   Sélection multiple des compétences
-   Sélection multiple du matériel
-   Affichage des résultats recommandés

------------------------------------------------------------------------

## Mini Sprint 6.4 --- Workflow métier

### Nouveau cycle

Sélection → Proposition → Acceptation → Affectation

### Nouveaux statuts

-   selectionne
-   proposition_envoyee
-   accepte
-   refuse
-   affecte

### Ajouts

-   Simulation des réponses
-   Historique des dates
-   Désaffectation

------------------------------------------------------------------------

## Mini Sprint 6.5 --- Conflits et planning intelligent

### Nouveautés

-   Distinction Option / Mission
-   Confidentialité entre organismes
-   Statut `indisponible_affecte_ailleurs`
-   Retour automatique à `accepte`
-   Affectation unique par mission
-   Fusion automatique du planning

Priorité d'affichage :

1.  Mission
2.  Option
3.  Indisponible déclaré
4.  Disponible
5.  Non renseigné

------------------------------------------------------------------------

# Architecture

-   Nouvelle séparation entre disponibilités déclarées et engagements de
    mission
-   Centralisation de la logique métier dans les services
-   Calcul dynamique du planning

------------------------------------------------------------------------

# Interface

Améliorations :

-   Bandeau mission compact
-   Réorganisation des panneaux
-   Filtres multiples
-   Liste des formateurs allégée
-   Modification des missions
-   Meilleure ergonomie générale

------------------------------------------------------------------------

# Résultat

À l'issue du Sprint 6, Formaplane permet :

-   de créer une mission ;
-   de rechercher les meilleurs formateurs ;
-   de proposer une mission ;
-   de suivre les réponses ;
-   d'affecter un formateur ;
-   de sécuriser les conflits ;
-   d'afficher automatiquement les Options et les Missions dans le
    planning.

Le Sprint 6 constitue la première version opérationnelle du moteur de
missions.

------------------------------------------------------------------------

# Prochaine étape

Sprint 7 --- Tableau de bord des missions.


------------------------------------------------------------------------

# Version corrective v0.6.1

- Refonte de la page Mission.
- Consultation d'une mission sur une page dédiée.
- Filtres identiques au listing.
- Tri par proximité.
- Affichage du lieu réellement reconnu.
- Accès à la fiche formateur dans un nouvel onglet.
- Correction du calcul des distances entre le listing et les missions.


------------------------------------------------------------------------

# Sprint 7 — Vues opérationnelles des missions (Terminé)

Le Sprint 7 transforme Formaplane en un véritable outil de planification quotidien.

## Mini Sprint 7.1 — Nouvelle architecture

### Ajouts

- Nouvelle navigation (Accueil, Planning, Missions, Formateurs, Carte, Paramètres)
- Création des nouvelles pages principales
- Planning mensuel des missions
- Synthèse mensuelle
- Navigation entre les mois

------------------------------------------------------------------------

## Mini Sprint 7.2 — Polish UI

### Améliorations

- Planning compact affichable sans scroll vertical
- Déplacement des commandes du calendrier dans la colonne de droite
- Compteur du nombre de missions par journée
- Une seule étiquette affichée par cellule
- Suppression des horaires sur les étiquettes du calendrier
- Optimisation de la densité d'affichage
- Harmonisation générale de l'interface

### Missions

- « Intitulé de la mission » devient « Code interne de session »
- « Lieu » devient « Nom du site » (facultatif)
- Calcul de proximité basé exclusivement sur l'adresse, le code postal et la ville

------------------------------------------------------------------------

# Résultat

À l'issue du Sprint 7, Formaplane dispose :

- d'une navigation moderne ;
- d'un planning mensuel opérationnel ;
- d'une interface optimisée pour la planification ;
- d'une recherche géographique plus fiable grâce à l'utilisation de l'adresse structurée.

------------------------------------------------------------------------

# Prochaine étape

Sprint 8 — Comptes formateurs.
------------------------------------------------------------------------

# Sprint 8 — Comptes, espaces et collaboration multi-organismes (Terminé)

Le Sprint 8 fait évoluer Formaplane vers une véritable plateforme multi-utilisateurs et multi-organismes. Un même compte peut désormais disposer d'un espace organisme de formation, d'un espace formateur, ou des deux.

## Authentification et sécurité

- Connexion et déconnexion avec Supabase Auth.
- Création de compte organisme.
- Création de compte formateur.
- Mot de passe oublié et réinitialisation sécurisée.
- Déconnexion après modification du mot de passe.
- Affichage / masquage du mot de passe sur les formulaires concernés.
- Gestion de session et routage selon le contexte utilisateur.
- Choix de l'espace pour les utilisateurs ayant une double casquette OF + formateur.

## Espace formateur

- Revendication sécurisée d'une fiche formateur existante.
- Rattachement d'un profil formateur à un compte utilisateur sans duplication.
- Tableau de bord formateur.
- Consultation et modification du profil professionnel.
- Consultation et modification des disponibilités.
- Consultation de l'historique des disponibilités.
- Consultation des propositions de mission.
- Consultation des missions.
- Planning formateur.
- Navigation dédiée à l'espace formateur.

## Gouvernance des disponibilités

- Les disponibilités sont rattachées au profil formateur.
- Elles peuvent être modifiées depuis l'espace formateur ou depuis un organisme autorisé.
- Les modifications sont historisées.
- L'origine d'une modification est affichée de façon adaptée :
  - le formateur peut identifier l'organisme ayant effectué une modification ;
  - l'OF auteur voit « Vous » ;
  - un autre OF voit une formulation neutre afin de préserver la confidentialité.
- Les notes de disponibilité respectent également les règles de propriété et de confidentialité.

## Propositions de mission

- Un formateur peut consulter les propositions qui lui sont adressées.
- Il peut accepter ou refuser une proposition.
- Les propositions et réponses sont intégrées au workflow métier existant.
- Les propositions publiques préparées au Sprint 8.2 restent compatibles avec les formateurs non encore inscrits.

## Réseau de formateurs et multi-organismes

- Création de la relation `organization_trainers`.
- Une même fiche formateur peut être référencée par plusieurs organismes.
- Recherche globale de formateurs existants.
- Ajout d'un formateur existant au réseau d'un OF sans créer de doublon.
- Les données communes du profil restent partagées.
- Les informations propres à chaque organisme restent cloisonnées.
- Inscription d'un nouvel organisme avec création de son espace.
- Adaptation progressive des missions au fonctionnement multi-organismes.

## Confidentialité des missions externes

Correction et sécurisation du comportement lorsqu'un formateur est affecté par un autre organisme :

- l'OF propriétaire de la mission voit normalement l'état « Mission » ;
- les autres OF voient uniquement « Indisponible » ;
- aucune information sur la mission externe, son client ou l'organisme concerné n'est révélée ;
- le moteur de recommandation conserve l'information nécessaire pour empêcher les doubles affectations sans exposer les données confidentielles.

Une RPC sécurisée `get_trainer_mission_commitments_safe` fournit uniquement les informations minimales nécessaires au calcul des disponibilités.

## Validation

La batterie de tests multi-organismes a validé notamment :

- accès d'une même fiche formateur par deux OF ;
- cloisonnement des informations propres à chaque OF ;
- double casquette OF + formateur ;
- modification des disponibilités depuis l'espace formateur et visibilité côté OF ;
- propositions et réponses de mission ;
- affectation d'une mission ;
- confidentialité d'une affectation réalisée par un autre OF ;
- affichage « Indisponible » chez l'OF tiers au lieu de « En mission ».

`npm run lint` : aucune erreur bloquante, un avertissement React Hook restant dans `usePlanningAvailability.js`.

`npm run build` : build de production validé.

------------------------------------------------------------------------

# Résultat du Sprint 8

Formaplane dispose désormais des fondations nécessaires à son fonctionnement SaaS multi-organismes :

- comptes utilisateurs réels ;
- authentification ;
- espaces OF et formateur ;
- double casquette avec un compte unique ;
- profil formateur revendicable ;
- réseau de formateurs partagé sans duplication ;
- disponibilités pilotables et historisées ;
- réponses aux propositions ;
- inscription d'organismes ;
- confidentialité inter-organismes ;
- missions et indisponibilités compatibles avec plusieurs OF.

------------------------------------------------------------------------

# Prochaine étape

Sprint 9 — Notifications, relances et automatisations.


------------------------------------------------------------------------

# Sprint 9 — Nom et identité Formaplane (Terminé)

## Identité produit

- Adoption officielle du nom **Formaplane**.
- Renommage technique du projet.
- Ajout des ressources de marque et harmonisation visuelle.
- Préparation des domaines `formaplane.fr` et `formaplane.com`.
- Mise en service de l'adresse `contact@formaplane.fr`.
- Dépôt de la marque engagé.

------------------------------------------------------------------------

# Sprint 10 — Préparation bêta et consolidation métier (Terminé)

Version de clôture : **v0.10.0**.

## Confidentialité et multi-organismes

- Sécurisation de la recherche globale des formateurs.
- Renforcement des RLS.
- Séparation de la localisation privée OF et de la localisation globale revendiquée.
- Durcissement des privilèges de `organization_trainers`.

## Référentiels

- Ajout du catalogue de compétences.
- Ajout du catalogue de matériel.
- Normalisation des compétences historiques.

## Comptes et paramètres

- Amélioration des informations de compte et d'organisation.
- Ajout du parcours de suppression de compte avec garde-fous et Edge Function dédiée.

## Workflow missions

- Historique détaillé des actions mission / formateur avec auteur.
- Gestion explicite des options acceptées.
- Désistement d'une option par le formateur.
- Historique formateur avec filtres.
- Fiche contact de l'organisme côté formateur.
- Revalidation après modification des conditions d'une mission.
- Blocage de l'affectation tant qu'une revalidation nécessaire est en attente.
- Commentaires rattachés aux actions d'historique.
- Affectation atomique : le formateur retenu est affecté et les autres options sont clôturées en `mission_pourvue`.
- Suppression définitive du statut mission `brouillon` au profit de `a_pourvoir`.

## Planning et ergonomie

- Simplification de la synthèse du planning OF.
- Masquage des missions annulées dans le planning.
- Liens directs vers la fiche mission depuis le planning et les disponibilités formateur.
- Amélioration des états et messages liés aux revalidations.

## Recette

Les parcours principaux ont été rejoués et validés : proposition simple, options concurrentes, affectation, mission pourvue ailleurs, désistement, désaffectation, revalidation, historiques/commentaires, plannings et création directe en `À pourvoir`.

# Prochaine étape

Sprint 11 — Brevo et e-mails transactionnels.

# Sprint 11 — Communications transactionnelles et consolidation des workflows métier (Terminé)

## Infrastructure e-mail

- Mise en place et consolidation des e-mails transactionnels Formaplane.
- Déploiement des fonctions Supabase nécessaires aux notifications métier.
- Harmonisation des e-mails envoyés aux formateurs et aux organismes de formation.
- Liens d'action et liens profonds vers les missions concernées.
- Gestion différenciée des destinataires disposant déjà d'un compte Formaplane et des destinataires externes.
- Invitation à créer un compte lorsque le destinataire n'est pas encore inscrit.

## Propositions de mission

- Envoi d'une proposition par E-mail Formaplane ou déclaration d'une information transmise par un autre canal.
- Acceptation ou refus possible depuis un lien public pour un formateur sans compte.
- Notification de l'OF après réponse du formateur.
- Commentaires de réponse conservés dans le workflow.
- Une mission déjà pourvue ne peut plus être acceptée depuis un ancien lien.

## Affectation et désaffectation

- L'OF choisit le canal utilisé pour informer le formateur.
- E-mail Formaplane proposé par défaut, avec possibilité d'utiliser un canal externe.
- Notification d'affectation adaptée au statut de compte du formateur.
- Désaffectation avec information du formateur et conservation de la cohérence métier.
- Les autres options sont clôturées lorsqu'un formateur est affecté.

## Modification importante et revalidation

- Les modifications importantes d'une mission engagée déclenchent une revalidation des formateurs concernés.
- L'OF choisit le canal d'information.
- Présentation des nouvelles conditions au formateur.
- Acceptation ou refus depuis Formaplane ou depuis un parcours public lorsque nécessaire.
- Notification de l'OF après réponse.
- Lorsqu'un formateur est finalement affecté, les autres demandes de revalidation deviennent non actionnables et la mission est indiquée comme pourvue.

## Annulation

- Workflow d'annulation consolidé.
- Information du formateur selon le canal choisi.
- E-mail d'annulation enrichi pour les formateurs ayant un compte.
- Remise en cohérence du planning et des disponibilités après annulation.

## Désistement formateur

- Désistement possible depuis une option acceptée.
- Désistement également possible après affectation.
- Commentaire facultatif.
- Notification de l'OF.
- Si le formateur affecté se désiste, son affectation est libérée et la mission redevient à pourvoir lorsque son état le permet.
- Le bouton du mail OF ouvre directement la mission concernée.

## Recette Sprint 11.9

Les parcours critiques ont été testés de bout en bout :

- proposition à un formateur avec compte ;
- proposition à un formateur sans compte ;
- acceptation et refus ;
- affectation et désaffectation ;
- modification importante acceptée ou refusée ;
- annulation d'une mission ;
- désistement avant et après affectation ;
- plusieurs formateurs intéressés puis mission pourvue ;
- liens contenus dans les e-mails ;
- canaux externes sans envoi automatique d'e-mail Formaplane.

Résultat : recette fonctionnelle validée avant clôture du Sprint 11.

------------------------------------------------------------------------

# Sprint 12 — Partage des disponibilités formateur (Terminé)

Version de clôture prévue : **v0.12.0**.

## Carnet de contacts OF

- Création d'un carnet de contacts propre à chaque formateur.
- Ajout et suppression de contacts.
- Sélection d'un ou plusieurs destinataires avant partage.
- Distinction entre OF inscrits sur Formaplane et contacts externes.
- Affichage du statut de référencement du formateur dans le réseau de l'OF.

## Sélection et aperçu

- Sélection d'un ou plusieurs mois à communiquer.
- Exploitation des disponibilités réelles du planning.
- Aperçu avant envoi.
- Présentation adaptée au destinataire : Disponible, Indisponible, Option avec votre organisme et signalement neutre d'options auprès d'autres organismes.

## E-mails de partage

- Envoi via l'infrastructure transactionnelle Formaplane / Brevo.
- Planning directement visible dans l'e-mail.
- Message facultatif commun à tous les OF.
- Message personnalisable contact par contact.
- Liens adaptés aux OF inscrits vers la fiche ou la recherche du formateur.
- Invitation à découvrir Formaplane pour les OF non inscrits.
- Consultation des disponibilités sans obligation de créer un compte.

## Historique et délivrabilité

- Journalisation des partages dans `email_logs`.
- Conservation du destinataire et des mois partagés.
- Affichage du dernier partage par contact.
- Suivi de l'état d'envoi et de délivrabilité Brevo.
- Conservation de la date de délivrance lorsque disponible.

## Partage public

- Sélection d'un mois pour une publication publique.
- Génération d'un visuel aux couleurs de Formaplane.
- Mise en avant de Formaplane dans le contenu généré.
- Texte de publication proposé puis librement modifiable.
- Sélection des compétences à mettre en avant.
- Intégration des compétences sélectionnées au visuel et au texte.

## Recette

Les parcours de partage privé et public ont été testés fonctionnellement. Les liens profonds, les messages personnalisés, la délivrabilité, l'historique des mois partagés, le texte modifiable, la sélection des compétences et la génération du visuel ont été validés.

# Prochaine étape

Sprint 13 — Tutos, explications, FAQ & transparence produit.

