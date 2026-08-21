# ROADMAP — Formaplane

> Mise à jour : après clôture officielle du Sprint 14 — 21 août 2026  
> Version actuelle : `v0.14.0`

## Vision

Formaplane est une plateforme de gestion des relations entre organismes de formation et formateurs indépendants.

Le produit permet aujourd'hui de gérer le réseau de formateurs, les disponibilités, les missions, les propositions, les affectations, les principaux événements du cycle de vie d'une mission, les communications transactionnelles et le partage des disponibilités.

Après le Sprint 14, la priorité est désormais de rendre Formaplane plus autonome pour ses utilisateurs, préparer sa vitrine publique, puis mieux piloter et sécuriser la bêta.

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
| 13 | Sécurisation du partage des disponibilités | ✅ TERMINÉ |
| 14 | Harmonisation des e-mails côté OF | ✅ TERMINÉ |
| 15 | Découvrir Formaplane — Tutos, FAQ & contact | 🔜 À FAIRE |
| 16 | Landing page / site public Formaplane | 🔜 À FAIRE |
| 17 | Dashboard Admin, mini-CRM & statistiques d'utilisation | 🔜 À FAIRE |
| 18 | Tests automatisés & surveillance | 🔜 À FAIRE |
| 19+ | Évolutions guidées par la bêta | 🧭 PRÉVISIONNEL |

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
`v0.12.0` — release GitHub publiée et production validée.

---

# Prochains sprints

## Sprint 13 — Sécurisation du partage des disponibilités ✅

### Objectif
Prolonger immédiatement le Sprint 12 en sécurisant le partage des disponibilités par e-mail afin d'éviter qu'un même contact OF soit sollicité trop fréquemment par le même formateur.

### Périmètre validé

#### Règle anti-spam
- délai minimal de **20 jours complets** entre deux partages par e-mail d'un même formateur vers un même contact OF ;
- contrôle par couple **formateur + contact OF** ;
- exemple : envoi le 20 août à 14 h → nouvel envoi possible le 9 septembre à 14 h ;
- contrôle fiable côté serveur / base à partir de l'historique des partages ;
- le blocage ne doit pas dépendre uniquement de l'interface ;
- impossibilité de contourner la règle par un appel direct au service d'envoi.

#### Information du formateur
Pendant le délai :
- désactiver clairement l'envoi vers le contact concerné ;
- expliquer la raison du blocage ;
- afficher la date et l'heure exactes du prochain envoi possible ;
- proposer au formateur de contacter directement l'OF s'il souhaite l'informer plus tôt ;
- rappeler que ses disponibilités restent actualisées dans Formaplane.

#### OF déjà inscrit
- rappeler qu'un OF ayant accès au formateur peut consulter directement sa fiche et ses disponibilités actualisées dans Formaplane ;
- éviter les e-mails inutiles lorsque la consultation directe est possible.

#### OF non inscrit
- encourager le formateur à présenter Formaplane à son contact ;
- rappeler que l'inscription permettra ensuite à l'OF de consulter plus facilement les informations et disponibilités du formateur.

#### Copie facultative au formateur
- proposer avant l’envoi une case **« Recevoir une copie de cet e-mail »** ;
- case décochée par défaut ;
- envoyer la copie à l’adresse e-mail du compte Formaplane du formateur ;
- la copie fait partie du même partage et ne déclenche pas un nouveau délai anti-spam ;
- conserver la traçabilité de l’utilisation de cette option dans l’historique lorsque pertinent.

#### PDF professionnel des disponibilités
- permettre au formateur de générer et télécharger ses disponibilités au format PDF ;
- produire un document travaillé selon l’identité visuelle et marketing de Formaplane, et pas un simple export brut du calendrier ;
- permettre de choisir la période / les mois à présenter ;
- présenter clairement les disponibilités utiles sans révéler d’informations confidentielles sur les OF ;
- intégrer la marque Formaplane et, lorsque pertinent, un lien ou QR code permettant de découvrir ou consulter Formaplane ;
- permettre au formateur d’envoyer ensuite librement ce PDF depuis sa propre adresse e-mail à ses contacts ;
- présenter ce téléchargement comme une alternative naturelle lorsqu’un nouvel envoi automatisé Formaplane est temporairement bloqué.

### Enjeu produit
Protéger les contacts OF contre les sollicitations répétitives et préserver l'image de Formaplane, tout en laissant au formateur des moyens professionnels et maîtrisés de communiquer ses disponibilités.

---

## Sprint 14 — Harmonisation des e-mails côté OF ✅

### Objectif atteint
Uniformiser les e-mails déclenchés depuis l’espace OF et permettre à l’utilisateur OF de recevoir, lorsqu’il le souhaite, une copie sécurisée des messages envoyés par Formaplane.

### Livré

#### Copie facultative des e-mails OF
- ajout d’une option commune **« Recevoir une copie de cet e-mail »** ;
- case décochée par défaut ;
- adresse de copie déterminée côté serveur à partir du compte Formaplane authentifié ;
- aucun choix libre de l’adresse de copie depuis le navigateur ;
- composant et comportement harmonisés dans les différents parcours OF.

#### Parcours couverts
- invitation individuelle d’un formateur ;
- invitations issues de l’import en masse ;
- proposition de mission ;
- relance de proposition ;
- affectation ;
- désaffectation ;
- modification importante avec revalidation ;
- annulation de mission.

#### Copie sécurisée
- abandon du simple CC identique au message du formateur ;
- envoi d’un e-mail de copie distinct à l’utilisateur OF ;
- préfixe d’objet permettant d’identifier clairement la copie ;
- bandeau indiquant qu’il s’agit d’une copie sécurisée ;
- neutralisation des liens et boutons d’action destinés au formateur ;
- conservation du message principal comme seul événement métier journalisé ;
- traçabilité de l’utilisation de l’option de copie dans les métadonnées.

#### Harmonisation UX
- fenêtres d’envoi alignées sur le modèle de proposition de mission ;
- bloc **« Envoyer maintenant avec Formaplane »** clairement identifié ;
- option e-mail présélectionnée ;
- case de copie placée immédiatement sous l’option e-mail ;
- autres moyens de contact regroupés ensuite : SMS, WhatsApp, téléphone et autre ;
- formulation adaptée aux envois multiples : une copie de chaque e-mail envoyé.

#### Correctifs associés validés
- correction du délai de réinvitation depuis le listing : les invitations `sent` et `delivered` sont reconnues comme récentes ;
- maintien volontaire de la possibilité de réinviter depuis la fiche formateur ;
- correction de l’état des missions lorsqu’un formateur est déjà affecté et a revalidé, même si d’autres formateurs ont encore une revalidation en attente ;
- cohérence du statut corrigée dans le listing Missions et dans le Planning.

### Recette Sprint 14 ✅
Validés :
- copie décochée : aucun e-mail reçu par l’utilisateur OF ;
- copie cochée : réception correcte de la copie ;
- copie sécurisée sans action possible à la place du formateur ;
- invitation formateur ;
- proposition et relance ;
- affectation ;
- désaffectation ;
- revalidation après modification importante ;
- annulation ;
- cas mono-destinataire et multi-destinataires ;
- harmonisation visuelle des fenêtres ;
- délai de réinvitation depuis le listing ;
- statut d’affectation après revalidation ;
- build de production réussi ;
- Edge Function `send-transactional-email` redéployée et testée en conditions réelles.

### Version
`v0.14.0`

### Enjeu produit
Rassurer les utilisateurs OF sur les communications envoyées en leur nom, empêcher qu’une copie puisse être utilisée pour agir à la place d’un formateur et garantir un comportement homogène de Formaplane sur l’ensemble des e-mails sortants.

---

## Sprint 15 — Découvrir Formaplane — Tutos, FAQ & contact 🔜

### Objectif
Créer dans Formaplane un espace permettant aux utilisateurs de comprendre le produit, apprendre à l'utiliser et contacter facilement Formaplane.

Ce sprint doit également produire une base éditoriale et visuelle réutilisable pour la future landing page.

### Accès « Découvrir Formaplane »
- ajouter une entrée clairement identifiable dans la navigation ;
- adapter le contenu au contexte OF / formateur lorsque pertinent ;
- conserver une intégration cohérente avec l'identité visuelle de Formaplane.

### Tutos et explications
- présenter les principales fonctionnalités ;
- expliquer les parcours importants ;
- ajouter des explications contextuelles sur les actions qui le nécessitent ;
- expliquer les conséquences des actions sensibles avant validation ;
- utiliser des captures ou illustrations lorsqu'elles améliorent la compréhension ;
- structurer les contenus pour qu'ils puissent être réutilisés sur le site public.

### FAQ
- créer une FAQ claire et évolutive ;
- couvrir les questions OF et formateur ;
- expliquer notamment réseau, disponibilités, options, missions, communications et confidentialité.

### Transparence produit
- afficher la version actuellement déployée ;
- présenter simplement les fonctionnalités disponibles ;
- proposer une roadmap publique simplifiée : existant, fonctionnalités envisagées et grandes orientations.

### Contact Formaplane
- intégrer un bouton de contact ;
- proposer un formulaire simple et contextualisé ;
- réutiliser automatiquement les informations utilisateur disponibles lorsque pertinent ;
- conserver la demande pour permettre son suivi.

### Première brique du mini-CRM Admin
Créer le socle de suivi des demandes :
- demandeur ;
- organisme ou profil concerné lorsque disponible ;
- coordonnées utiles ;
- objet / catégorie ;
- message ;
- date ;
- statut de suivi ;
- notes internes si nécessaire.

Cette brique sera intégrée et enrichie dans le Dashboard Admin du Sprint 17.

### Enjeu produit
Rendre Formaplane plus autonome, réduire l'accompagnement individuel et préparer les contenus de la présentation publique.

---

## Sprint 16 — Landing page / site public Formaplane 🔜

### Objectif
Créer la vitrine publique de Formaplane à partir d'un produit et d'un discours désormais stabilisés.

### Principe
Le Sprint 15 explique Formaplane à quelqu'un qui l'utilise déjà. Le Sprint 15 doit expliquer Formaplane à quelqu'un qui ne connaît pas encore la plateforme.

Les contenus, formulations, captures et éléments pédagogiques produits au Sprint 15 seront réutilisés autant que possible.

### Périmètre cible
- page d'accueil publique ;
- proposition de valeur ;
- bénéfices distincts pour OF et formateurs ;
- présentation des principales fonctionnalités ;
- captures de la version la plus récente de l'application ;
- explication du fonctionnement général ;
- éléments de confiance et de transparence ;
- appels à l'inscription / connexion ;
- FAQ publique adaptée ;
- formulaire de contact ;
- raccordement au même socle mini-CRM que le Sprint 15 ;
- responsive mobile / desktop ;
- bases SEO ;
- intégration cohérente avec `formaplane.fr` et l'identité visuelle.

### Enjeu produit
Donner à Formaplane une présence publique crédible et transformer les visites issues des invitations, partages et recommandations en découverte réelle du produit.

---

## Sprint 17 — Dashboard Admin, mini-CRM & statistiques d'utilisation 🔜

### Objectif
Créer un espace d'administration réservé à Formaplane pour suivre les demandes entrantes et comprendre l'utilisation réelle du produit.

### Mini-CRM
- intégrer le socle du Sprint 15 ;
- centraliser les demandes provenant de l'application et du site public ;
- statuts de traitement ;
- recherche et filtres ;
- notes internes ;
- historique utile ;
- accès au compte / OF concerné lorsqu'il existe.

### Statistiques d'utilisation
Indicateurs envisagés :
- utilisateurs inscrits ;
- organismes ;
- formateurs ;
- évolution des inscriptions ;
- utilisateurs actifs ;
- missions ;
- propositions et réponses ;
- options ;
- affectations ;
- communications ;
- partages de disponibilités ;
- utilisation de « Découvrir Formaplane » ;
- demandes de contact ;
- adoption des principales fonctionnalités ;
- parcours peu ou pas utilisés.

### Distinction importante
Ce dashboard est un outil interne d'administration de Formaplane, distinct de futures statistiques métier destinées aux OF.

### Enjeu produit
Observer les usages, les demandes et les points de friction pour piloter la bêta sur des données réelles.

---

## Sprint 18 — Tests automatisés & surveillance 🔜

### Objectif
Renforcer la sécurité technique des parcours critiques avant une diffusion plus large.

### Périmètre cible
- tests automatisés des workflows métier critiques ;
- tests des parcours OF et formateur ;
- tests des réponses publiques sans compte ;
- contrôles RPC, RLS et Edge Functions ;
- tests des communications transactionnelles ;
- tests de la règle anti-spam et des autres garde-fous ;
- surveillance des erreurs frontend et backend ;
- surveillance des traitements sensibles ;
- alertes exploitables en cas de dysfonctionnement important.

### Enjeu produit
Détecter les régressions et incidents avant les utilisateurs.

---

# Jalon après le Sprint 18

À la fin du Sprint 18, Formaplane doit disposer :
- d'un cœur métier complet et éprouvé ;
- d'un partage des disponibilités protégé contre les sollicitations excessives ;
- d'une aide utilisateur intégrée ;
- d'un canal de contact relié à un mini-CRM ;
- d'une vraie vitrine publique ;
- d'outils internes pour observer la bêta ;
- d'une couverture automatisée des parcours critiques ;
- d'une surveillance technique exploitable.

À partir de ce jalon, l'ordre des développements sera principalement influencé par les usages et retours réels de la bêta.

---

# Sprints 19+ — Prévisionnels

Ordre volontairement non figé :
- améliorations UX et productivité ;
- gestion avancée des utilisateurs d'un OF ;
- rôles et permissions plus fins ;
- notifications et centre d'activité ;
- statistiques métier destinées aux OF ;
- documents et pièces liées aux missions ;
- intégrations calendrier ;
- communications SMS ;
- notifications Push ;
- automatisations et relances avancées ;
- fonctionnalités assistées par IA ;
- réseau et collaboration entre utilisateurs ;
- autres besoins révélés par la bêta.

## Règle de priorisation

**Retours utilisateurs + fréquence du besoin + valeur métier + risque technique.**

Les Sprints 13 à 18 constituent le prochain bloc stratégique. À partir du Sprint 19, la roadmap reste volontairement souple.

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
v0.13.0 — Sprint 13 officiellement clôturé
↓
Sprint 14 — Harmonisation des e-mails côté OF
↓
Sprint 15 — Découvrir Formaplane — Tutos, FAQ & contact
↓
Sprint 16 — Landing page / site public Formaplane
↓
Sprint 17 — Dashboard Admin, mini-CRM & statistiques d'utilisation
↓
Sprint 18 — Tests automatisés & surveillance
```
