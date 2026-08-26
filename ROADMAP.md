# ROADMAP — Formaplane

> Mise à jour : clôture officielle du Sprint 19 — 26 août 2026  
> Version actuelle : `v0.19.0`

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
| 15 | Découvrir Formaplane — Tutos, FAQ & contact | ✅ TERMINÉ |
| 16 | Landing page / site public Formaplane | ✅ TERMINÉ |
| 17 | Dashboard Admin, mini-CRM & statistiques d'utilisation | ✅ TERMINÉ |
| 18 | Tests automatisés & surveillance | ✅ TERMINÉ |
| 19 | Optimisation UX & expérience mobile | ✅ TERMINÉ |
| 20 | Création de missions par le formateur dans son propre agenda | 🔜 À FAIRE |
| 21 | Formaplane installable sur mobile (PWA) | 🔜 À FAIRE |
| 22 | Synchronisation des missions avec Google Agenda | 🔜 À FAIRE |
| 23+ | Évolutions guidées par la bêta | 🧭 PRÉVISIONNEL |

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

## Sprint 15 — Découvrir Formaplane — Tutos, FAQ & contact ✅

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

### Réalisé
- ajout de l’entrée « Découvrir Formaplane » dans les espaces OF et Formateur ;
- contenus pédagogiques adaptés au profil utilisateur ;
- guides pas à pas et FAQ contextualisée avec recherche ;
- présentation claire des bénéfices : planning partagé en temps réel, recherche de formateurs, propositions de mission, suivi des réponses et affectations ;
- clarification de la confidentialité du réseau propre à chaque OF et du partage maîtrisé des informations formateur ;
- transparence produit avec version affichée et évolutions futures utiles aux utilisateurs ;
- ajout d’un accès direct « Nous contacter » dans les deux menus ;
- formulaire de contact intégré avec enregistrement Supabase ;
- notification automatique vers `contact@formaplane.fr` ;
- stockage structuré des demandes, catégories, profil utilisateur et champs de pilotage futurs ;
- préparation du socle mini-CRM destiné au Sprint 17 ;
- recette OF / Formateur validée ;
- build de production réussi ;
- lint validé avec 0 erreur et 2 warnings React Hooks connus.

### Version
`v0.15.0`

### Enjeu produit
Rendre Formaplane plus autonome, réduire l'accompagnement individuel et préparer les contenus de la présentation publique.

---

## Sprint 16 — Landing page / site public Formaplane ✅

### Objectif atteint
Créer une vitrine publique crédible de Formaplane à partir du produit, des contenus pédagogiques et du discours stabilisés au Sprint 15.

### Réalisé

#### Landing page publique
- création d'une page d'accueil publique dédiée à Formaplane ;
- proposition de valeur centrée sur la collaboration entre organismes de formation et formateurs indépendants ;
- parcours de lecture distincts pour les OF et les formateurs ;
- navigation interne depuis le hero vers les sections correspondant au profil choisi ;
- appels à la connexion et à l'inscription positionnés aux étapes pertinentes ;
- explication du fonctionnement général de Formaplane sans transformer la landing page en documentation technique.

#### Présentation du produit
- mise en avant des disponibilités partagées, de la recherche ciblée, du réseau privé, des propositions de mission, du planning synchronisé et du profil professionnel ;
- intégration de captures réelles et validées de l'application ;
- intégration de schémas pédagogiques dédiés à la synchronisation OF / formateur, au réseau privé et à la recherche d'un formateur ;
- présentation du parcours côté formateur : propositions reçues et planning centralisé ;
- présentation du suivi d'une mission côté OF jusqu'à l'affectation ;
- explication claire de la confidentialité des réseaux OF.

#### Création de compte et double profil
- correction des parcours de création de compte depuis la landing page ;
- ajout d'un sélecteur OF / Formateur depuis le bouton « Créer un compte » ;
- explication du fonctionnement « double casquette » ;
- utilisation de la même adresse e-mail comme lien entre les profils OF et Formateur d'un même utilisateur.

#### FAQ et contact public
- réutilisation d'une sélection de la FAQ du Sprint 15 adaptée à un visiteur public ;
- création d'un vrai formulaire de contact public : prénom, nom, e-mail, profil et message ;
- validation des données côté navigateur et côté serveur ;
- ajout de garde-fous anti-spam dédiés au formulaire public ;
- création d'une Edge Function `submit-public-contact` ;
- enregistrement des demandes publiques dans le même socle `support_requests` que les demandes provenant de l'application ;
- distinction explicite des origines `public` et `app` ;
- notification Brevo vers `contact@formaplane.fr` avec réponse possible directement au demandeur ;
- journalisation de la notification dans `email_logs` ;
- conservation des règles de sécurité du support authentifié existant.

#### Responsive et recette
- adaptation desktop et mobile de l'ensemble de la landing page ;
- contrôle du header, des CTA, captures, schémas, FAQ, formulaire, modale et footer sur format mobile ;
- vérification des liens et appels à l'action ;
- correction des CTA du hero afin qu'ils mènent aux sections OF / Formateur de la landing ;
- test réel du formulaire public ;
- création de la demande vérifiée dans `support_requests` avec `source = public` ;
- notification e-mail Brevo reçue ;
- build de production réussi.

### Visuels intégrés
- `public/landing/diagrams/01-synchronisation-formateur-of.png` ;
- `public/landing/diagrams/02-reseau-prive-of.png` ;
- `public/landing/diagrams/03-recherche-formateur.png` ;
- cinq captures produit validées dans `public/landing/screenshots/`.

### Version
`v0.16.0`

### Enjeu produit
Donner à Formaplane une présence publique crédible et transformer les visites issues des invitations, partages et recommandations en découverte réelle du produit.

---

## Sprint 17 — Dashboard Admin, mini-CRM & statistiques d'utilisation ✅

### Livré
- espace Admin sécurisé et réservé à l’administration de Formaplane ;
- Dashboard de pilotage avec indicateurs d’adoption, d’activité et de fonctionnement ;
- activité OF et formateurs sur 7 jours glissants ;
- suivi des mises à jour manuelles de disponibilités sur 30 jours, hors mises à jour automatiques liées aux missions ;
- suivi des formateurs référencés par les OF et des OF ayant enrichi leur listing sur 30 jours ;
- courbes d’évolution avec dates visibles ;
- mini-CRM des demandes issues de l’application et du site public ;
- vues Utilisateurs et Organismes ;
- instrumentation légère des principales fonctionnalités consultées ;
- communication « Nouveautés Formaplane » depuis l’Admin avec ciblage, déduplication, compteur de destinataires, envoi test et historique ;
- désabonnement spécifique aux nouveautés avec double confirmation ;
- réabonnement depuis les Paramètres avec double confirmation et rappel de la date du désabonnement ;
- séparation stricte entre communications de nouveautés et e-mails transactionnels ;
- durcissement du rôle `platform_admin` afin que le compte administrateur prévu soit le seul compte Admin.

### Version
`v0.17.0`

### Enjeu produit
Piloter la bêta à partir de données réelles, centraliser les demandes et disposer d’un canal maîtrisé pour informer les utilisateurs des évolutions importantes.

---

## Sprint 18 — Tests automatisés & surveillance ✅

### Livré
- socle Vitest et 47 tests automatisés couvrant les validations métier, propositions, disponibilités, partage, e-mails, parcours publics et garde-fous E2E ;
- contrats automatisés sur les règles RLS/RPC et le cloisonnement multi-organismes ;
- contrôle de la règle anti-spam de 20 jours et du verrou anti double-envoi ;
- surveillance des erreurs React et JavaScript pour les utilisateurs authentifiés, avec journalisation non bloquante ;
- audit des dépendances ramené à 0 vulnérabilité connue au moment de la clôture ;
- socle Playwright et scénarios E2E critiques préparés, avec blocage explicite de la production ;
- activation des E2E réels différée afin de ne pas engager le coût d'un environnement Supabase dédié tant que l'usage ne le justifie pas ;
- GitHub Actions automatique à chaque push sur `main`, chaque Pull Request, à la demande et chaque lundi matin ;
- CI : tests, audit de sécurité npm et build de production ;
- notifications GitHub configurées afin de signaler par e-mail les workflows en échec ;
- ajout d'une FAQ utilisateur expliquant les contrôles automatisés de fiabilité.

### Version
`v0.18.0`

### Enjeu produit
Détecter les régressions et problèmes techniques plus tôt, tout en conservant une surveillance simple et exploitable.

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

# Sprint 19 — Optimisation UX & expérience mobile ✅

### Objectif atteint
Rendre Formaplane plus agréable, plus intuitif et réellement confortable à utiliser depuis un smartphone, sans dégrader l’expérience desktop.

### Livré
- navigation mobile dédiée avec header compact et menu latéral ;
- adaptation responsive des principaux écrans OF et Formateur ;
- plannings OF/Formateur harmonisés avec filtres au-dessus du calendrier et détail de journée ;
- calendrier OF mobile sur 7 colonnes sans défilement horizontal ;
- disponibilité Formateur en vue mobile compacte et dépliable ;
- listing Formateurs adapté en cartes mobiles, avec mini-planning et numéros de jours lisibles ;
- formulaires, modales, boutons et zones tactiles optimisés pour smartphone ;
- carnet central **Mes OF** côté Formateur ;
- synchronisation de **Mes OF** avec **Partager mes disponibilités** ;
- statut OF sur Formaplane / hors Formaplane et présence du formateur dans le réseau ;
- invitation OF avec délai serveur de 7 jours ;
- parcours invitation → inscription/connexion → fiche du formateur → **Ajouter à mon réseau** ;
- message pédagogique encourageant les formateurs à inviter leurs OF plutôt qu’à renvoyer systématiquement leurs disponibilités.

### Recette
- parcours mobiles Formateur et OF validés visuellement ;
- 62/62 tests automatisés réussis ;
- build de production réussi ;
- parcours réel d’invitation OF validé.

### Version
`v0.19.0`

---

# Sprint 20 — Création de missions par le formateur 🔜

### Objectif
Permettre au formateur d’ajouter lui-même dans son agenda Formaplane une mission confiée par un organisme qui n’utilise pas encore Formaplane.

### Périmètre cible
- création d’une mission depuis l’espace Formateur ;
- mission visible dans son planning professionnel ;
- mise à jour automatique de ses disponibilités pour les autres organismes ;
- distinction claire entre mission créée par un OF Formaplane et mission ajoutée personnellement par le formateur ;
- respect de la confidentialité : les autres OF voient uniquement l’information utile de disponibilité.

### Enjeu produit
Éviter au formateur de maintenir deux agendas différents et faire de Formaplane son planning professionnel de référence, même lorsque certains de ses clients OF n’utilisent pas encore la plateforme.

---

# Sprint 21 — Formaplane installable sur mobile (PWA) 🔜

### Objectif
Permettre aux utilisateurs d’installer Formaplane sur leur smartphone et de l’ouvrir depuis une icône comme une application, sans recréer le produit en application native.

### Périmètre cible
- PWA installable sur Android et iPhone ;
- icône Formaplane et ouverture en mode application ;
- écran de lancement et métadonnées adaptées ;
- invitation simple et non intrusive à installer Formaplane sur mobile ;
- détection pour ne pas reproposer inutilement l’installation lorsqu’elle est déjà réalisée ;
- vérification des principaux parcours dans le mode installé.

### Enjeu produit
Rendre l’accès quotidien à Formaplane aussi naturel qu’une application mobile tout en conservant un seul produit web à maintenir.

---

# Sprint 22 — Synchronisation Google Agenda 🔜

### Objectif
Permettre au formateur de retrouver automatiquement ses missions Formaplane dans son Google Agenda.

### Périmètre cible
- connexion sécurisée du compte Google du formateur ;
- synchronisation initiale à sens unique **Formaplane → Google Agenda** ;
- création automatique d’un événement lors de la confirmation d’une mission ;
- mise à jour ou suppression de l’événement si la mission change ou est annulée ;
- informations utiles dans l’événement : mission, horaires, lieu et lien direct vers Formaplane ;
- conservation de l’identifiant Google de l’événement afin d’éviter les doublons.

### Enjeu produit
Éviter une nouvelle double saisie et permettre au formateur de conserver Google Agenda comme agenda personnel tout en utilisant Formaplane comme source métier de ses missions.

---

# Sprints 23+ — Prévisionnels

Ordre volontairement non figé :
- améliorations UX et productivité ;
- gestion avancée des utilisateurs d'un OF ;
- rôles et permissions plus fins ;
- notifications et centre d'activité ;
- statistiques métier destinées aux OF ;
- documents et pièces liées aux missions ;
- communications SMS ;
- notifications Push ;
- automatisations et relances avancées ;
- fonctionnalités assistées par IA ;
- réseau et collaboration entre utilisateurs ;
- autres besoins révélés par la bêta.

## Règle de priorisation

**Retours utilisateurs + fréquence du besoin + valeur métier + risque technique.**

Les Sprints 13 à 22 constituent le bloc stratégique en cours. À partir du Sprint 23, la roadmap reste volontairement souple.

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
- un ZIP complet du projet est archivé ;
- la version affichée dans Formaplane est vérifiée et mise à jour ;
- la pertinence d'un e-mail « Nouveautés Formaplane » est décidée et, si nécessaire, la communication est envoyée aux populations pertinentes ;
- les « évolutions envisagées » visibles des utilisateurs sont révisées : retrait des éléments réalisés et ajout des nouvelles idées utiles aux utilisateurs ;
- une revue « Découvrir Formaplane » est faite avec validation explicite : FAQ, tutoriels, explications et captures sont actualisés si les changements du sprint le nécessitent.

---

# Priorité actuelle

```text
v0.19.0 — Sprint 19 officiellement clôturé
↓
Sprint 20 — Création de missions par le formateur
↓
Sprint 21 — Formaplane installable sur mobile (PWA)
↓
Sprint 22 — Synchronisation Google Agenda
↓
Sprint 23+ — Évolutions guidées par la bêta
```
