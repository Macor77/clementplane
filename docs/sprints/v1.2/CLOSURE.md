# V1.2 — Bilan de clôture au 15 octobre 2026

**Verdict : clôturé avec réserves documentées, sur décision explicite de Vincent le 15 octobre 2026 à 13:30 (Paris).** Après présentation du bilan et des éléments restants, Vincent autorise la clôture et décide de ne pas envoyer de mail de nouveautés. La fonctionnalité est ouverte depuis le 14 octobre. Cette décision de clôture ne certifie pas les justificatifs contractuels ou les journaux amont non consultés ; leur qualification reste suivie ci-dessous.

## Mandat et décisions

Clôture expressément demandée le 15 octobre avec reprise des autorisations. Les autorisations antérieures couvrent migrations ciblées, fonctions Google, fusion, déploiement, recette sur mission fictive et ouverture publique. Aucune nouvelle autorisation de ces opérations n’est attendue. Calendrier séparé « Prénom Nom — Clementplane », sans agenda principal ni synchronisation bidirectionnelle. Aucun e-mail de nouveautés envoyé.

Le 14 octobre à 09:56 (Paris), Vincent a répondu « Je valide ! » après présentation des textes d’ouverture et des limites PWA installée réelle / droits Google avancés. Ces deux réserves sont acceptées ; elles ne valent pas validation de contrats ou de paramètres d’hébergement non consultés.

## Références de livraison

- Livraison métier : PR [#5](https://github.com/Macor77/clementplane/pull/5), fusion `6e579d7f169ecd6e9730198232e1d1aaca69fa22`.
- Textes d’ouverture : PR [#8](https://github.com/Macor77/clementplane/pull/8), fusion `7235e265f79a8ab8d2989525277761b465fb6d20`.
- CI de cette fusion revérifiée le 15 octobre : [Quality 38532131687](https://github.com/Macor77/clementplane/actions/runs/38532131687), succès.
- Déploiement de cette fusion : [Vercel](https://vercel.com/formaplane/clementplane/5osizX1EpDjUqnp3ftaMm6P65a2q), statut GitHub succès revérifié le 15 octobre.
- Version de régularisation : `1.2.0` (package, lock, affichage V1.2), pas de nouvelle fonction métier ni de migration. Notes : [v1.2.0](../../releases/v1.2.0.md).
- Les références finales de cette régularisation, du tag et de l’archive sont consignées dans [DELIVERY.md](DELIVERY.md). Ne pas assimiler leur préparation à une publication accomplie.

## Matrice de clôture

| Exigence | État et preuve datée | Environnement | Action restante |
|---|---|---|---|
| Périmètre accepté | Preuve antérieure applicable, 14/10 : connexion volontaire, calendrier séparé, propositions/options/missions OF et personnelles, mises à jour/retraits, confidentialité et reprise ; DESIGN/ACCEPTANCE | Recette et production | Aucune extension ; Outlook, iCloud, BPF, paiement et lecture des rendez-vous personnels exclus |
| Développement | Vérifié 15/10 : PR #5/#8 intégrées à main, SHA ci-dessus | GitHub | Régularisation aide/version documentée dans DELIVERY |
| Recette réelle | Preuve antérieure applicable 14/10 : connexion, création fictive, modification, retrait et reconnexion sans second calendrier confirmés par le titulaire ; contrôles serveur associés | Production | Aucun nouveau test destructif ; second compte production non testé |
| Confidentialité Google | Preuve antérieure applicable 09/10 : propriétaire et deux comptes lecteurs ; privé/libre-occupé, options sans données sensibles par défaut | Recette autorisée | Droits d’édition/gestion non testés : réserve explicitement acceptée le 14/10 ; suivi Vincent sur environnement adapté |
| Desktop/mobile/PWA | CI navigateur/service worker et recette Android navigateur antérieures applicables | CI / téléphone navigateur | PWA installée réelle : réserve explicitement acceptée le 14/10 ; suivre avant promesse d’un parcours PWA qualifié |
| Supabase | Vérifié 15/10 : quatre migrations métier et extension scheduler présentes ; trois tables RLS sans SELECT anon/authenticated ; quatre RPC calendrier serveur uniquement ; deux fonctions ACTIVE version distante 3 ; tâche minute active | Production | Aucun rejeu. Correspondances de versions dans PUBLICATION_PLAN ; valeur historique fonction v1 remplacée par constat v3 |
| Synchronisation | Vérifié 15/10 à 07:52:01 Paris : dernier cycle réussi ; aucun jeton ou contenu de mission extrait | Production | Surveillance des erreurs/retards selon OPERATIONS |
| Qualité/CI | Vérifié 15/10 : CI fusion #8 réussie. Contrôles de régularisation dans DELIVERY | Local / GitHub | Ne pas utiliser CI comme preuve d’une nouvelle connexion OAuth réelle |
| Activation | Preuve antérieure applicable 14/10 : frontend activé, mode public enregistré par titulaire, dernière capture sans bandeau de test ; code autorise les comptes formateurs en public | Production | Pas de second compte production testé ; pas de nouvelle lecture des secrets |
| Version et site | Callback HTTP 200 avec no-store/no-referrer revérifié 15/10 ; vérification version finale dans DELIVERY | Production | L’en-tête ne prouve pas l’absence de collecte amont |
| Documentation | Actualisée 15/10 : README, fonctionnel, architecture, base, PRD, tests, dépannage, décisions, exploitation et états courants des dossiers historiques | Dépôt | Éléments contractuels ouverts ci-dessous |
| Roadmap/changelog | Actualisés et synchronisés racine/docs le 15/10 ; fonction marquée livrée, clôture distincte | Dépôt | Ne pas démarrer le prochain sprint |
| Aide utilisateur | FAQ Google, partage et déconnexion, évolution retirée des pistes futures ; guide textuel et aide paramètres ; revue 15/10 | Application / docs | Onze tutoriels illustrés inchangés : parcours non modifiés, aucune nouvelle capture réelle publiée. Landing inchangée après revue |
| GitHub/tag/archive/release | Vérifié le 15/10 : PR #9/#10 fusionnées, CI réussie, v1.2.0 publiée avec archive téléchargée et vérifiée ; détails dans DELIVERY | GitHub | Terminé pour le lot public ; lot documentaire autorisé à la publication le 15/10 à 13:30 |
| Communication | Message et population formateurs préparés dans COMMUNICATION ; invitation dans l’application déjà livrée | Dépôt / application | Décision du 15/10 à 13:30 : aucun e-mail de nouveautés ; obligation traitée, aucun envoi |
| Pilotage | Présent document et RETOUR_PILOTAGE actualisés | Dépôt | Lever uniquement les points réellement justifiés |

## Impact légal et protection des données : revue technique

Cette revue identifie les documents et les écarts ; elle ne certifie ni la qualification juridique ni les contrats non consultés.

| Document / obligation | Décision du 15 octobre | Preuve / suite |
|---|---|---|
| CGU | Aucune modification technique nécessaire : objet et fonctions associées couvrent l’option demandée ; pas de nouvelle tarification ni obligation utilisateur imposée | LegalPage, sections 1 et suivantes ; validation juridique contractuelle non déduite |
| Confidentialité | Texte d’ouverture déjà modifié et publié le 14/10, conservé | PR #8 ; données, destinataires, options et copies après déconnexion explicités |
| Mentions légales | Inchangées : identité exploitant/contact/hébergeur non modifiés par ce sprint | LegalPage relue |
| Cookies/traceurs | Précision ajoutée sur stockage de session OAuth et préférence de report d’invitation | Code callback / invitation et page traceurs ; pas de nouveau traceur publicitaire introduit |
| Registre | Statut mis en service actualisé ; finalité, catégories et copies décrites | REGISTRE_TRAITEMENTS ; qualification/base contractuelle du flux encore à valider par responsable |
| Sous-traitants/DPA/transferts | Écart maintenu explicitement : compte Google personnel/Workspace du formateur distinct du contrat Workspace de l’exploitant | SOUS_TRAITANTS : pièces applicables et validation du cadre non retrouvées ; responsable Vincent |
| Conservation et droits | Procédures actualisées sur jetons, correspondances et copies Google | POLITIQUE_CONSERVATION / PROCEDURE_DROITS ; déconnexion n’efface pas le calendrier |
| Incident | Périmètre copies et autorisations Google ajouté à la procédure existante | PROCEDURE_VIOLATION_DONNEES ; aucun incident supposé |
| Journaux OAuth | Configuration et durée de collecte amont non qualifiées ; absence de témoin dans une vue ne prouve pas absence de collecte | Preuves 14/10 PUBLICATION_PLAN et PUBLIC_LAUNCH_COPY ; demander preuve fournisseur/configuration, sans exporter de codes réels |

## Suivi après clôture et responsables

1. **Vincent / responsable du traitement** : fournir ou faire valider les conditions applicables au flux Google et les garanties contractuelles/transferts, puis consigner la référence de la décision. L’autorisation d’ouvrir ne remplace pas ces justificatifs.
2. **Vincent / administrateur hébergeur** : obtenir une preuve sur la collecte, l’accès et la rétention des paramètres du callback, ou appliquer une mesure appropriée et la vérifier. L’accès administratif du connecteur était refusé ; aucune conclusion d’absence de collecte.
3. **Communication — terminé** : décision explicite de Vincent de ne pas envoyer de mail de nouveautés. Les réserves PWA/droits avancés déjà acceptées restent suivies sans nouvelle demande d’accord.
4. **Publication documentaire** : autorisation explicite reçue le 15 octobre à 13:30 après présentation du lot et du refus automatique ; blocage d’autorisation levé. Références de la publication dans la PR de clôture.
5. **Agent — terminé** : version/CI/déploiement/tag/archive/release vérifiés dans DELIVERY ; aucune modification du schéma ni des missions réelles.

La décision de clôture intervient après présentation explicite des points ci-dessus. Les preuves absentes restent absentes : aucune conformité contractuelle ou absence de journalisation n’est inventée. Le suivi appartient au responsable du traitement et à l’administrateur hébergeur ; aucune nouvelle fonction ni campagne de tests n’est démarrée par cette clôture.
