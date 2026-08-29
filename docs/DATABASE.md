# DATABASE — Clementplane

Version : 0.20
Dernière mise à jour : 27/08/2026
Correspond au Sprint 20.5 terminé et validé.

------------------------------------------------------------------------

# Objectif

Ce document décrit la structure de la base de données PostgreSQL
utilisée par Clementplane.

La base est hébergée sur Supabase et constitue l'unique source de vérité
des données métier.

------------------------------------------------------------------------

# Principes

-   Une information n'est stockée qu'à un seul endroit.
-   Les relations sont privilégiées aux duplications.
-   Les contraintes SQL garantissent la cohérence métier.
-   Toutes les opérations passent par les services de l'application.

------------------------------------------------------------------------

# Tables principales

## trainers

Contient les fiches des formateurs.

Principales informations :

-   identité
-   coordonnées
-   compétences
-   matériel
-   statut
-   tarif
-   coordonnées GPS

------------------------------------------------------------------------

## trainer_availability

Contient uniquement les disponibilités globales déclarées par le formateur.

Les déclarations effectuées par un OF ne sont pas écrites dans cette table.

Colonnes principales :

-   trainer_id
-   day
-   status
-   note
-   updated_at

### Statuts autorisés

-   dispo
-   indispo
-   (vide = non renseigné)

⚠️ Les états **Option** et **Mission** ne sont jamais enregistrés dans
cette table.

------------------------------------------------------------------------

## missions

Représente une mission.

Informations :

-   code interne
-   client
-   intitulé
-   formation
-   lieu
-   adresse
-   coordonnées GPS
-   compétences requises
-   matériel requis
-   prix de vente
-   coût formateur
-   commentaire
-   statut

### Statuts

-   a_pourvoir
-   affectee
-   confirmee
-   realisee
-   annulee
-   archivee

------------------------------------------------------------------------

## mission_dates

Une mission possède une ou plusieurs journées.

Colonnes :

-   mission_id
-   date
-   heure_debut
-   heure_fin

Relation :

``` text
1 mission
    ↓
1..n mission_dates
```

------------------------------------------------------------------------

## mission_formateurs

Table de liaison entre les missions et les formateurs.

Colonnes principales :

-   mission_id
-   formateur_id
-   statut
-   propose_le
-   repondu_le
-   affecte_le
-   commentaire

### Statuts

-   selectionne
-   proposition_envoyee
-   accepte
-   refuse
-   affecte
-   indisponible_affecte_ailleurs
-   annule

------------------------------------------------------------------------

# Relations

``` text
missions
    │
    ├───────────────┐
    ▼               ▼
mission_dates   mission_formateurs
                     │
                     ▼
                 trainers
```

------------------------------------------------------------------------

# Planning intelligent

Le planning est calculé par fusion :

``` text
trainer_availability
        +
mission_formateurs
        +
mission_dates
```

Priorité :

1.  Mission
2.  Option
3.  Indisponible déclaré
4.  Disponible
5.  Non renseigné

------------------------------------------------------------------------

# Contraintes importantes

## Une seule affectation

Une mission ne peut posséder qu'un seul formateur avec le statut :

``` text
affecte
```

Un index unique partiel garantit cette règle.

------------------------------------------------------------------------

## Conflits

Lorsqu'un formateur est affecté à une mission :

-   toutes les autres propositions acceptées en conflit passent
    automatiquement à :

``` text
indisponible_affecte_ailleurs
```

Si le conflit disparaît, elles reviennent automatiquement à :

``` text
accepte
```

------------------------------------------------------------------------

# Philosophie

La base doit rester simple, normalisée et prête à évoluer vers une
architecture multi-organismes sans remise en cause des tables
existantes.


------------------------------------------------------------------------

# Évolutions de la base — Sprints 8 à 10

## Identité et multi-organismes

Le modèle distingue désormais `profiles`, `organizations`, `memberships`, `trainer_profiles` et `organization_trainers`. Un profil formateur peut être partagé entre plusieurs organismes sans partager leurs données privées.

Pour un profil non revendiqué, la localisation propre à chaque OF est portée par `organization_trainers` (`ville`, `code_postal`, `latitude`, `longitude`). Après revendication du profil, la localisation globale du formateur devient la référence.

## Référentiels

Deux catalogues structurent désormais les saisies :

- `competency_catalog` pour les compétences ;
- `equipment_catalog` pour le matériel.

Les données historiques ont été normalisées sans refondre le moteur de matching existant.

## Historique du workflow mission / formateur

La table `mission_trainer_history` conserve les changements d'état et leur auteur. Les commentaires associés aux actions sont également conservés afin que l'OF et le formateur disposent d'une traçabilité exploitable.

Les statuts autorisés de `mission_formateurs` après le Sprint 10 sont :

- `selectionne` ;
- `proposition_envoyee` ;
- `accepte` ;
- `refuse` ;
- `affecte` ;
- `indisponible_affecte_ailleurs` ;
- `annule` ;
- `desiste` ;
- `mission_pourvue`.

L'affectation définitive est transactionnelle : le formateur choisi passe à `affecte` et les autres propositions/options actives de la même mission passent à `mission_pourvue`.

## Revalidation après modification d'une mission

Les tables `mission_change_requests` et `mission_change_request_trainers` assurent le suivi des modifications nécessitant une nouvelle validation des formateurs déjà engagés. Elles mémorisent la demande, les formateurs concernés, leur réponse et leur commentaire.

Tant qu'une revalidation est attendue, l'affectation définitive du formateur concerné est bloquée. Une mission précédemment affectée n'est plus considérée comme confirmée tant que le formateur n'a pas revalidé les nouvelles conditions.

## Statut des missions

Le statut métier `brouillon` a été supprimé au Sprint 10. Toute nouvelle mission entre directement dans le workflow avec `a_pourvoir`. Les anciennes lignes `brouillon` ont été migrées vers `a_pourvoir`.

Les statuts SQL autorisés de `missions` sont désormais :

- `a_pourvoir` ;
- `affectee` ;
- `confirmee` ;
- `realisee` ;
- `annulee` ;
- `archivee`.

## Sécurité

Le Sprint 10 renforce les RLS et les RPC de recherche/édition afin qu'un OF n'accède qu'aux données qui lui sont destinées. Les engagements externes restent utilisables pour prévenir les conflits de planning sans exposer les informations métier d'un autre organisme.

# Évolutions de la base — Sprint 11

## Revalidation des modifications

Le modèle utilise les structures `mission_change_requests` et `mission_change_request_trainers` pour suivre une modification importante et la réponse individuelle des formateurs concernés.

Une revalidation conserve notamment :
- la mission concernée ;
- l'organisme ;
- l'auteur de la demande ;
- les valeurs précédentes ;
- les nouvelles valeurs ;
- les anciennes et nouvelles dates ;
- l'état de réponse de chaque formateur.

## Historique

`mission_trainer_history` reste la trace métier des actions importantes entre une mission et un formateur. Le Sprint 11 renforce son rôle pour les changements de conditions, réponses, désistements et commentaires associés.

## Statuts et clôture

L'affectation d'un formateur clôt fonctionnellement les autres candidatures/options incompatibles avec une mission désormais pourvue.

Le désistement d'un formateur affecté fait passer sa relation au statut `desiste`, libère l'affectation et peut remettre la mission au statut `a_pourvoir`.

## Canaux de contact

Les migrations du Sprint 11 ajoutent les informations nécessaires pour distinguer les communications effectuées par Formaplane des informations transmises par un autre canal. Le canal de communication ne remplace pas le statut métier de la mission ou de la relation formateur/mission.

## Sécurité des réponses publiques

Les parcours destinés aux formateurs sans compte utilisent des fonctions dédiées et un périmètre de données limité. Les RPC authentifiées restent utilisées pour les actions propres aux utilisateurs connectés.


------------------------------------------------------------------------

# Évolutions de la base — Sprints 12 à 20

## Disponibilités OF / formateur — Sprint 20.5

La table `organization_trainer_availability` conserve les déclarations de disponibilité propres à un couple OF + formateur.

Les deux sources restent indépendantes :

- `trainer_availability` = déclaration globale du formateur ;
- `organization_trainer_availability` = déclaration locale d'un OF.

La RPC `get_organization_trainer_availability` calcule l'état effectif pour un OF. Lorsque les deux déclarations sont renseignées, celle dont `updated_at` est la plus récente est retenue. La déclaration locale de l'OF reste conservée même lorsqu'une modification plus récente du formateur devient prioritaire.

La lecture de la disponibilité globale passe par les fonctions sécurisées prévues à cet effet ; la table globale n'est pas exposée en lecture directe aux utilisateurs.

## Partage des disponibilités

Les migrations des Sprints 12 et 13 ajoutent les contacts de partage, le statut de référencement du contact, l’historique des partages et les garde-fous serveur nécessaires au délai anti-spam de 20 jours et à la réservation atomique d’un envoi.

## Support, contact public et mini-CRM

Les tables et fonctions liées à `support_requests` et aux demandes de contact public permettent de centraliser les demandes issues de l’application et de la landing page. Le Sprint 17 enrichit cette couche pour l’Admin et les statistiques.

## Administration et communications nouveautés

Le Sprint 17 ajoute les structures nécessaires aux statistiques d’administration, à l’historique des communications « nouveautés » et à la gestion de leurs destinataires. Le désabonnement des nouveautés reste distinct des e-mails opérationnels.

La migration `20260825094000_enforce_single_platform_admin.sql` impose le garde-fou correspondant à l’administration unique prévue pour Clementplane.

## Monitoring

Le Sprint 18 utilise `product_events` pour la journalisation non bloquante d’événements produit, notamment les erreurs client authentifiées via les RPC sécurisées prévues à cet effet.

## Invitations OF — Sprint 19

La migration `20260826110000_sprint19_trainer_organizations_invitations.sql` prend en charge le suivi des invitations envoyées par un formateur à ses organismes partenaires et les informations nécessaires au parcours d’inscription associé.

## Analytics PWA — Sprint 20

La migration `20260827113000_sprint20_pwa_analytics.sql` réutilise `product_events` pour enregistrer l’événement `app_opened` et son `access_mode` (`pwa` ou `browser`).

La fonction d’administration `admin_pwa_stats()` fournit les agrégats nécessaires au suivi de l’adoption PWA. Aucun identifiant matériel du téléphone n’est nécessaire à cette mesure.

# État de la base après le Sprint 20

Supabase/PostgreSQL reste l’unique source de vérité des données métier. La PWA n’introduit pas de base locale métier ni de mécanisme de synchronisation offline concurrent. Les règles RLS, RPC et contraintes serveur restent les garde-fous de référence pour le cloisonnement multi-organismes et les opérations sensibles.
