# Publication V1.4.0 — 15 novembre 2026

Vincent valide le candidat testé puis donne l’autorisation explicite : « Je valide. Tu peux mettre en production. » Aucun envoi de message n’est autorisé par cette publication.

## Intégration et déploiement

- PR [#24](https://github.com/Macor77/clementplane/pull/24), tête ce996a97f15633bb32644c90deec0b14adf2db70, base a580021 inchangée depuis la recette.
- Quality candidat [43708788416](https://github.com/Macor77/clementplane/actions/runs/43708788416) : 389 unitaires, toutes suites SQL, lint/audit/build et 53 parcours navigateur réussis.
- Fusion main : 46fe8711b6ff8c073a4e34f89bf2613d8ddfe295. Arbre identique au candidat validé.
- Vercel production dpl_5GSirpiLDUGcwCHfcuCGny1m2FvZ, READY ; app.clementplane.fr, www.clementplane.fr et clementplane.fr pointent sur cette livraison. Aucun drapeau ne limite les dépenses détaillées aux testeurs.
- Quality main [43710604664](https://github.com/Macor77/clementplane/actions/runs/43710604664). Le complément documentaire de clôture est vérifié par sa propre CI avant publication de la release ; aucune nouvelle fonctionnalité ou migration n’y est ajoutée.

## Migration, confidentialité et conservation

Projet de production clementplane hctvkynrgmnxjynbncdi, ACTIVE_HEALTHY. Nouvelle migration absente avant application, appliquée une seule fois sous 20261115114709_trainer_expense_items. Source 20261115110744_trainer_expense_items.sql, recette documentation-demo 20261115111417. Aucun db push global.

Deux bilans et deux lignes privées avant/après ; deux anciens frais convertis en une ligne chacun. Vérifications booléennes : montants en centimes identiques aux montants d’origine, archives identiques et détails conservés. Empreintes agrégées avant/après identiques : partagé 8cfe183815f9831bb5bcaa9a2af81dbe ; anciennes colonnes privées e5d21fa5781528eb83b08c6da2724b72. Aucun montant, texte privé ou identité de formateur extrait dans les preuves.

Les fonctions en production correspondent à la recette (MD5 prosrc) : expense_total 1e39f05bff972bd8006361715bf5050b ; save_report 12c5fe5ccd0194859ab0babf3e269a9c. search_path vide, helper invoker non exécutable par authenticated, sauvegarde definer contrôlant auth.uid et le formateur courant. La table privée garde sa RLS propriétaire ; authenticated SELECT uniquement, aucune écriture directe, anon sans SELECT.

Transaction en lecture/échec autorisation sous une identité fictive sans profil : aucun bilan partagé ou privé lisible, RPC refusée REPORT_ACCESS_DENIED ; ROLLBACK, aucune donnée persistante. Les vérifications owner/OF/autre formateur restent celles de la recette PostgreSQL réelle, le code des fonctions étant identique.

Advisors sécurité avant/après strictement identiques : 21 informations no-policy, 1 extension publique, 6 fonctions anonymes et 87 fonctions authentifiées historiques ; aucun constat nouveau sur le périmètre activité. Migration additive transactionnelle, données d’origine conservées en place. Aucune restauration de sauvegarde fournisseur testée, aucun export privé.

## Contrôles en ligne

HTTP 200 sur l’origine officielle, les routes statistiques et mission personnelle (identifiant fictif inexistant, shell seulement). Asset /assets/index-DQrOD5xE.js : version V1.4.0, ajout de dépense, expense_items, amount_cents, archive ancienne saisie et kilométrage indépendant présents. Le mécanisme PWA existant est conservé. Ancienne application : actualiser avant d’enregistrer le bilan au nouveau format.

Ces contrôles prouvent la version servie, la disponibilité des fichiers et les droits déployés. Aucun bilan réel modifié, aucun test sur un appareil installé, aucun compte partenaire sollicité. Les tests navigateur emploient des API simulées ; PostgreSQL hébergé a été testé en recette. Aucune modification des agendas ou du pilote Outlook.

## Release et archive

Le commit documentaire contenant release-v1.4.0 déclenche Quality puis Release V1.4.0 sources. Ce workflow vérifie la version, l’appartenance à main et Quality réussie sur le commit exact, archive ses sources avec manifeste, publie le tag/release puis télécharge les pièces jointes et contrôle SHA-256 et ZIP. Le tag v1.4.0 indique le commit de clôture ; son code applicatif est identique au commit de production ci-dessus. Aucun tag historique n’est déplacé.

[Release v1.4.0](https://github.com/Macor77/clementplane/releases/tag/v1.4.0) · [Workflow de release](https://github.com/Macor77/clementplane/actions/workflows/release-v1.4.0.yml)
