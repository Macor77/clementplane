# Clementplane V1.2 — retour au pilotage du 8 octobre 2026

**Développement livré, recette SQL avancée, sprint non clôturé. PR et release en brouillon. Production inchangée en V1.1.**

## Livré
Connexion volontaire Clementplane → Google Agenda, un compte par formateur et calendrier dédié. Propositions/options disponibles, missions OF et personnelles confirmées occupées ; événements privés par journée, horaires réels ou « Horaires à préciser », revalidation, mises à jour, annulations et historique. Rémunération et notes privées exclues par défaut et retirées après désactivation. Aucun invité ni partage automatique.

OAuth serveur/PKCE et jetons chiffrés, file durable, verrous/reprises, rapprochement et cron préparés. Paramètres formateur, aide/FAQ/tutoriel, documents RGPD et accueil missions personnelles actualisés. Accès Google désactivé/masqué par défaut ; aucune annonce publique.

## Décisions et tests
Scope calendar.app.created + openid/email, sans Gmail ni lecture des agendas personnels. Identifiants stables et marqueurs de propriété ; Europe/Paris ; conditions déjà acceptées préservées pendant la revalidation ; calendrier conservé après déconnexion et réutilisé au même compte. Autres fournisseurs hors périmètre.

207 tests automatisés et six tests navigateur réussis sur la livraison applicative, SQL/RLS, audit et build validés. Lint sans erreur (deux avertissements préexistants). Quatre problèmes importants corrigés après revue indépendante. Captures fictives desktop/mobile inspectées.

Les trois migrations ont été appliquées après accords uniquement sur environnement isolé de recette. Neuf contrôles SQL d'intégration et cinq contrôles de notice ont réussi, avec rollback des écritures. L'ancien écart de permissions serveur est corrigé ; les neuf contrôles ont été relancés avec succès sans permissions sources temporaires. SELECT reste limité aux cinq colonnes prévues, sans droit UPDATE ajouté. La production possède déjà ces droits (constat en lecture seule). Les CI 37743245393 et 37743876956 sont vertes, tests navigateur inclus. Le worker attend encore sa configuration Google et son déploiement. Détails : STAGING.md.

## Références
Branche feature/v1.2-google-calendar ; PR brouillon https://github.com/Macor77/clementplane/pull/5 . Commit applicatif initial dde67f26, correctifs navigateur 45c12ce, sauvegarde 3bf8450, correctif de permissions et recette SQL 3851f87. Les mises à jour documentaires suivantes sont dans la PR.

Version préparée 1.2.0-beta.1. Release enregistrée en brouillon avec archive : https://github.com/Macor77/clementplane/releases/tag/untagged-4c58d7bb2695088cbd25 . Tag v1.2.0-beta.1 prévu à la publication, pas encore créé. Aucune fusion ni production. Main reste 5f4ef50, V1.1 / v1.1.0.

Recette : trois migrations calendrier appliquées. Identifiants et correspondances de versions distantes conservés dans le rapport privé du titulaire ; aucun rejeu global. Fonctions et scheduler Google non déployés.

Archive Clementplane-V1.2-preparation-2026-10-08.zip : snapshot 3bf8450, patch de restauration contrôlé, fichiers du sprint et captures fictives, sans secrets ni données métier. Les compléments ultérieurs sont sauvegardés dans Git ; archive finale à actualiser après recette complète.

## Blocages et roadmap
Google Cloud reste inaccessible dans le navigateur de la session après nouvelle vérification ; projet, client OAuth, URL de retour, audience et vérification non inspectés. Aucun compte Google réel utilisé. Suite : accès/configuration Google, fonctions/cron, puis recette réelle OAuth, droits de partage, absence d'invitations, navigateur fermé et PWA. Aucun mot de passe ou secret dans le chat.

Pas de nouvelle dépense engagée. Usage Calendar standard annoncé sans coût additionnel ; quotas et consommation Supabase à vérifier dans le projet réel. Mesurer le rapprochement avant montée en charge. Revue RGPD et journaux callback à finaliser ; récupération manuelle prévue en cas de création de calendrier incertaine ; bref chargement possible après refus OAuth.

Priorité suivante : qualifier V1.2. Ne pas ouvrir d'autres fournisseurs, annoncer Google disponible, fusionner ou déployer avant recette et accord final explicite.
