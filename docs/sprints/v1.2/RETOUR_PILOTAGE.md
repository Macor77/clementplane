# Clementplane V1.2 — retour au pilotage du 8 octobre 2026

**État : développement livré en PR brouillon ; sprint non clôturé. Production inchangée en V1.1.** La recette Google réelle, le déploiement isolé et la publication OAuth restent bloquants.

## Livré
Synchronisation volontaire Clementplane → Google Agenda, un compte par formateur et calendrier dédié « Clementplane ». Propositions/options disponibles, missions OF/personnelles confirmées occupées, événements privés par journée, horaires réels ou journée entière « Horaires à préciser », modifications et annulations, historique et revalidation respectés. Rémunération et notes privées désactivées par défaut et retirées après désactivation. Aucun invité, aucun partage Google modifié.

OAuth serveur avec PKCE et jetons chiffrés, file durable, verrous et reprises, réconciliation et cron préparés. Paramètres formateur, aide/FAQ/tutoriel, documents RGPD et accueil missions personnelles sans OF inscrit mis à jour. L'accès Google est masqué/désactivé par défaut ; aucune annonce de disponibilité publique.

## Décisions structurantes
Scope `calendar.app.created` avec `openid`/`email`, sans lecture des agendas personnels ni Gmail. Identités déterministes et marqueurs de propriété pour éviter les doublons et protéger les événements étrangers. Europe/Paris pour les dates actuelles sans fuseau. Conditions antérieurement acceptées conservées pendant une revalidation. Reconnexion du même compte ; calendrier conservé après déconnexion. Architecture fournisseur réutilisable, aucun second fournisseur développé.

## Tests et limites
207 tests automatisés réussis (159 existants + 48 nouveaux), SQL/RLS et compatibilité des anciennes notices réussis, build préversion réussi, audit des dépendances CI réussi ; lint sans erreur avec deux avertissements préexistants. Revue indépendante : quatre problèmes importants corrigés et couverts par des régressions.

Le premier passage navigateur a révélé une attente incorrecte du test sur les préférences confirmées par le serveur ; test corrigé sans retirer les assertions fonctionnelles. Relance entièrement verte : six scénarios navigateur réussis, captures fictives desktop/mobile inspectées. Preuve : https://github.com/Macor77/clementplane/actions/runs/37737354470 sur 45c12ce. Les captures sont incluses dans l’archive. Les scénarios simulent Google/Supabase et ne valent pas recette connectée. Le test SQL réduit ne remplace pas une répétition sur le schéma Supabase complet.

## Références et environnements
- Branche `feature/v1.2-google-calendar`, PR brouillon https://github.com/Macor77/clementplane/pull/5 .
- Commit initial publié `dde67f26c0db97e138095af2b0438b77957b48b1` ; documentation/captures CI `bcf2f1ca10175ecc997d0b9ce9553480fbe1f05f` ; correction du test `45c12ce1db380de626cfac456435061423bc20de`. Les commits documentaires suivants sont listés dans la PR.
- Version préparée `1.2.0-beta.1`. Notes prêtes dans `docs/releases/v1.2.0-beta.1.md`. Aucun tag V1.2 ni release créés : le connecteur disponible ne propose pas ces opérations ; la release doit rester en brouillon avant accord.
- Production auditée : V1.1 / `v1.1.0`, main `5f4ef5066f1130ccb76565e8e42236acb3f8668a`, déploiement Vercel réussi. Aucune fusion, migration ni modification de production effectuée.
- Deux migrations additives préparées : `20261008054625_google_calendar_sync.sql` et `20261008061224_google_calendar_privacy_notice.sql`. Les trois divergences d'identifiants historiques V1.1 sont cartographiées ; ne pas lancer de migration globale. Scheduler et fonctions non déployés.
- Archive de préparation : `Clementplane-V1.2-preparation-2026-10-08.zip`, fichiers modifiés + patch V1.1 + manifeste, sans secrets ou données métier. Archive finale à compléter après recette réelle.

## Blocages, risques et roadmap
Le projet Google Cloud, ses clients OAuth, domaines/retours, audience et vérification n'ont pas pu être inspectés. Aucun compte Google réel n'a servi aux essais. Il faut une recette Supabase isolée et des comptes de test autorisés distincts, puis vérifier OAuth/refus/reconnexion, droits Google, absence d'invitations, navigateur fermé et PWA. Aucun mot de passe ou secret à transmettre dans le chat.

Aucune dépense engagée. Usage Calendar standard annoncé sans coût additionnel ; quotas, demandes de hausse et consommation Supabase à vérifier dans le projet réel. Mesurer le coût du rapprochement avant montée en charge. Revue RGPD et conservation des journaux OAuth à finaliser. Récupération manuelle prévue pour une création de calendrier au résultat incertain ; bref chargement possible après un refus OAuth.

La priorité suivante est la qualification de V1.2, sans ouvrir Outlook/iCloud, BPF ou facturation. Ne pas annoncer Google disponible, fusionner ou déployer avant cette recette et l'accord final explicite.
