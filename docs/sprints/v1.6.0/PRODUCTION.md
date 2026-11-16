# Production V1.6.0 — 16 novembre 2026

Vincent : **« Je valide. Tu peux mettre en production. »** Accord reçu après présentation de la candidate et des 413 tests unitaires/contrats et 67 parcours navigateur réussis.

## Sources et déploiement

- PR #27 : https://github.com/Macor77/clementplane/pull/27, sortie du brouillon et fusion effectuées avec contrôle du SHA attendu.
- Code applicatif : **280a2746ec02bbbbf293ea47328a420b6bd41afc** ; tête candidate/documentation **60f3aefc6cdc3c1e60e750a22971304beeca6ee7**, Quality 43874641015 réussi et Vercel preview réussi avant fusion.
- Fusion main : **3e92d588537d3fe0df1279dd6824fdede734c252**, Quality https://github.com/Macor77/clementplane/actions/runs/43876479305.
- Vercel : **dpl_3Lz7f98q6DZLzVoQeNJt9dQ4A65X**, cible **production**, état **READY**, SHA de fusion exact.
- Alias vérifiés : app.clementplane.fr, www.clementplane.fr, clementplane.fr.

## Contrôle en ligne sans écriture

Origine https://app.clementplane.fr : HTTP 200 pour `/`, `/formateur/statistiques` et une route de mission personnelle à UUID fictif. Ces contrôles vérifient le shell SPA servi, pas une session utilisateur connectée ou une fiche réelle.

Bundle servi : **/assets/index-OYeSLfk6.js**, SHA-256 **dc490525de59df887b7d9b4d304e51f95db5c8f342a876a05bc75ddd16391f17**. Présence de V1.6.0, des libellés « Apprenants entièrement formés » et « Total des participants », de la nouvelle aide excluant les présences partielles. Ancienne phrase d’inclusion absente. Recette fonctionnelle connectée réalisée en CI avec API simulée, captures fictives dans assets.

## Livraison documentaire et archive

Le commit documentaire de clôture (cible du tag **v1.6.0**) conserve le code applicatif de cette fusion ; comparer src, supabase, tests, scripts et package/lock. Son déploiement doit servir le même bundle et la même empreinte. La release est créée par `.github/workflows/release-v1.6.0.yml`, seulement après succès de Quality sur son SHA exact.

Archive **Clementplane_v1.6.0_Sources.zip** du commit tagué : provenance SOURCE_COMMIT.txt, manifeste SHA-256 de chaque fichier, sidecar SHA-256. Le workflow télécharge les deux pièces jointes depuis la release et vérifie l’empreinte et l’ouverture du ZIP avant de réussir. Ne pas déclarer la clôture acquise tant que cette étape n’est pas réussie et le tag vérifié.

Release : https://github.com/Macor77/clementplane/releases/tag/v1.6.0. Aucun SQL, migration, changement de secret/drapeau ou déploiement Edge. Aucune écriture métier réelle ni message utilisateur. Aucun changement du mécanisme PWA, des calendriers ou du pilote Outlook.
