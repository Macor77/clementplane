# ROADMAP - Formaplane

> Mise à jour : fin du Sprint 12 — 20 août 2026

## Vision

Formaplane est une application de gestion des relations entre organismes de formation et formateurs indépendants. Le cœur produit permet désormais de gérer le réseau formateurs, les disponibilités, les missions, les propositions, les affectations et les principaux événements qui surviennent pendant la vie d'une mission.

Après le Sprint 12, le partage des disponibilités est opérationnel. La priorité devient désormais l'autonomie utilisateur, puis la fiabilité technique et le pilotage de l'usage.

---

# État actuel

## Sprints 1 à 10 — Socle produit et préparation bêta

Terminés.

Ils ont notamment construit le socle React/Vite/Supabase, le réseau formateurs, les disponibilités, le moteur de missions, le planning, les comptes et espaces, le multi-organismes, l'identité Formaplane et la consolidation métier préparatoire à la bêta.

## Sprint 11 — Communications transactionnelles & workflows métier

**Statut : TERMINÉ — recette fonctionnelle validée.**

### Objectif

Finaliser les communications et les interactions OF ↔ formateurs autour du cycle de vie d'une mission.

### Livré

- e-mails transactionnels Formaplane ;
- prise en charge des formateurs avec ou sans compte ;
- propositions, acceptations et refus ;
- notifications OF ;
- choix du canal de communication lorsque pertinent ;
- affectation et désaffectation ;
- modification importante d'une mission et revalidation ;
- clôture des réponses devenues impossibles lorsqu'une mission est pourvue ;
- annulation ;
- désistement d'une option ;
- désistement après affectation ;
- liens profonds depuis les e-mails ;
- cohérence planning / disponibilités / statuts ;
- recette de bout en bout des principaux scénarios.

---

# Sprint 12 — Partage des disponibilités formateur

**Statut : TERMINÉ — recette fonctionnelle validée.**

## Objectif

Permettre à un formateur d'utiliser Formaplane pour partager facilement ses disponibilités avec ses organismes partenaires et de valoriser publiquement ses disponibilités, tout en faisant de cette fonctionnalité un levier naturel de découverte de Formaplane.

## Livré

### Carnet de contacts OF

- carnet de contacts propre à chaque formateur ;
- ajout et suppression de contacts ;
- sélection d'un ou plusieurs destinataires ;
- identification des OF disposant déjà d'un compte Formaplane et des contacts externes ;
- indication permettant au formateur de savoir s'il est déjà référencé dans le réseau de l'OF.

### Sélection et aperçu des disponibilités

- sélection d'un ou plusieurs mois ;
- exploitation des disponibilités réellement enregistrées dans le planning ;
- aperçu avant envoi ;
- présentation adaptée au destinataire :
  - Disponible ;
  - Indisponible ;
  - Option avec votre organisme ;
  - Disponible avec signalement lorsqu'un ou plusieurs autres organismes se sont positionnés, sans révéler leur identité.

### E-mails de partage

- envoi via l'infrastructure transactionnelle Formaplane / Brevo ;
- planning directement lisible dans l'e-mail ;
- possibilité d'ajouter un message commun à tous les destinataires ;
- possibilité de personnaliser le message contact par contact ;
- pour un OF inscrit et ayant déjà le formateur dans son réseau : lien direct vers la fiche du formateur ;
- pour un OF inscrit ne l'ayant pas encore dans son réseau : lien permettant de retrouver le formateur dans Formaplane ;
- pour un OF non inscrit : invitation courte à découvrir Formaplane et à créer un compte ;
- consultation des disponibilités reçues sans obligation de créer un compte ;
- formulation rappelant que les disponibilités peuvent évoluer et qu'il convient de consulter le formateur pour les informations les plus récentes.

### Suivi des partages

- journalisation dans `email_logs` ;
- conservation de la date d'envoi ;
- conservation du destinataire ;
- conservation des mois partagés ;
- affichage du dernier partage par contact ;
- suivi du statut d'envoi et de délivrabilité ;
- remontée de la date de délivrance lorsque disponible.

### Partage public et réseaux sociaux

- sélection d'un mois à mettre en avant ;
- génération d'un visuel cohérent avec l'identité Formaplane ;
- mise en avant de Formaplane dans le contenu généré ;
- texte de publication proposé automatiquement mais modifiable par le formateur ;
- sélection par le formateur des compétences qu'il souhaite mettre en avant ;
- intégration des compétences sélectionnées au visuel et au texte ;
- préparation d'un contenu adapté au partage sur les réseaux sociaux.

## Recette

Les principaux parcours ont été testés et validés :
- gestion du carnet de contacts ;
- distinction OF inscrit / non inscrit ;
- statut de référencement du formateur chez l'OF ;
- sélection de plusieurs mois et aperçu ;
- envoi à un ou plusieurs contacts ;
- messages communs et personnalisés ;
- réception des e-mails ;
- suivi de la délivrabilité ;
- liens vers la fiche ou la recherche du formateur ;
- partage public ;
- personnalisation du texte ;
- sélection des compétences ;
- génération du visuel.

La conservation des mois partagés a également été vérifiée : les mois sont enregistrés dans les métadonnées de `email_logs` et remontés par la fonction dédiée au dernier partage.

## Résultat

Le Sprint 12 transforme le planning du formateur en outil de communication et d'acquisition. Le formateur peut communiquer ses disponibilités à ses partenaires depuis Formaplane, suivre ses derniers envois et produire un contenu public valorisant à la fois son activité et Formaplane.

---

# Sprint 13 — Tutos, explications, FAQ & transparence produit

**Statut : À FAIRE**

## Objectif

Permettre à un nouvel utilisateur de comprendre Formaplane et ses conséquences métier sans accompagnement systématique.

## Périmètre validé

- explications contextuelles sur les pages et actions qui le nécessitent ;
- explication de ce qui va se produire avant les actions importantes ;
- menu dédié **Tutos / Explications** ;
- couverture des principales fonctionnalités ;
- FAQ ;
- affichage de la version actuellement déployée ;
- présentation accessible des fonctionnalités existantes ;
- roadmap publique simplifiée présentant les fonctionnalités existantes, les idées et les évolutions envisagées.

## Enjeu produit

Préparer l'élargissement de la bêta en réduisant les incompréhensions et le besoin d'assistance individuelle.

---

# Sprint 14 — Tests automatisés & surveillance

**Statut : À FAIRE**

## Objectif

Sécuriser techniquement les parcours critiques avant d'augmenter le nombre d'utilisateurs.

## Périmètre cible

- tests automatisés des workflows métier critiques ;
- tests des principaux parcours OF ;
- tests des principaux parcours formateur ;
- tests des réponses publiques sans compte ;
- contrôles des RPC et des règles de sécurité / RLS ;
- contrôles des Edge Functions ;
- tests des communications transactionnelles critiques ;
- surveillance des erreurs frontend et backend ;
- surveillance des fonctions et traitements sensibles ;
- alertes exploitables lorsqu'un dysfonctionnement important apparaît.

## Enjeu produit

Éviter qu'une régression sur un workflow déjà validé soit découverte uniquement par un utilisateur bêta.

---

# Sprint 15 — Dashboard Admin & statistiques d'utilisation

**Statut : À FAIRE**

## Objectif

Créer directement dans Formaplane un espace d'administration permettant de comprendre l'utilisation réelle du produit.

## Périmètre cible

Le dashboard devra permettre de suivre notamment :
- nombre d'utilisateurs inscrits ;
- nombre d'organismes de formation ;
- nombre de formateurs ;
- évolution des inscriptions ;
- activité des utilisateurs ;
- missions créées ;
- propositions et réponses ;
- affectations ;
- utilisation des communications ;
- utilisation du partage des disponibilités ;
- adoption des principales fonctionnalités ;
- indicateurs techniques ou erreurs utiles au pilotage lorsque pertinent.

Les métriques exactes seront précisées au démarrage du sprint en fonction des données réellement disponibles et des besoins apparus pendant la bêta.

## Distinction importante

Ce dashboard est un **outil d'administration de Formaplane**. Il ne doit pas être confondu avec de futures statistiques métier destinées aux organismes de formation.

---

# Jalon après le Sprint 15

À la fin du Sprint 15, Formaplane doit disposer :
- d'un cœur métier complet et testé manuellement ;
- de communications transactionnelles opérationnelles ;
- d'un mécanisme de partage des disponibilités pouvant favoriser l'acquisition ;
- d'une aide utilisateur intégrée ;
- d'une couverture automatisée des parcours critiques ;
- d'outils internes pour observer l'utilisation de la bêta.

À partir de ce jalon, l'ordre des développements suivants devra être fortement influencé par les retours et les usages réels des premiers utilisateurs.

---

# Pistes pour les Sprints 16+

Ces sujets restent pertinents mais leur ordre n'est pas figé :

- améliorations UX et productivité ;
- réseau et collaboration entre utilisateurs ;
- gestion plus avancée des équipes / utilisateurs d'un OF ;
- statistiques métier destinées aux OF ;
- documents et pièces liées aux missions ;
- intégrations calendrier ;
- communications SMS ;
- automatisations et relances avancées ;
- fonctionnalités assistées par IA ;
- autres besoins identifiés pendant la bêta.

La règle de priorisation après le Sprint 15 sera : **retours utilisateurs + fréquence du besoin + valeur métier + risque technique**.

---

# Archive — ancienne roadmap

La roadmap ci-dessous est conservée comme historique de planification. Ses numéros et priorités futures sont remplacés par la roadmap ci-dessus.

ROADMAP - Formaplane
Version : 10.0  
Dernière mise à jour : 18/08/2026  
Correspond à la clôture du Sprint 10 et à la préparation du Sprint 11 de Formaplane.
---
Vision
Formaplane a pour ambition de devenir la plateforme de référence permettant aux organismes de formation de :
gérer leur réseau de formateurs ;
rechercher rapidement les profils les plus adaptés ;
consulter leurs disponibilités ;
créer et suivre des missions ;
proposer des missions à plusieurs formateurs ;
gérer les réponses ;
affecter un formateur ;
sécuriser les plannings ;
éviter les doubles affectations ;
collaborer progressivement avec les formateurs ;
piloter l'activité de formation.
Le développement suit une règle simple :
> Construire d'abord un excellent outil interne pour Alter Prévention, puis le transformer progressivement en plateforme SaaS multi-organismes.
Chaque sprint doit produire une fonctionnalité immédiatement utile, tout en préparant les futures évolutions du produit.
---
Principes de développement
Les priorités du projet sont :
Simplicité d'utilisation.
Valeur métier immédiate.
Fiabilité des données.
Évolutivité.
Lisibilité de l'interface.
Qualité du code.
Confidentialité des informations.
Réduction du nombre de manipulations.
Une fonctionnalité ne doit pas être développée uniquement parce qu'elle est techniquement intéressante. Elle doit résoudre un besoin réel de coordination, de recherche ou de planification.
---
État actuel
Sprint 1 — MVP ✅
Gestion des formateurs
Création d'une fiche formateur
Consultation
Modification
Suppression
Gestion des coordonnées
Gestion des compétences
Gestion du matériel
Gestion du tarif
Gestion du statut
Notes internes
Import et visualisation
Import CSV
Listing des formateurs
Carte Leaflet
Premiers calculs de distance
Résultat
Une première version opérationnelle de Formaplane permet de centraliser les informations des formateurs dans une seule interface.
---
Sprint 2 — Migration Supabase ✅
Base de données
Migration des données vers PostgreSQL
Création des tables Supabase
Suppression progressive de la dépendance au stockage local
Synchronisation des données avec le backend
Architecture
Création de services spécialisés
Centralisation des accès Supabase
Séparation entre affichage et accès aux données
Préparation de l'architecture SaaS
Déploiement
Connexion du projet à GitHub
Déploiement sur Vercel
Utilisation de Codespaces
Travail possible entièrement en ligne
Résultat
Supabase devient le backend officiel de Formaplane. Le projet dispose désormais d'une base technique stable et déployée.
---
Sprint 3 — Disponibilités ✅
Calendrier individuel
Ajout d'un calendrier mensuel dans la fiche formateur
Navigation entre les mois
Gestion journalière des disponibilités
Statuts déclarés
Disponible
Indisponible
Non renseigné
Notes
Ajout de notes par journée
Plusieurs informations possibles par date
Conservation de la dernière mise à jour
Résultat
Chaque formateur possède un planning individuel permettant de suivre ses disponibilités déclarées.
---
Sprint 4 — Planning mensuel ✅
Planning dans le listing
Intégration du planning directement dans la liste des formateurs
Comparaison de plusieurs formateurs sur une même période
Alignement des jours
Navigation mensuelle globale
Légende des statuts
Mise en évidence du jour courant
Performance
Chargement des disponibilités sur un mois complet
Réduction du nombre de requêtes Supabase
Mutualisation des données du planning
Résultat
Le coordinateur peut comparer rapidement les disponibilités de tous les formateurs sans ouvrir chaque fiche.
---
Sprint 4.5 — Refactoring du listing ✅
Objectif
Réorganiser le code sans modifier le comportement fonctionnel.
Réalisations
Allègement de `ListingTable.jsx`
Création des composants spécialisés du planning
Création de hooks dédiés
Simplification de `Listing.jsx`
Clarification des responsabilités
Principaux composants
`PlanningHeader.jsx`
`PlanningRow.jsx`
`PlanningCell.jsx`
`PlanningLegend.jsx`
`planningUtils.js`
Principaux hooks
`useFormateurs`
`usePlanningAvailability`
`useListingFilters`
`useSort`
Résultat
Le code devient plus lisible, plus maintenable et plus facile à faire évoluer.
---
Sprint 5 — Recherche et géolocalisation ✅
Mini Sprint 5.1 — Recherche multicritères
Recherche texte
Filtres par statut
Filtres par compétences
Filtres par matériel
Combinaison de plusieurs critères
Tri des colonnes
Mini Sprint 5.2 — Recherche géographique
Saisie d'un lieu de formation
Déclenchement manuel du calcul
Suppression de la recherche automatique pendant la saisie
Affichage du lieu reconnu
Tri automatique par distance
Mini Sprint 5.3 — Géocodage sécurisé
Création de l'Edge Function Supabase `geocode`
Suppression des appels directs du navigateur à Nominatim
Centralisation du géocodage côté serveur
Gestion des erreurs
Affichage de la ville, du département et du code postal reconnus
Mini Sprint 5.4 — Coordonnées GPS des formateurs
Complétion des coordonnées manquantes
Utilisation successive de :
l'adresse complète ;
code postal + ville ;
ville seule.
Mise à jour des fiches formateurs
Résultat
Formaplane permet de rechercher et classer les formateurs selon leur proximité avec un futur lieu de mission.
---
Sprint 6 — Moteur de missions ✅
Objectif
Faire de la mission le cœur opérationnel de Formaplane.
À la fin du Sprint 6, l'organisme de formation peut :
créer une mission ;
enregistrer plusieurs dates ;
préciser les compétences et le matériel requis ;
consulter les formateurs recommandés ;
sélectionner plusieurs formateurs ;
proposer la mission ;
simuler les réponses ;
affecter un formateur ;
gérer les conflits ;
mettre à jour automatiquement les plannings.
La mission existe indépendamment des formateurs.
Elle peut être créée, enregistrée et modifiée sans qu'aucun formateur ne soit encore sélectionné.
---
Mini Sprint 6.1 — Base de données ✅
Tables créées
`missions`
Contient les informations générales d'une mission :
identifiant ;
code interne ;
client ;
intitulé ;
formation ;
lieu ;
adresse ;
code postal ;
ville ;
latitude ;
longitude ;
compétences requises ;
matériel requis ;
prix de vente ;
coût formateur ;
commentaire ;
statut ;
dates de création et de modification.
`mission_dates`
Contient les journées d'une mission :
mission liée ;
date ;
heure de début ;
heure de fin.
Une mission peut comporter plusieurs journées distinctes.
`mission_formateurs`
Contient les liens entre missions et formateurs :
mission ;
formateur ;
statut de la relation ;
date de proposition ;
date de réponse ;
date d'affectation ;
commentaire ;
historique technique.
Relations
une mission possède plusieurs dates ;
une mission peut être liée à plusieurs formateurs ;
un formateur peut être lié à plusieurs missions ;
la suppression d'une mission supprime automatiquement ses dates et ses associations.
Sécurité
activation de RLS ;
politiques temporaires adaptées à l'application actuelle sans authentification ;
architecture préparée pour une future isolation par organisme.
---
Mini Sprint 6.2 — Gestion des missions ✅
Création
Formulaire de création
Informations générales
Lieu
Une ou plusieurs dates
Horaires par journée
Compétences requises
Matériel requis
Commentaire
Modification
Chargement d'une mission existante
Modification de toutes les informations
Modification des dates
Remplacement des dates en base
Conservation des liens avec les formateurs
Suppression
Confirmation avant suppression
Suppression des dates par cascade
Suppression des associations par cascade
Consultation
Liste des missions à gauche
Détail de la mission à droite
Sélection rapide d'une mission
Bandeau résumé compact
Informations principales toujours visibles pendant le défilement
Duplication
Service de duplication disponible
Copie des informations et des dates
Aucun formateur recopié
Nouveau statut en brouillon
---
Mini Sprint 6.3 — Moteur de recommandation ✅
Classement automatique
Les formateurs sont classés selon plusieurs critères :
statut du formateur ;
distance ;
disponibilités ;
compétences ;
matériel.
Filtres
Sélection multiple des compétences
Sélection multiple du matériel
Logique ET
Un formateur doit posséder tous les critères sélectionnés
Réinitialisation rapide des filtres
Compteur de résultats
Distance
Géocodage du lieu de mission
Calcul de distance pour chaque formateur
Affichage du lieu reconnu
Classement par distance uniquement
Consultation d'une mission sur une page dédiée
Colonne latérale des informations de mission
Filtres harmonisés avec le listing
Bouton « Voir la fiche » ouvrant un nouvel onglet
Affichage du lieu réellement retenu par le géocodage
Tri par proximité ou par nom
Disponibilité
La disponibilité reste visible, mais aucun formateur n'est masqué automatiquement.
Les états possibles dans les recommandations sont :
disponible ;
partiellement disponible ;
non renseigné ;
indisponible.
Score
Le score prend notamment en compte :
statut Premium ou Standard ;
distance ;
disponibilité déclarée ;
correspondance des compétences ;
correspondance du matériel.
Une option n'ajoute ni bonus ni malus.
---
Mini Sprint 6.4 — Workflow des propositions ✅
Cycle métier
```text
Sélectionné
↓
Proposition envoyée
↓
Accepté ou Refusé
↓
Affecté
```
Sélection
Un formateur sélectionné est seulement identifié comme candidat potentiel.
Aucune proposition ne lui est encore envoyée.
Proposition
Le statut passe à :
```text
proposition_envoyee
```
La date d'envoi est enregistrée.
Réponse
Le formateur peut :
accepter ;
refuser.
Pour le moment, la réponse est simulée depuis l'interface de l'OF afin de valider le workflow avant la création de l'espace formateur.
Affectation
Après acceptation, l'OF doit confirmer l'affectation.
L'acceptation seule ne confirme pas la mission.
L'interface précise :
> Le formateur a accepté, mais la mission n'est pas encore confirmée. L'OF doit maintenant l'affecter.
Désaffectation
retrait de l'affectation ;
retour de la mission au statut À pourvoir ;
retour du formateur au statut Accepté lorsque cela reste cohérent.
---
Mini Sprint 6.5 — Options, conflits et planning intelligent ✅
Distinction Option / Mission
Option
Une option apparaît lorsque :
```text
mission_formateurs.statut = accepte
```
Elle signifie :
le formateur a accepté la proposition ;
l'OF n'a pas encore confirmé l'affectation ;
le formateur reste disponible ;
il peut recevoir d'autres propositions ;
il peut accepter plusieurs options sur la même période ;
l'option ne réduit pas son score.
Mission
Une mission apparaît lorsque :
```text
mission_formateurs.statut = affecte
```
Elle signifie :
le formateur est officiellement retenu ;
les dates sont bloquées ;
il devient indisponible pour toute autre mission en conflit.
Confidentialité
Un organisme ne voit jamais :
le nom d'un autre organisme ;
le client d'une autre mission ;
le contenu d'une autre mission ;
le nombre d'options concurrentes ;
le détail des engagements du formateur.
Lorsqu'un conflit existe, l'autre organisme voit uniquement :
```text
Indisponible
```
avec une explication neutre.
Nouveau statut automatique
```text
indisponible_affecte_ailleurs
```
Ce statut est appliqué lorsque :
le formateur avait accepté une proposition ;
un autre organisme l'affecte sur une mission comportant une date commune.
La proposition ne passe pas à Refusé.
L'historique de l'acceptation est conservé.
Retour automatique
Si l'affectation à l'origine du conflit disparaît :
suppression de la mission ;
désaffectation ;
modification des dates ;
alors le statut revient automatiquement à :
```text
accepte
```
Affectation unique
une mission ne peut avoir qu'un seul formateur affecté ;
une affectation concurrente sur une même date est bloquée ;
un index unique partiel renforce cette règle en base.
Architecture du planning
Le planning est calculé à partir de plusieurs sources :
```text
trainer_availability
+
mission_formateurs
+
mission_dates
```
`trainer_availability` contient uniquement ce que le formateur déclare lui-même :
disponible ;
indisponible ;
non renseigné ;
notes.
Les états Option et Mission ne sont pas enregistrés dans cette table.
Ils sont déduits dynamiquement des missions.
Priorité d'affichage
```text
Mission
↓
Option
↓
Indisponible déclaré
↓
Disponible déclaré
↓
Non renseigné
```
Planning individuel
La fiche formateur affiche automatiquement :
Option en jaune ;
Mission en bleu ;
les disponibilités déclarées ;
les notes.
Une cellule Option ou Mission ne peut pas être modifiée manuellement.
Planning du listing
Le planning compact du listing affiche également :
Option ;
Mission ;
Disponible ;
Indisponible ;
Non renseigné.
Résultat du Sprint 6
Formaplane dispose désormais d'un véritable moteur de missions capable de :
rechercher ;
recommander ;
sélectionner ;
proposer ;
suivre les réponses ;
affecter ;
détecter les conflits ;
protéger la confidentialité ;
calculer automatiquement le planning.
Le cœur métier du produit est opérationnel.
---
Sprint 7 — Vues opérationnelles des missions ✅
Objectif
Faire de la mission le véritable centre de Formaplane.
Après le Sprint 6, les fonctionnalités métier sont en place.
Le Sprint 7 a pour objectif de transformer ces fonctionnalités en une expérience utilisateur fluide, moderne et orientée planification.
Une même mission pourra être visualisée selon plusieurs vues complémentaires :
tableau de bord (Accueil) ;
planning mensuel ;
liste des missions ;
carte géographique.
Toutes ces vues s'appuient sur une seule base de données des missions.
Le principe retenu est le suivant :
> Une mission doit pouvoir être comprise en moins de deux secondes.
---
Navigation
La navigation principale devient :
🏠 Accueil
📅 Planning
📋 Missions
👥 Formateurs
🗺️ Carte
⚙️ Paramètres
Chaque écran répond à un besoin différent tout en manipulant les mêmes données.
---
Mini Sprint 7.1 — Nouvelle architecture ✅
Objectif
Mettre en place la nouvelle organisation de Formaplane.
Réalisations
nouvelle navigation principale ;
création de la page Accueil ;
création de la page Planning ;
création de la page Missions ;
création de la page Carte ;
création de la page Paramètres ;
réorganisation des routes ;
nouveau planning mensuel ;
navigation entre les mois ;
affichage des missions dans le calendrier ;
synthèse mensuelle ;
panneau latéral de la journée sélectionnée ;
actions rapides.
Résultat
L'architecture générale de Formaplane est désormais en place.
---
Mini Sprint 7.2 — Polish UI ✅
Objectif
Transformer l'interface actuelle en une application moderne, élégante et agréable à utiliser.
Ce mini-sprint est entièrement consacré à l'expérience utilisateur.
Aucune nouvelle fonctionnalité métier importante n'est ajoutée.
Planning
amélioration des cartes mission ;
hiérarchie visuelle plus claire ;
badges plus lisibles ;
meilleure gestion des journées chargées ;
amélioration du panneau latéral ;
animations légères ;
amélioration des espacements ;
optimisation responsive.
Interface
harmonisation des couleurs ;
amélioration des ombres ;
amélioration des boutons ;
uniformisation des cartes ;
amélioration de la typographie ;
amélioration des icônes ;
cohérence graphique sur toutes les pages.
Objectif UX
Obtenir une interface professionnelle donnant immédiatement confiance à l'utilisateur.
---
Résultat du Sprint 7
À la fin du Sprint 7, Formaplane proposera quatre vues complémentaires :
🏠 Accueil
→ piloter son activité quotidienne.
📅 Planning
→ organiser les missions du mois.
📋 Missions
→ rechercher, filtrer et gérer les missions.
🗺️ Carte
→ visualiser les missions géographiquement.
Le Sprint 7 marquera également une évolution importante de Formaplane :
Le logiciel ne sera plus seulement un outil de gestion des formateurs, mais un véritable outil de planification des organismes de formation.
L'identité visuelle du logiciel a été modernisée afin d'offrir une expérience utilisateur plus cohérente, fluide et professionnelle.
---
Sprint 8 — Gestion des utilisateurs, espace formateur et multi-organismes ✅

Objectif

Faire passer Formaplane d'un outil principalement utilisé par un OF à une plateforme authentifiée dans laquelle :
- un utilisateur possède un compte unique ;
- un utilisateur peut être OF, formateur, ou les deux ;
- un formateur peut collaborer avec plusieurs organismes ;
- les informations communes sont mutualisées sans duplication ;
- les données propres à chaque OF restent confidentielles.

---

Mini Sprint 8.1 — Authentification et compte unique ✅

Réalisations :
- Supabase Auth intégré à l'application ;
- connexion et déconnexion ;
- création de compte ;
- mot de passe oublié ;
- réinitialisation du mot de passe ;
- gestion de session ;
- affichage / masquage du mot de passe ;
- routage selon le contexte utilisateur.

Principe validé :
- un seul compte utilisateur ;
- une ou plusieurs organisations ;
- un profil formateur facultatif.

---

Mini Sprint 8.2 — Propositions de mission et préparation du parcours formateur ✅

Réalisations :
- proposition de mission à un formateur ;
- lien de réponse pour un formateur non encore inscrit ;
- préparation de la consultation et de la réponse côté formateur ;
- compatibilité avec le workflow Sélection → Proposition → Acceptation / Refus → Affectation.

---

Mini Sprint 8.3 — Espace formateur et revendication de profil ✅

Réalisations :
- revendication sécurisée d'une fiche existante ;
- prévention des doublons ;
- choix de l'espace pour les doubles casquettes ;
- espace formateur ;
- tableau de bord ;
- profil formateur ;
- planning ;
- disponibilités ;
- propositions ;
- missions ;
- navigation dédiée ;
- possibilité de passer de l'espace OF à l'espace formateur.

Cas validé :
un utilisateur OF peut également être rattaché à sa propre fiche formateur et utiliser les deux espaces avec le même compte.

---

Mini Sprint 8.4 — Gouvernance des disponibilités et historique ✅

Réalisations :
- modification des disponibilités depuis l'espace formateur ;
- visibilité immédiate des modifications côté OF ;
- modification possible par les organismes autorisés ;
- historique des changements ;
- traçabilité de l'auteur ;
- règles de confidentialité sur l'affichage de l'origine ;
- gestion des notes et de leur propriété.

Règles :
- le formateur voit l'organisme à l'origine d'une modification ;
- l'OF auteur voit « Vous » ;
- un autre OF voit une information neutre de type « Un organisme partenaire ».

---

Mini Sprint 8.5 — Réponses du formateur aux missions ✅

Réalisations :
- consultation des propositions ;
- acceptation ;
- refus ;
- consultation des missions ;
- intégration des réponses dans le workflow existant ;
- affichage des Options et Missions dans l'espace formateur.

---

Mini Sprint 8.6 — Réseau partagé de formateurs ✅

Réalisations :
- création de `organization_trainers` ;
- recherche globale d'un formateur existant ;
- ajout d'un formateur au réseau d'un OF sans duplication ;
- même fiche accessible par plusieurs OF ;
- séparation entre données communes et données propres à chaque OF.

Test validé :
deux OF peuvent accéder à la même fiche formateur sans voir les informations privées de l'autre OF.

---

Mini Sprint 8.7 — Inscription des organismes et multi-organisations ✅

Réalisations :
- création d'un nouvel organisme depuis l'application ;
- rattachement de l'utilisateur à son organisation ;
- adaptation des accès et services au contexte d'organisation ;
- évolution des missions vers le modèle multi-organismes.

---

Mini Sprint 8.8 — Confidentialité des missions externes et conflits globaux ✅

Objectif :
permettre à plusieurs OF de travailler avec le même formateur sans révéler leurs missions respectives.

Réalisations :
- détection globale des engagements du formateur ;
- RPC sécurisée `get_trainer_mission_commitments_safe` ;
- cloisonnement des détails des missions ;
- conservation de la détection des doubles affectations ;
- affichage différencié selon l'OF.

Règle validée :
- l'OF propriétaire voit « Mission » ;
- un OF tiers voit uniquement « Indisponible ».

Un OF tiers ne voit jamais :
- l'organisme ayant affecté le formateur ;
- le client ;
- le lieu ;
- le contenu de la mission.

---

Résultat du Sprint 8

Le Sprint 8 constitue une étape majeure vers le SaaS Formaplane.

La plateforme dispose désormais :
- d'une authentification réelle ;
- d'un compte utilisateur unique ;
- d'un espace organisme ;
- d'un espace formateur ;
- de la double casquette OF + formateur ;
- de profils formateurs revendicables ;
- de disponibilités partagées et historisées ;
- de réponses aux propositions ;
- d'un réseau de formateurs multi-organismes ;
- de l'inscription des organismes ;
- d'une confidentialité inter-organismes testée ;
- d'une détection sécurisée des conflits de missions entre plusieurs OF.

La base multi-organismes prévue initialement pour un sprint ultérieur est donc déjà largement engagée.

---

Sprint 9 — Identité Formaplane, domaine et marque ✅

Objectif

Donner à l'application son identité définitive et préparer son exploitation sous le nom Formaplane.

Réalisations
- choix définitif du nom Formaplane ;
- acquisition de `formaplane.fr` ;
- acquisition de `formaplane.com` ;
- configuration du domaine ;
- création et configuration de `contact@formaplane.fr` dans Google Workspace ;
- tests d'envoi et de réception ;
- configuration de l'expéditeur ;
- dépôt de la marque Formaplane auprès de l'INPI ;
- travail sur l'identité visuelle et le logo.

Résultat

Formaplane dispose de son nom définitif, de ses domaines, de son infrastructure de messagerie et de la base de son identité de marque.

---

Sprint 10 — Préparation à la bêta ✅

Objectif

Stabiliser les éléments structurels, la confidentialité des données et les parcours fondamentaux avant l'arrivée des premiers formateurs et organismes de formation pilotes.

Réalisations

Confidentialité et recherche des formateurs
- sécurisation de la recherche globale des formateurs ;
- suppression des recherches trop permissives ;
- limitation des informations exposées avant rattachement à un OF ;
- renforcement des règles RLS ;
- séparation des données communes et des données privées propres à chaque organisme ;
- localisation privée par OF tant qu'un profil n'est pas revendiqué ;
- après revendication, utilisation de la localisation globale déclarée par le formateur ;
- possibilité pour plusieurs OF de travailler avec un même formateur sans exposer leurs informations privées respectives.

Référentiels compétences et matériel
- création d'un référentiel de compétences ;
- création d'un référentiel de matériel ;
- suggestions lors de la saisie ;
- ajout contrôlé de nouvelles valeurs ;
- normalisation de données historiques ;
- réduction des doublons et variantes de saisie.

Géocodage et localisation
- géocodage automatique des profils ;
- relance du géocodage lors des modifications pertinentes ;
- prise en charge de la localisation privée d'un formateur selon l'OF ;
- création d'une mission possible avec ville + code postal obligatoires et adresse facultative ;
- maintien du calcul de distance lorsque l'adresse précise n'est pas renseignée.

Comptes et profils
- amélioration de la gestion des informations de compte ;
- sécurisation de la suppression de compte ;
- protection des données métier appartenant aux organismes ;
- amélioration de l'affichage du contexte utilisateur et de l'organisation ;
- harmonisation des espaces OF et Formateur.

Workflow propositions, options et affectations
- stabilisation du cycle Proposition → Acceptation → Option → Affectation ;
- gestion de plusieurs options concurrentes sur une même date ;
- information du formateur lorsqu'il possède déjà une ou plusieurs options ;
- clôture automatique des autres acceptations lorsqu'un formateur est affecté ;
- statut « Mission pourvue ailleurs » et conservation dans l'historique ;
- affectation atomique afin d'éviter les états intermédiaires incohérents ;
- désistement d'une option avec commentaire ;
- désaffectation par l'OF avec confirmation et rappel de prévenir directement le formateur ;
- accès direct aux missions depuis les disponibilités et le planning du formateur.

Modification d'une mission et revalidation
- identification des modifications de conditions essentielles ;
- application immédiate des nouvelles conditions à la mission ;
- passage du formateur en « Revalidation en attente » lorsqu'il avait accepté ou était affecté ;
- blocage de l'affectation tant que la revalidation n'est pas obtenue ;
- affichage clair des anciennes et nouvelles conditions ;
- acceptation ou refus des nouvelles conditions par le formateur ;
- restauration de l'affectation après acceptation lorsque le formateur était déjà affecté ;
- retour de la mission en « À affecter » en cas de refus ;
- signalement de la revalidation dans Mes missions et Mes propositions → À répondre.

Historique et traçabilité
- historique détaillé des propositions et actions ;
- organisation de Mes propositions autour de « À répondre » et « Historique » ;
- filtres par date et statut ;
- conservation des propositions refusées, désistées, pourvues ailleurs ou clôturées ;
- rattachement des commentaires aux événements correspondants ;
- traçabilité des revalidations et des clôtures automatiques.

Planning OF
- simplification de la synthèse mensuelle autour de trois indicateurs : Missions ce mois, Affectées, À affecter ;
- harmonisation de la légende avec cette logique ;
- retrait des missions annulées du planning ;
- prise en compte des revalidations : une mission en attente de revalidation n'est pas considérée comme affectée.

Statuts des missions
- suppression du statut historique « Brouillon » du parcours normal ;
- création directe des nouvelles missions en « À pourvoir » ;
- migration des anciennes missions encore en brouillon ;
- stabilisation des statuts utilisés dans les workflows OF et Formateur.

Infrastructure et robustesse
- documentation d'une procédure de diagnostic rapide pour les problèmes de port GitHub Codespaces ;
- adaptation de Vite aux URLs de forwarding Codespaces ;
- poursuite du durcissement des accès Supabase ;
- recette fonctionnelle complète des principaux workflows avant clôture.

Validation

Les scénarios suivants ont notamment été testés de bout en bout :
- création d'une mission et affectation simple ;
- plusieurs formateurs acceptant la même mission ;
- options concurrentes ;
- mission pourvue ailleurs ;
- désistement du formateur ;
- désaffectation par l'OF ;
- modification d'une mission acceptée ou affectée ;
- acceptation et refus des nouvelles conditions ;
- historique et commentaires ;
- planning et disponibilités côté formateur ;
- planning et synthèse côté OF.

Résultat

Le Sprint 10 stabilise le cœur opérationnel de Formaplane avant bêta. Les règles de confidentialité, les référentiels, la gestion des comptes et surtout le cycle de vie des missions sont désormais suffisamment structurés pour passer à la couche de communication transactionnelle.

Version de clôture : `v0.10.0`.

---

Sprint 11 — Brevo et emails transactionnels

Objectif

Donner à Formaplane un véritable système de communication externe automatisé.

Infrastructure
- intégration de Brevo ;
- configuration de l'expéditeur Formaplane ;
- authentification du domaine ;
- architecture centralisée d'envoi ;
- gestion des modèles d'emails ;
- journalisation des envois ;
- gestion des erreurs.

Emails à intégrer progressivement
- invitation d'un formateur ;
- proposition de mission ;
- confirmation de réponse ;
- affectation ;
- annulation ;
- modification importante d'une mission ;
- autres emails transactionnels utiles au parcours utilisateur.

Principe

Les emails métier doivent être générés par Formaplane et ne pas dépendre d'une action manuelle de l'organisme.

---

Sprint 12 — Notifications et relances

Objectif

Faire de Formaplane un outil proactif capable d'attirer l'attention de l'utilisateur sur les actions importantes.

Notifications
- nouvelle proposition ;
- acceptation ;
- refus ;
- affectation ;
- modification importante ;
- annulation ;
- conflit lorsque pertinent ;
- évolution de disponibilité lorsque pertinent.

Relances
- relances automatiques des propositions sans réponse ;
- suivi des réponses ;
- arrêt des relances lorsqu'une réponse rend la relance inutile.

Mission pourvue
Lorsqu'une mission est pourvue :
- arrêt des relances ;
- mise à jour des propositions concernées ;
- information des utilisateurs lorsque nécessaire.

Préparation future
- SMS ;
- notifications Push ;
- préférences individuelles de notification.

---

Jalon — Début de la bêta Formaplane

Après stabilisation des Sprints 10 à 12, Formaplane pourra commencer à accueillir progressivement :
- les premiers formateurs pilotes ;
- quelques organismes de formation pilotes.

Le lancement de la bêta ne signifie pas que Formaplane est terminé.

Il permet au contraire de commencer à orienter les évolutions suivantes à partir de comportements et de retours utilisateurs réels.

---

Sprint 13 — Partage des disponibilités

Objectif

Permettre au formateur d'utiliser Formaplane pour communiquer activement ses disponibilités à ses organismes partenaires.

Fonction principale

Ajouter un bouton :
> Partager mes disponibilités

Contacts
Le formateur peut :
- sélectionner ses OF partenaires déjà présents sur Formaplane ;
- ajouter un contact externe ;
- enregistrer son prénom, son nom, son organisme et son adresse e-mail ;
- retrouver automatiquement les contacts enregistrés lors du prochain partage ;
- cocher ou décocher les destinataires avant chaque envoi.

Partage
- génération d'un email permettant au destinataire de consulter les disponibilités pertinentes du formateur ;
- exploitation de Brevo et de l'infrastructure créée lors des Sprints 11 et 12.

OF utilisant déjà Formaplane
Lorsque le destinataire utilise Formaplane :
- enrichir progressivement le partage avec les informations pertinentes de la relation OF / formateur ;
- permettre à terme de rapprocher les disponibilités communiquées des missions à pourvoir de l'OF.

Vision

Cette fonctionnalité doit également pouvoir devenir un levier naturel d'acquisition de nouveaux organismes de formation.

---

Sprint 14 — Expérience utilisateur et productivité

Objectif

Améliorer Formaplane à partir des premiers retours des utilisateurs pilotes.

Planning formateur
- faire évoluer le planning vers une expérience proche des standards d'un agenda moderne ;
- envisager une vue mois ;
- envisager une vue semaine ;
- afficher clairement Disponible, Indisponible, Option et Mission ;
- faciliter la saisie et la modification des disponibilités.

Missions OF avancées
- affichage en liste ;
- affichage en cartes ;
- choix de la vue ;
- filtres avancés ;
- tris ;
- recherche ;
- archivage ;
- actions rapides.

Recherche globale
Ajouter une barre de recherche globale permettant de retrouver rapidement, selon les droits de l'utilisateur :
- formateurs ;
- missions ;
- clients lorsque pertinent ;
- autres éléments principaux de l'application.

Polish issu de la bêta
- ergonomie ;
- navigation ;
- responsive ;
- formulaires ;
- messages d'erreur ;
- terminologie ;
- simplification des actions ;
- performances.

Principe

Une partie de ce sprint est volontairement laissée ouverte afin que les vrais retours utilisateurs déterminent les améliorations prioritaires.

---

Sprint 15 — Réseau et collaboration

Objectif

Transformer progressivement Formaplane en réseau professionnel entre organismes de formation et formateurs.

Une partie de l'architecture nécessaire existe déjà grâce au Sprint 8.

Fonctionnalités envisagées
- invitations ;
- demandes de collaboration ;
- gestion enrichie des relations OF / formateurs ;
- historique des collaborations ;
- profils visibles selon les autorisations ;
- demandes de mise en relation ;
- enrichissement du réseau propre à chaque OF.

Principe de confidentialité

Formaplane n'est pas un annuaire public de formateurs.

La visibilité d'un profil et de ses informations dépend :
- de la relation existante ;
- des autorisations ;
- du contexte de recherche ;
- des règles de confidentialité de la plateforme.

---

Sprint 16 — Administration SaaS et organisations avancées

Objectif

Finaliser les fonctions nécessaires à l'exploitation de Formaplane comme véritable SaaS multi-organismes.

Une partie importante du modèle multi-organismes ayant déjà été développée au Sprint 8, ce sprint se concentre sur l'administration avancée.

Gestion des utilisateurs d'un OF
- invitation de collaborateurs ;
- gestion des accès ;
- retrait d'un utilisateur d'une organisation.

Rôles
- administrateur ;
- dirigeant ;
- coordinateur ;
- assistant ;
- autres rôles pertinents selon les besoins constatés.

Sécurité
- finalisation et audit des RLS ;
- contrôle fin des accès ;
- journalisation ;
- audit des règles de confidentialité.

Administration Formaplane
- gestion des organisations ;
- gestion des comptes ;
- support ;
- licences ;
- abonnements ;
- suivi de consommation ;
- administration globale.

---

Sprint 17 — Pilotage et statistiques

Objectif

Donner aux dirigeants et coordinateurs une vision complète de leur activité.

Indicateurs envisagés
- nombre de missions ;
- missions affectées ;
- missions non pourvues ;
- délai moyen d'affectation ;
- taux d'acceptation ;
- taux de refus ;
- nombre de propositions par mission ;
- chiffre d'affaires ;
- coût formateur ;
- marge par mission ;
- marge par client ;
- marge par formateur ;
- kilomètres ;
- répartition géographique ;
- taux de remplissage.

Exports
- Excel ;
- CSV ;
- PDF ;
- rapports mensuels ;
- rapports clients ;
- rapports formateurs.

---

Idées futures

Messagerie
- Envoyer et recevoir des messages entre OF et formateurs via Formaplane

Documents
- convention ;
- convocation ;
- ordre de mission ;
- feuille de présence ;
- attestation ;
- certificat ;
- signature électronique ;
- archivage.

Synchronisation calendrier
- Google Calendar ;
- Outlook ;
- export calendrier ;
- synchronisation des missions ;
- synchronisation éventuelle des indisponibilités.

Mobilité
- optimisation mobile ;
- application mobile si le besoin est confirmé ;
- notifications Push ;
- réponse rapide ;
- ajout de disponibilités depuis un téléphone.

SMS
- propositions urgentes ;
- relances ;
- notifications importantes ;
- préférences utilisateurs.

Automatisations avancées
- import de missions ;
- duplication en série ;
- missions récurrentes ;
- affectation automatique selon des règles ;
- génération automatique de documents.

Intelligence artificielle
- recommandation automatique du meilleur formateur ;
- détection des missions à risque ;
- prévision des disponibilités ;
- suggestions de relance ;
- détection d'anomalies ;
- optimisation des tournées ;
- assistant de planification ;
- estimation du coût d'une mission.

---

Méthode de clôture d'un sprint

Un sprint n'est considéré comme terminé que lorsque :
- le développement est réalisé ;
- les tests sont validés ;
- les données Supabase sont vérifiées ;
- la documentation est mise à jour ;
- la roadmap est synchronisée ;
- le CHANGELOG est mis à jour ;
- le code est poussé sur GitHub ;
- Vercel est déployé ;
- la version en ligne est testée ;
- un ZIP complet du projet est créé.

---

Priorité actuelle

La prochaine étape est :

```text
Sprint 11 — Brevo et emails transactionnels
```

Le cœur métier ayant été stabilisé pendant le Sprint 10, la priorité devient la mise en place d'une infrastructure d'emails transactionnels fiable : configuration de Brevo, authentification du domaine, modèles, journalisation et premiers emails liés aux parcours de mission et d'inscription.

Le Sprint 12 restera consacré aux notifications et relances automatiques avant l'ouverture progressive de la bêta Formaplane.
