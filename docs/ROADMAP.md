ROADMAP - TimeForma
Version : 5.2  
Dernière mise à jour : 05/08/2026  
Correspond au Sprint 7 terminé.
---
Vision
TimeForma a pour ambition de devenir la plateforme de référence permettant aux organismes de formation de :
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
Une première version opérationnelle de TimeForma permet de centraliser les informations des formateurs dans une seule interface.
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
Supabase devient le backend officiel de TimeForma. Le projet dispose désormais d'une base technique stable et déployée.
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
TimeForma permet de rechercher et classer les formateurs selon leur proximité avec un futur lieu de mission.
---
Sprint 6 — Moteur de missions ✅
Objectif
Faire de la mission le cœur opérationnel de TimeForma.
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
TimeForma dispose désormais d'un véritable moteur de missions capable de :
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
Faire de la mission le véritable centre de TimeForma.
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
Mettre en place la nouvelle organisation de TimeForma.
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
L'architecture générale de TimeForma est désormais en place.
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
À la fin du Sprint 7, TimeForma proposera quatre vues complémentaires :
🏠 Accueil
→ piloter son activité quotidienne.
📅 Planning
→ organiser les missions du mois.
📋 Missions
→ rechercher, filtrer et gérer les missions.
🗺️ Carte
→ visualiser les missions géographiquement.
Le Sprint 7 marquera également une évolution importante de TimeForma :
Le logiciel ne sera plus seulement un outil de gestion des formateurs, mais un véritable outil de planification des organismes de formation.
L'identité visuelle du logiciel a été modernisée afin d'offrir une expérience utilisateur plus cohérente, fluide et professionnelle.
---
Sprint 8 — Gestion des utilisateurs et des rôles

Objectif

Mettre en place un modèle de compte unique : un utilisateur possède une seule adresse e-mail mais peut cumuler plusieurs rôles.

Principe :
- un compte Utilisateur ;
- une ou plusieurs Organisations ;
- un Profil Formateur facultatif.

Un même utilisateur peut être simultanément OF et Formateur.

---

Mini Sprint 8.1 — Modèle utilisateur unique

Création du compte Utilisateur et des relations :
- Utilisateur ↔ Organisation(s)
- Utilisateur ↔ Profil Formateur

---

Mini Sprint 8.2 — Interface Formateur

Création de l'espace Formateur :
- tableau de bord ;
- missions ;
- planning ;
- disponibilités ;
- profil ;
- compétences ;
- matériel ;
- préférences.

---

Mini Sprint 8.3 — Création de compte et revendication

- création d'un nouveau compte ;
- revendication sécurisée d'une fiche existante ;
- aucune duplication.

---

Mini Sprint 8.4 — Authentification

Connexion, déconnexion, récupération du mot de passe, gestion de session.

---

Mini Sprint 8.5 — Gouvernance des disponibilités

Les disponibilités appartiennent au formateur.

Elles peuvent être mises à jour par le formateur ou par un organisme.

Règles :
- dernière modification prioritaire ;
- historique conservé ;
- le formateur voit le nom de l'OF ;
- un OF voit « Vous » pour ses propres actions ;
- les autres voient « Un organisme partenaire ».

---

Mini Sprint 8.6 — Réponse aux missions

Consultation, acceptation, refus, commentaires, suivi des Options et Missions.

Résultat attendu

Un modèle d'utilisateur unique permet de gérer naturellement les doubles casquettes (OF + Formateur).

---

Sprint 9 — Notifications, relances et automatisations

Objectif

Automatiser les échanges et les relances autour des propositions de missions.

- notifications (email, SMS, notifications) ;
- relances automatiques ;
- suivi des réponses ;
- arrêt automatique des propositions lorsqu'une mission est pourvue.

---
Sprint 10 — Réseau et collaboration
Objectif
Développer la dimension collaborative de TimeForma.
---
Réseau de formateurs
invitations ;
demandes de collaboration ;
formateurs référencés ;
formateurs non référencés ;
annuaire partagé ;
historique des collaborations.
---
Référencement
statut du formateur dans chaque OF ;
fiche commune ;
données propres à chaque OF ;
notes internes isolées ;
compétences partagées ou validées.
---
Recherche étendue
recherche dans son propre réseau ;
recherche dans le réseau TimeForma ;
profils visibles selon les autorisations ;
demandes de mise en relation.
---
Sprint 11 — SaaS multi-organismes
Objectif
Ouvrir TimeForma à plusieurs organismes avec une séparation stricte des données.
---
Organisations
création d'un organisme ;
gestion des utilisateurs ;
rattachement à une organisation ;
paramètres propres à l'OF.
---
Rôles
administrateur ;
dirigeant ;
coordinateur ;
assistant ;
formateur.
---
Sécurité
isolation des données ;
RLS par organisme ;
contrôle des accès ;
journalisation ;
confidentialité des missions ;
confidentialité des clients ;
confidentialité des notes internes.
---
Administration
gestion des abonnements ;
gestion des licences ;
paramétrage ;
support ;
suivi de consommation.
---
Sprint 12 — Pilotage et statistiques
Objectif
Donner aux dirigeants une vision complète de leur activité.
---
Indicateurs
nombre de missions ;
missions affectées ;
missions non pourvues ;
délai moyen d'affectation ;
taux d'acceptation ;
taux de refus ;
nombre de propositions par mission ;
chiffre d'affaires ;
coût formateur ;
marge par mission ;
marge par client ;
marge par formateur ;
kilomètres ;
répartition géographique ;
taux de remplissage.
---
Exports
Excel ;
CSV ;
PDF ;
rapports mensuels ;
rapports clients ;
rapports formateurs.
---
Idées futures
Évolutions UI envisagées
Tableau de bord intelligent (ancien mini Sprint 7.3).
Vue Carte avancée des missions (ancien mini Sprint 7.4).
Ces améliorations seront réalisées ultérieurement afin de perfectionner la plateforme, sans bloquer les évolutions métier prioritaires.
Intelligence artificielle
recommandation automatique du meilleur formateur ;
détection des missions à risque ;
prévision des disponibilités ;
suggestions de relance ;
détection d'anomalies ;
optimisation des tournées ;
assistant de planification ;
estimation du coût d'une mission.
---
Mobilité
application mobile ;
notifications Push ;
réponse rapide ;
consultation hors bureau ;
ajout de disponibilités depuis un téléphone.
---
Documents
convention ;
convocation ;
ordre de mission ;
feuille de présence ;
attestation ;
certificat ;
signature électronique ;
archivage.
---
Automatisation
import de missions ;
duplication en série ;
missions récurrentes ;
relances automatiques ;
affectation automatique selon des règles ;
synchronisation agenda ;
génération de documents.
---
Méthode de clôture d'un sprint
Un sprint n'est considéré comme terminé que lorsque :
le développement est réalisé ;
les tests sont validés ;
les données Supabase sont vérifiées ;
la documentation est mise à jour ;
la roadmap est synchronisée ;
le CHANGELOG est mis à jour ;
le code est poussé sur GitHub ;
Vercel est déployé ;
la version en ligne est testée ;
un ZIP complet du projet est créé.
---
Priorité actuelle
La prochaine étape est :
```text
Sprint 8 — Gestion des utilisateurs et des rôles
```
Le moteur de missions étant désormais opérationnel, TimeForma doit devenir un outil de pilotage quotidien capable d'indiquer immédiatement au coordinateur les actions à effectuer.