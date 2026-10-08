# V1.2 — Livraison de développement conditionnelle

Date : 8 octobre 2026. **Sprint non clôturé : recette Google réelle et autorisation de production en attente.**

## Livré
Code de synchronisation unidirectionnelle volontaire : calendrier dédié, correspondance des statuts réels, revalidation, multidates, fuseau Europe/Paris, historique, événements privés et options d'export. OAuth/PKCE côté serveur, jetons chiffrés, file durable, traitements exclusifs, reprises et rapprochement ; aucune invitation et aucune lecture des agendas personnels. Interface formateur, FAQ/tutoriel et accueil missions personnelles mis à jour. Procédure d'exploitation, recette, RGPD et notes de préversion préparées.

## Preuves et limites
- Base V1.1 : 159 tests. Livraison : 207 tests, dont 48 nouveaux, exécutés avec succès localement et dans le premier passage CI de la PR.
- Contrôles SQL calendrier/RLS et compatibilité des inscriptions réussis. Fixture PGlite réduite : ne remplace pas l'application des migrations sur un Supabase isolé complet.
- Build V1.2 préversion réussi. Lint : aucune erreur ; deux avertissements préexistants.
- Audit des dépendances de Quality réussi.
- Revue indépendante effectuée. Quatre problèmes importants reproduits et corrigés : concurrence OAuth/déconnexion, générations d'événements après annulations répétées, reprise ETag/DB temporaire, état transitoire sans dates. Tests de régression exécutés.
- Scénarios navigateur desktop/mobile/callback et PWA préparés ; résultat final CI à consigner dans le retour de pilotage.
- Aucun test avec compte Google réel, aucun test effectif de partage Google, aucun scheduler installé. Aucun secret OAuth disponible ni console Google inspectée. Pas de captures présentées comme preuves Google.

## Traçabilité
Base main et production auditée : `5f4ef5066f1130ccb76565e8e42236acb3f8668a`, V1.1, tag `v1.1.0`. Branche : `feature/v1.2-google-calendar`. PR brouillon : https://github.com/Macor77/clementplane/pull/5 . Première publication : `dde67f26c0db97e138095af2b0438b77957b48b1`, arbre identique au développement local `23de69b` (`f1031888301504149e4a112ac80abdc3ff7d26a1`). Les modifications locales ont été regroupées dans ce commit de publication via le connecteur.

Version package : `1.2.0-beta.1`. Aucun tag V1.2 ou release publié ; notes dans `docs/releases/v1.2.0-beta.1.md`. Le connecteur GitHub disponible ne crée ni tag ni release ; une autre voie autorisée est nécessaire pour enregistrer la release en brouillon.

## Environnements et migrations
Production Supabase auditée en lecture seule ; aucune mutation de production. Deux migrations nouvelles préparées : `20261008054625_google_calendar_sync.sql` et `20261008061224_google_calendar_privacy_notice.sql`. Cron séparé, désactivé tant que non configuré. Les trois correspondances d'historique V1.1 sont documentées dans DESIGN.md ; aucun replay global. Aucune fusion ni mise en production réalisée.

## Sauvegarde
L'archive de préparation contient les fichiers modifiés, un patch applicable à la base V1.1 et un manifeste d'empreintes. Elle exclut `.env`, node_modules, journaux, bases de données, comptes OAuth, anciennes archives et pièces métier. Les scénarios utilisent des identités fictives. Elle représente la livraison de développement ; une archive finale avec preuves Google devra suivre la recette, puis le tag/release au statut adapté.

## Risques et suite
Priorité de roadmap : terminer la qualification Google avant d'ouvrir d'autres fournisseurs. Points bloquants : environnement isolé, projet/client OAuth, URL de recette, testeurs autorisés, publication/branding Google, recette de partage et PWA. Vérifier les journaux d'accès de la route callback (query strings) et les paramètres de conservation avant activation. La classification des scopes et le statut réel de vérification sont à constater dans la console.

Pas de dépense engagée. API Calendar standard annoncée sans coût additionnel ; quotas/propositions de hausse et consommation Supabase à confirmer selon le projet. Montée en charge à mesurer, le rapprochement lit les événements suivis. Dette connue : récupération manuelle d'une création de calendrier au résultat incertain ; après refus OAuth, chargement possible jusqu'au rafraîchissement à 15 secondes ; revue RGPD selon le type de compte Google ; validation PWA authentifiée sur appareils réels.

Consulter OPERATIONS.md et ACCEPTANCE.md avant toute activation. Ne pas demander de mot de passe ou secret dans le chat. La fusion et le déploiement restent soumis à l'accord final explicite, après preuves de recette.
