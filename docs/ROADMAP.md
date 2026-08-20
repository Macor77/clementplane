# ROADMAP — Formaplane

> Mise à jour : fin du Sprint 12 — 20 août 2026  
> Version de clôture visée : `v0.12.0`

## Vision

Formaplane est une plateforme de gestion des relations entre organismes de formation et formateurs indépendants.

Le produit permet aujourd'hui de gérer le réseau de formateurs, les disponibilités, les missions, les propositions, les affectations, les principaux événements du cycle de vie d'une mission, les communications transactionnelles et le partage des disponibilités.

Après le Sprint 12, la priorité est de rendre Formaplane plus autonome pour ses utilisateurs, plus fiable techniquement et plus facile à piloter pendant la bêta.

---

# Vue d'ensemble

| Sprint | Sujet | Statut |
|---|---|---|
| 1 | MVP — Gestion des formateurs | ✅ TERMINÉ |
| 2 | Migration Supabase | ✅ TERMINÉ |
| 3 | Disponibilités | ✅ TERMINÉ |
| 4 | Planning mensuel | ✅ TERMINÉ |
| 5 | Recherche & géolocalisation | ✅ TERMINÉ |
| 6 | Moteur de missions | ✅ TERMINÉ |
| 7 | Vues opérationnelles & UI | ✅ TERMINÉ |
| 8 | Comptes, espace formateur & multi-organismes | ✅ TERMINÉ |
| 9 | Identité Formaplane, domaine & marque | ✅ TERMINÉ |
| 10 | Préparation bêta & consolidation métier | ✅ TERMINÉ |
| 11 | Communications transactionnelles & workflows métier | ✅ TERMINÉ |
| 12 | Partage des disponibilités formateur | ✅ TERMINÉ |
| 13 | Tutos, explications, FAQ & transparence produit | 🔜 À FAIRE |
| 14 | Tests automatisés & surveillance | 🔜 À FAIRE |
| 15 | Dashboard Admin & statistiques d'utilisation | 🔜 À FAIRE |

---

# Sprints terminés

## Sprint 1 — MVP ✅

### Livré
- création, consultation, modification et suppression des formateurs ;
- coordonnées, compétences, matériel, tarif, statut et notes ;
- import CSV ;
- listing ;
- carte ;
- premiers calculs de distance.

---

## Sprint 2 — Migration Supabase ✅

### Livré
- migration des données vers PostgreSQL / Supabase ;
- services d'accès aux données ;
- GitHub, Vercel et Codespaces ;
- suppression progressive de la dépendance au stockage local.

---

## Sprint 3 — Disponibilités ✅

### Livré
- calendrier individuel ;
- Disponible / Indisponible / Non renseigné ;
- notes journalières ;
- conservation des mises à jour.

---

## Sprint 4 — Planning mensuel ✅

### Livré
- planning directement dans le listing ;
- comparaison de plusieurs formateurs ;
- navigation mensuelle ;
- mutualisation du chargement des disponibilités ;
- refactoring du listing et des composants planning.

---

## Sprint 5 — Recherche & géolocalisation ✅

### Livré
- recherche multicritères ;
- filtres compétences / matériel / statut ;
- recherche géographique ;
- calcul de distance ;
- géocodage sécurisé via Edge Function ;
- complétion des coordonnées GPS.

---

## Sprint 6 — Moteur de missions ✅

### Livré
- création et modification des missions ;
- plusieurs dates par mission ;
- moteur de recommandation ;
- propositions ;
- acceptation / refus ;
- affectation ;
- options ;
- conflits ;
- confidentialité inter-organismes ;
- planning intelligent ;
- détection des doubles affectations.

---

## Sprint 7 — Vues opérationnelles & UI ✅

### Livré
- Accueil ;
- Planning ;
- Missions ;
- Carte ;
- Paramètres ;
- synthèse mensuelle ;
- amélioration générale de l'ergonomie et de l'identité visuelle.

---

## Sprint 8 — Comptes, espace formateur & multi-organismes ✅

### Livré
- Supabase Auth ;
- compte utilisateur unique ;
- espace OF ;
- espace formateur ;
- double casquette OF + formateur ;
- revendication de profil ;
- disponibilités modifiables par le formateur ;
- historique et traçabilité ;
- propositions et réponses côté formateur ;
- réseau partagé de formateurs ;
- multi-organismes ;
- confidentialité des missions externes.

---

## Sprint 9 — Identité Formaplane, domaine & marque ✅

### Livré
- choix du nom Formaplane ;
- domaines `formaplane.fr` et `formaplane.com` ;
- identité visuelle ;
- logo ;
- adresse `contact@formaplane.fr` ;
- dépôt de marque INPI.

---

## Sprint 10 — Préparation bêta & consolidation métier ✅

### Livré
- sécurisation de la recherche globale ;
- renforcement des RLS ;
- localisation privée OF / localisation globale revendiquée ;
- référentiels compétences et matériel ;
- géocodage consolidé ;
- suppression de compte avec garde-fous ;
- workflow Proposition → Option → Affectation stabilisé ;
- options concurrentes ;
- mission pourvue ailleurs ;
- désistements ;
- désaffectations ;
- revalidation après modification importante ;
- historique détaillé ;
- simplification du planning OF ;
- suppression du statut Brouillon.

### Version
`v0.10.0`

---

## Sprint 11 — Communications transactionnelles & workflows métier ✅

### Objectif atteint
Finaliser les communications et les interactions OF ↔ formateurs autour du cycle de vie d'une mission.

### Livré
- infrastructure Brevo ;
- e-mails transactionnels centralisés ;
- journalisation des envois ;
- invitations ;
- propositions de mission ;
- réponses avec ou sans compte ;
- notifications OF ;
- affectation et désaffectation ;
- modification importante et revalidation ;
- annulation ;
- désistement avant et après affectation ;
- choix du canal de communication ;
- liens profonds dans les e-mails ;
- prise en compte des missions déjà pourvues ;
- recette fonctionnelle complète.

### Version
`v0.11.0`

---

## Sprint 12 — Partage des disponibilités formateur ✅

### Objectif atteint
Permettre au formateur de partager ses disponibilités avec ses organismes partenaires et d'utiliser Formaplane comme outil de communication et d'acquisition.

### 12.1 — Carnet de contacts OF ✅
- carnet privé propre à chaque formateur ;
- ajout, modification et suppression ;
- sélection d'un ou plusieurs contacts ;
- identification OF inscrit / non inscrit ;
- indication « Vous êtes dans son réseau / Pas encore dans son réseau » ;
- sécurité et RLS dédiées.

### 12.2 — Sélection et aperçu des disponibilités ✅
- sélection d'un ou plusieurs mois ;
- utilisation des vraies données du planning ;
- aperçu personnalisé selon l'OF destinataire ;
- affichage :
  - Disponible ;
  - Indisponible ;
  - Option avec votre organisme ;
  - Mission avec votre organisme ;
- signalement neutre lorsqu'un ou plusieurs autres organismes se sont positionnés ;
- aucune identité d'un autre OF révélée.

### 12.3 — Partage par e-mail ✅
- envoi à un ou plusieurs destinataires ;
- un e-mail individuel et personnalisé par OF ;
- calendrier directement lisible dans l'e-mail ;
- message facultatif commun ;
- message personnalisable OF par OF ;
- OF inscrit et formateur déjà référencé : lien direct vers la fiche ;
- OF inscrit et formateur non référencé : lien vers la recherche / ajout au réseau ;
- OF non inscrit : invitation à découvrir Formaplane ;
- lien profond corrigé vers l'espace OF ;
- rappel que les disponibilités doivent être confirmées directement auprès du formateur.

### Suivi des partages ✅
- journalisation dans `email_logs` ;
- date du dernier partage ;
- destinataire ;
- mois partagés ;
- statut d'envoi ;
- statut de délivrabilité Brevo ;
- date de délivrance lorsqu'elle est disponible.

### 12.4 — Partage public / réseaux sociaux ✅
- choix d'un mois ;
- génération d'un visuel Formaplane ;
- identité graphique Formaplane intégrée ;
- mise en avant naturelle de Formaplane ;
- texte de publication proposé automatiquement ;
- texte librement modifiable ;
- sélection par le formateur des compétences à mettre en avant ;
- compétences intégrées au visuel et au texte ;
- téléchargement du visuel ;
- copie du texte ;
- partage natif lorsque l'appareil le permet ;
- aucune information sur les OF ou les options concurrentes publiée.

### Recette Sprint 12 ✅
Validés :
- carnet de contacts ;
- distinction OF inscrit / externe ;
- référencement dans le réseau ;
- aperçu multi-mois ;
- envoi mono et multi-destinataires ;
- message commun et personnalisé ;
- réception du mail ;
- délivrabilité ;
- liens vers la fiche formateur ;
- partage public ;
- texte modifiable ;
- compétences sélectionnables ;
- génération du visuel ;
- conservation des mois partagés.

### Version
`v0.12.0` à taguer après validation finale de la production.

---

# Prochains sprints

## Sprint 13 — Tutos, explications, FAQ & transparence produit 🔜

### Objectif
Permettre à un nouvel utilisateur de comprendre Formaplane et les conséquences de ses actions sans accompagnement systématique.

### Périmètre validé
- explications contextuelles sur les pages et actions qui le nécessitent ;
- explication de ce qui va se produire avant les actions importantes ;
- menu dédié **Tutos / Explications** ;
- couverture des principales fonctionnalités ;
- FAQ ;
- affichage de la version actuellement déployée ;
- présentation accessible des fonctionnalités existantes ;
- roadmap publique simplifiée :
  - fonctionnalités existantes ;
  - fonctionnalités envisagées ;
  - grandes orientations produit.

### Enjeu produit
Préparer l'élargissement de la bêta et réduire le besoin d'assistance individuelle.

---

## Sprint 14 — Tests automatisés & surveillance 🔜

### Objectif
Sécuriser les parcours critiques avant d'augmenter le nombre d'utilisateurs.

### Périmètre cible
- tests automatisés des workflows métier critiques ;
- tests des parcours OF ;
- tests des parcours formateur ;
- tests des réponses publiques sans compte ;
- contrôles des RPC ;
- contrôles RLS ;
- contrôles des Edge Functions ;
- tests des communications transactionnelles ;
- surveillance des erreurs frontend et backend ;
- surveillance des traitements sensibles ;
- alertes exploitables en cas de dysfonctionnement important.

### Enjeu produit
Détecter une régression avant qu'elle ne soit découverte par un utilisateur bêta.

---

## Sprint 15 — Dashboard Admin & statistiques d'utilisation 🔜

### Objectif
Créer un espace d'administration Formaplane permettant de comprendre l'utilisation réelle du produit.

### Indicateurs envisagés
- utilisateurs inscrits ;
- organismes de formation ;
- formateurs ;
- évolution des inscriptions ;
- activité ;
- missions créées ;
- propositions et réponses ;
- affectations ;
- communications ;
- partages de disponibilités ;
- adoption des fonctionnalités ;
- indicateurs techniques et erreurs utiles au pilotage.

### Distinction importante
Ce dashboard est un outil interne d'administration de Formaplane. Il ne doit pas être confondu avec de futures statistiques métier destinées aux OF.

---

# Jalon après le Sprint 15

À la fin du Sprint 15, Formaplane doit disposer :
- d'un cœur métier complet ;
- de communications transactionnelles opérationnelles ;
- d'un partage des disponibilités capable de favoriser l'acquisition ;
- d'une aide utilisateur intégrée ;
- d'une couverture automatisée des parcours critiques ;
- d'outils internes permettant d'observer l'utilisation de la bêta.

À partir de ce jalon, l'ordre des développements sera fortement influencé par les retours et les usages réels.

---

# Pistes pour les Sprints 16+

Ordre non figé :

- améliorations UX et productivité ;
- réseau et collaboration entre utilisateurs ;
- gestion avancée des utilisateurs d'un OF ;
- statistiques métier destinées aux OF ;
- documents et pièces liées aux missions ;
- intégrations calendrier ;
- communications SMS ;
- notifications Push ;
- automatisations et relances avancées ;
- fonctionnalités assistées par IA ;
- autres besoins issus de la bêta.

## Règle de priorisation

**Retours utilisateurs + fréquence du besoin + valeur métier + risque technique.**

---

# Méthode de clôture d'un sprint

Un sprint est terminé lorsque :
- le développement est réalisé ;
- la recette est validée ;
- Supabase est vérifié ;
- la documentation est mise à jour ;
- la roadmap est synchronisée ;
- le CHANGELOG est mis à jour ;
- le code est poussé sur GitHub ;
- Vercel est déployé ;
- la version en ligne est testée ;
- le tag de version est créé ;
- un ZIP complet du projet est archivé.

---

# Priorité actuelle

```text
Clôture de la version v0.12.0
↓
Sprint 13 — Tutos, explications, FAQ & transparence produit
```
