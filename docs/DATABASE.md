# DATABASE - TimeForma

Version : 1.0
Dernière mise à jour : 03/07/2026

---

# Objectif

Toutes les données de TimeForma sont stockées dans Supabase.

Chaque table possède :

- une clé primaire UUID
- une date de création
- une date de modification

---

# Table : formateurs

Contient toutes les informations des formateurs.

Colonnes principales :

- id
- created_at
- updated_at

Informations personnelles

- prénom
- nom
- email
- téléphone

Adresse

- adresse
- code_postal
- ville
- latitude
- longitude

Informations métier

- compétences
- matériel
- tarif
- statut

Informations diverses

- notes
- dernière_mise_à_jour

---

# Table : disponibilites

Une ligne représente une journée.

Colonnes :

- id
- formateur_id
- date
- statut

Statuts possibles :

- Disponible
- Indisponible
- Mission Alter Prévention

---

# Table : missions

Mission de formation.

Colonnes :

- id
- titre
- client
- adresse
- ville
- date
- heure_debut
- heure_fin
- formateur_id
- statut

---

# Table : utilisateurs

Gestion des comptes.

Colonnes :

- id
- email
- nom
- prénom
- rôle

---

# Table : organismes

Version SaaS.

Colonnes :

- id
- nom
- adresse
- email
- téléphone

---

# Relations

Un organisme possède plusieurs utilisateurs.

Un organisme possède plusieurs formateurs.

Un formateur possède plusieurs disponibilités.

Un formateur peut réaliser plusieurs missions.

---

# Évolutions prévues

À terme :

- documents
- contrats
- factures
- notifications
- historique
- statistiques