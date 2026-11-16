# Publication V1.5.0 — 16 novembre 2026

Vincent a explicitement autorisé : « Je t’autorise à mettre en production. » Aucun e-mail ni message autorisé ou envoyé.

## Livraison

- PR [#25](https://github.com/Macor77/clementplane/pull/25), tête `d3ee7b80d4afc946c60b3048c51bc1bb5a4a952e`, base `a74980022e673840e6c6b423ffe5d8ce9aedb8ba` inchangée.
- [Quality candidat 43843828444](https://github.com/Macor77/clementplane/actions/runs/43843828444) réussie : 406 unitaires, 58 parcours navigateur, toutes suites SQL, lint/audit/build. Revue indépendante sans défaut bloquant.
- Fusion main `9cad9cb3881afcaad5892b4541899282e26242a1` : arbre identique au candidat. [Quality main 43844346720](https://github.com/Macor77/clementplane/actions/runs/43844346720) ; contrôle exact supplémentaire sur le commit documentaire avant release.
- Vercel production `dpl_7HG3PCycKrE7Bz5ToU6kQ6FB9aJb`, READY, bon dépôt/commit. Alias app.clementplane.fr, www.clementplane.fr, clementplane.fr. Aucun drapeau limitant cette fonction aux testeurs ; pilote Outlook inchangé.

## Base et sécurité

Migration source `20261116065258_partial_trainer_attendance.sql`, démonstration `20261116095029`, production `20261116095526`. Absente avant application, appliquée une seule fois avant frontend. Aucun db push global ni fonction Edge ajoutée.

Trois bilans et trois lignes privées avant/après, détails initialisés à `[]`. Empreintes agrégées préexistantes identiques : partagé `2fc7a5e6da84947e6ffb0e8e2c3257ba`, privé `634bebf50a600dc7fd9ea733cfa02b1e`. Aucun contenu de bilan ni identité extrait.

Fonctions identiques à la recette et au dépôt (MD5 prosrc) : save_report `2930e393a1686ca6d32bb273c14eaacb`, validate_partial_attendance `907354d0ca7760c74930712b036598b1`. search_path vide ; helper invoker inaccessible aux clients, wrapper public invoker uniquement authenticated, sauvegarde definer interne avec contrôle auth/propriétaire. RLS partagée propriétaire/OF commanditaire, privée propriétaire uniquement ; UPDATE direct authenticated et SELECT anon interdits.

Contrôle en transaction READ ONLY sous identité fictive sans profil : aucun bilan partagé/privé visible, sauvegarde refusée REPORT_ACCESS_DENIED, ROLLBACK. Aucun utilisateur créé ni donnée métier écrite. Tests propriétaire/OF/tiers complets sur PostgreSQL réel de démonstration ; même code déployé.

Advisors avant/après strictement identiques, aucun constat activité nouveau. Dette historique : [21 RLS sans politique](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [1 extension publique](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public), [6 fonctions anon](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [87 fonctions authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Aucun élargissement de droits.

## Contrôles en ligne et limites

HTTP 200 sur https://app.clementplane.fr, /formateur/statistiques et /formateur/missions/personnelles/fff15000-0000-4000-8000-000000000051 (identifiant inexistant, shell seulement). Asset `/assets/index-BCUN5Fy_.js` en 200 : V1.5.0, partial_attendance, volet, jours/heures et sauvegarde présents.

Ces contrôles prouvent le code servi et les routes, pas un parcours connecté avec données réelles. Tests navigateur avec API simulée ; PostgreSQL réel en démonstration. Aucun appareil/PWA installé ou restauration fournisseur testé ; mécanisme PWA conservé. Les anciennes applications demandent une actualisation avant modification d’un bilan contenant ce détail.

## Clôture, archive et retour arrière

Le commit documentaire contenant `release-v1.5.0` conserve le même code applicatif. Après Quality, le workflow Release V1.5.0 sources vérifie version et appartenance à main, archive le commit avec manifeste, publie tag/release puis télécharge les pièces jointes et vérifie SHA-256 et ZIP. Aucun tag historique déplacé.

[Release v1.5.0](https://github.com/Macor77/clementplane/releases/tag/v1.5.0) · [Workflow](https://github.com/Macor77/clementplane/actions/workflows/release-v1.5.0.yml).

Retour arrière : conserver colonne, données et protection RPC ; ne pas rejouer l’ancienne migration. Un ancien frontend ne peut éditer le nouveau détail ; privilégier une correction en avant. Aucun message ni calendrier modifié.
