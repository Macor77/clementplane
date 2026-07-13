DATABASE - TimeForma
Version : 2.0  
Dernière mise à jour : 12/07/2026
---
Objectif
Les données actuelles de TimeForma sont stockées dans Supabase.
Ce document distingue :
les tables actuellement utilisées ;
les tables prévues pour les futurs sprints.
---
Table actuelle : `trainers`
Cette table contient les informations des formateurs.
Colonnes principales
`id`
`created_at`
`updated_at`
Identité et coordonnées
`prenom`
`nom`
`email`
`telephone`
Adresse et géolocalisation
`adresse`
`code_postal`
`ville`
`latitude`
`longitude`
Informations métier
`competences`
`materiel`
`tarif`
`statut`
Informations diverses
`notes`
---
Table actuelle : `trainer_availability`
Une ligne représente l'état d'un formateur pour une journée donnée.
Colonnes
`id`
`trainer_id`
`day`
`status`
`note`
`updated_at`
Selon la structure réelle de la table, une colonne `created_at` peut également être présente.
Contrainte d'unicité
La combinaison suivante doit être unique :
```text
trainer_id + day
```
Cette contrainte permet l'utilisation de l'upsert Supabase avec :
```text
onConflict: trainer_id,day
```
Statuts
Valeurs actuellement prises en charge :
`dispo`
`indispo`
chaîne vide ou absence de statut pour Non renseigné
`mission` pour les anciennes données ou le futur affichage automatique
Règle métier
Le statut `mission` ne doit pas être choisi manuellement par le formateur.
Il sera généré automatiquement par le futur module Missions.
Notes
Le champ `note` est un texte libre.
Plusieurs informations sont stockées sous forme de lignes séparées.
Exemple :
```text
Disponible uniquement à partir de 14 h
Disponible en distanciel
Préférer les missions en Île-de-France
```
---
Chargement du planning mensuel
Le listing charge les disponibilités d'une période avec une seule requête Supabase.
La requête filtre :
une liste d'identifiants de formateurs ;
une date de début ;
une date de fin.
Les données sont ensuite organisées côté application sous la forme :
```text
formateur_id
  └── date
      ├── status
      ├── note
      └── updated_at
```
---
Tables prévues
Les tables suivantes correspondent aux futurs modules. Elles ne doivent pas être considérées comme entièrement implémentées tant que leur sprint n'est pas terminé.
---
Table prévue : `missions`
Objectif
Stocker les missions de formation créées par les organismes.
Colonnes envisagées
`id`
`organisme_id`
`formateur_id`
`titre`
`client`
`adresse`
`code_postal`
`ville`
`date_debut`
`date_fin`
`heure_debut`
`heure_fin`
`type_formation`
`statut`
`created_at`
`updated_at`
Règle métier
Une mission affectée doit modifier automatiquement l'affichage du planning.
---
Table prévue : `utilisateurs`
Objectif
Gérer les comptes utilisateurs.
Colonnes envisagées
`id`
`email`
`prenom`
`nom`
`role`
`organisme_id`
`formateur_id`
`created_at`
`updated_at`
---
Table prévue : `organismes`
Objectif
Préparer la version multi-organismes.
Colonnes envisagées
`id`
`nom`
`adresse`
`code_postal`
`ville`
`email`
`telephone`
`created_at`
`updated_at`
---
Relations prévues
un organisme possède plusieurs utilisateurs ;
un organisme crée plusieurs missions ;
un formateur possède plusieurs disponibilités journalières ;
un formateur peut réaliser plusieurs missions ;
un utilisateur peut être rattaché à un organisme ou à un formateur.
---
Confidentialité future
Dans la version SaaS :
chaque organisme accède uniquement à ses données privées ;
les détails d'une mission sont visibles uniquement par l'organisme propriétaire et le formateur concerné ;
les autres organismes voient uniquement une indisponibilité ;
les règles d'accès devront être protégées par les politiques RLS de Supabase.
---
Évolutions prévues
documents ;
contrats ;
factures ;
notifications ;
historique ;
statistiques ;
abonnements ;
paiements.