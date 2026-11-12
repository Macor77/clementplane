# Publication V1.3 — 12 novembre 2026

Autorisation explicite de Vincent obtenue après présentation de la PR, des tests et des trois migrations. Elle couvre production, tag, release et clôture ; aucun envoi de communication.

## Sources et contrôles

- PR [#21](https://github.com/Macor77/clementplane/pull/21), tête validée `1691daa9efa245b0a7af4d79fb89bfd026667534`, fusionnée dans main au commit `cb0c1ccd78cce5d4cac8b25aa06e5906e3266cdf`.
- Main n’avait pas changé depuis l’audit (`6bd5654`). Les trois nouveaux objets/migrations étaient absents avant application ; aucune répétition ni db push global.
- Production Supabase `hctvkynrgmnxjynbncdi`, clementplane, ACTIVE_HEALTHY. Migrations 20261112083422 / 20261112083443 / 20261112083451, détail et empreintes dans OPERATIONS.
- Vercel production `dpl_Y21sa77eUwDXQPRQFbQh2FV4gzVu`, READY, commit cb0c1ccd. Domaines : app.clementplane.fr et www.clementplane.fr.
- Quality de la PR [43179007679](https://github.com/Macor77/clementplane/actions/runs/43179007679) et de main [43184262847](https://github.com/Macor77/clementplane/actions/runs/43184262847) réussies : 349 tests unitaires, 43 parcours navigateur, suites SQL et build/audit/lint.

## Vérifications en ligne et base

- HTTP 200 sur app.clementplane.fr et le shell des routes statistiques, bilans conservés et missions. Asset servi `index-BTmUMm4b.js` contient V1.3.0, les libellés de bilan/statistiques, les nouvelles tables et la notice 2026-11-12. Cela vérifie les fichiers déployés, pas une saisie utilisateur authentifiée.
- RLS activée sur les deux tables. authenticated : lecture autorisée sous RLS, aucune écriture directe ; RPC publique invoker. anon : aucun EXECUTE sur la RPC.
- API réelle anonyme : HTTP 401 / 42501 sur les deux tables et la RPC. Schéma `activity_private` non exposé : HTTP 406 / PGRST106 avec Accept-Profile.
- Requête transactionnelle sous rôle authenticated sans profil : aucune ligne accessible et sauvegarde refusée REPORT_ACCESS_DENIED ; rollback, aucune donnée persistante.
- Les corps SQL correspondent exactement à la recette : save_report `81a7903b51de2c053023b91714ff4007`, validate_sessions `5c75dc643de9058bce45bc669992f7c0`, wrapper `4be6339b212ccb50c3f0a6092bc554fe`, notice `c8501701531cc5894c15fa228478f3fd` (MD5 de prosrc pour comparaison, pas une signature de sécurité).
- Advisors après migration : aucun constat concernant les objets activity. Alertes historiques conservées hors périmètre.
- Aucun compte réel sollicité, aucune réalisation réelle créée ou modifiée, aucun e-mail envoyé, aucun élargissement du pilote Outlook.

## Clôture et reproductibilité

Le commit documentaire de clôture ne change pas le code applicatif. Son message `release-v1.3.0` déclenche la chaîne Quality → Release V1.3.0 sources sur main. La release est créée uniquement après Quality réussie et archivage du commit exact ; le workflow télécharge ensuite les pièces jointes et vérifie leur SHA-256 et intégrité ZIP. Le tag v1.3.0, les liens de la release et le workflow sont les références finales du commit documentaire et de ses preuves.

[Release v1.3.0](https://github.com/Macor77/clementplane/releases/tag/v1.3.0) · [Workflow de publication](https://github.com/Macor77/clementplane/actions/workflows/release-v1.3.0.yml)
