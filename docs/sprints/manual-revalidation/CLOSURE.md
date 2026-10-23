# V1.2.4 — Clôturé le 23 octobre 2026

L’OF peut confirmer individuellement l’accord reçu hors application après modification d’une mission, même après un e-mail Clementplane. L’affectation reste inchangée, l’historique indique l’auteur OF et le canal ; un ancien lien ne peut remplacer une réponse déjà enregistrée. Aucun accord réel ni e-mail client n’a été envoyé/enregistré pendant la recette.

## Références de livraison

- PR : https://github.com/Macor77/clementplane/pull/16 (fusionnée).
- Commit applicatif et tag v1.2.4 : `d21cd77432a7b161cc0f540e578bdbb036da43b3`.
- Arbre applicatif : `db3af751801c9d077ab41c1cc75db881e6b1f692`, identique au contenu local testé et au commit de PR `8889cc38f2519d179cbba11ab6dafb0036745e1f`.
- CI PR : https://github.com/Macor77/clementplane/actions/runs/39936709665 ; CI main : https://github.com/Macor77/clementplane/actions/runs/39936950950 — succès.
- Déploiement : https://vercel.com/formaplane/clementplane/2dej3ndDvSRpu6BZvfwjWAVwEp9C — statut Vercel success rattaché au commit applicatif via GitHub.
- Site : https://www.clementplane.fr ; bundle `/assets/index-DU2kRDXH.js` vérifié contenant V1.2.4, la RPC et le bouton.
- Release : https://github.com/Macor77/clementplane/releases/tag/v1.2.4 (publiée, non brouillon).
- Archive : `Clementplane_v1.2.4_Sources.zip`, 17 015 247 octets, SHA-256 `6a067708b0b007041f65aea930d41f2f7668a5addfb3566daef572e00ae7dedb`.
- Création, téléchargement, contrôle SHA-256 et ouverture du ZIP vérifiés par https://github.com/Macor77/clementplane/actions/runs/39937149505, job release réussi.

La clôture est un complément documentaire au commit applicatif tagué : aucun changement applicatif après celui-ci, aucun déplacement du tag, aucune modification de l’archive publiée. Les états de préparation des commits précédents sont historiques.

## Grille de clôture

| Obligation | Résultat et preuve |
|---|---|
| Périmètre | Confirmations indépendantes du canal initial ; un formateur à la fois ; accord explicite ; demandes anciennes compatibles. Tests SQL/service/navigateur. |
| Développement | Livré sur main par PR #16, contenu exact vérifié par arbre Git. |
| Recette | 247 tests Vitest, SQL métier/sécurité, 20 tests navigateur CI desktop/mobile/PWA shell. Revue indépendante sans défaut bloquant. |
| Supabase | Source 20261023094201, version distante 20261023100710 / manual_mission_revalidation. Corps SQL identique, MD5 745c3104a5ba13cf7f86e524245f23b6. EXECUTE anon=false/authenticated=true, search_path vide, AUTH_REQUIRED vérifié sans mutation. Pas de db push global. |
| Qualité/CI | CI PR et main réussies ; lint local 0 erreur/2 warnings Hooks préexistants ; audit sous seuil high (3 avis modérés Vitest de développement). |
| Production | Statut Vercel success + site HTTP 200 + version/bouton/RPC dans bundle. Deux scénarios sur les assets servis par www.clementplane.fr, 1440/390 px, erreurs/reprise, réussis avec API métier interceptée. |
| Documentation | README, fonctionnel, architecture, base, décisions, tests, exploitation, notes et dossier sprint actualisés. |
| Légal/RGPD | LEGAL_REVIEW.md : registre précisé ; CGU/confidentialité/mentions/traceurs/conservation/droits/violations inchangés avec justification ; aucun prestataire ajouté, contrats non réaudités. |
| Roadmap | État courant V1.2.4 livré ; historique préservé. |
| Changelog / notes | Version et date exactes, bénéfices et migration décrits. |
| Version affichée | package/lockfile/Découvrir 1.2.4 ; vérifiée dans production. |
| GitHub | PR fusionnée, contrôles réussis, documentation finale publiée. |
| Tag / archive / release | Commit exact, archive vérifiée après téléchargement, liens ci-dessus. |
| Évolutions envisagées | Revue : aucune entrée à retirer pour cette amélioration d’un parcours existant. |
| Découvrir | FAQ OF ajoutée. Tutoriels/captures existants non invalidés ; landing inchangée. |
| Communication | E-mail nouveautés jugé non nécessaire pour cette amélioration ciblée ; aide/FAQ suffisantes. Aucun envoi. |
| Pilotage | RETOUR_PILOTAGE.md actualisé ; aucun sprint suivant lancé. |

## Portée des preuves et suivi

Les tests métier s’exécutent dans PGlite et avec API fictive. Le contrôle de production navigue sur les vrais fichiers déployés avec données fictives et intercepte toute API métier ; il ne prouve pas un accord réel de bout en bout dans la base de production. Le corps SQL et ses privilèges ont été vérifiés séparément sur la base réelle. Pas de test sur appareil PWA physique ; shell inchangé. Aucun utilisateur partenaire sollicité.

L’API Vercel directe reste inaccessible (403 équipe) ; les preuves alternatives sont le statut signé par l’intégration Vercel sur GitHub et les fichiers réellement servis par le domaine de production. Le refus initial du push a été levé par l’autorisation explicite de Vincent, puis publication via connecteur GitHub authentifié (commande Git locale sans identifiants).

Deux points mineurs documentés au backlog : une annulation simultanée peut occasionner une transaction annulée automatiquement et une reprise manuelle ; le libellé d’historique côté formateur reste général mais l’acteur OF est distinct. Pas de corruption ni de contournement d’accès identifié. L’avis Supabase SECURITY DEFINER/authenticated est intentionnel et couvert par les contrôles d’adhésion ; avis historiques inchangés. Revue et preuves : PROGRESS.md et OPERATIONS.md.
