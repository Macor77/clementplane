# V1.3.1 — Installation depuis l’adresse officielle

## Situation et périmètre

Le 12 novembre 2026, une installation Android était liée à `clementplane-nfk75zfe1-formaplane.vercel.app`, déploiement individuel supprimé (404). L’adresse stable `https://app.clementplane.fr` expose les nouveautés ; Vincent confirme qu’une installation depuis cette adresse fonctionne.

Correctifs : parcours d’installation dirigé vers l’adresse officielle ; origine des liens d’e-mails de nouveautés fixée côté serveur, même pour les anciens clients ; aide mobile et FAQ actualisées. Les invitations transactionnelles utilisaient déjà la bonne adresse. Aucun changement de mission, bilan, droit, agenda ou base de données.

## Vérification et livraison

Correctif autorisé par Vincent (« peux-tu appliquer ces corrections »), livré le 12 novembre 2026. [PR #22](https://github.com/Macor77/clementplane/pull/22) fusionnée après contrôle du commit `c106debe64d1e3b3321202ee0678b7ad82c0b15f` ; commit applicatif de production `edef06c8828090abf7844e5e62c16a0d277b7277`.

- **Tests du défaut :** 6 échecs reproduits avant correction dans le véritable gestionnaire Edge (adresse temporaire, externe et localhost, modes envoi et test). Les 10 cas passent après correction, sans appel réel à Brevo ni écriture Supabase.
- **Qualité :** [exécution complète réussie](https://github.com/Macor77/clementplane/actions/runs/43197324711), 359 tests automatisés et 48 parcours navigateur. SQL/RLS missions, notices, agendas Google/Microsoft, revalidation et bilans réussis. Lint : aucune erreur, 2 avertissements préexistants. Build réussi ; audit sans vulnérabilité haute/critique, 12 alertes basses/modérées préexistantes conservées hors périmètre.
- **Recette mobile :** origines HTTPS officielle/temporaire servies depuis le bundle local, API fictive, Android et iOS simulés dans Chromium, mode standalone et création de mission. Captures fictives inspectées à 390 px : bouton lisible, aucun débordement. Il ne s’agit pas d’une nouvelle installation native testée sur un iPhone physique. Deux tests initiaux terminaient avant le chargement des ressources après navigation ; attente de l’interface d’arrivée ajoutée, recette finale entièrement verte.
- **Revue indépendante :** aucun défaut critique ou important ; chemin du dossier de clôture dans l’archive corrigé, observation de toutes les écritures simulées renforcée dans le test d’aperçu.
- **Serveur :** `send-feature-announcement` version 27 ACTIVE sur le projet `hctvkynrgmnxjynbncdi`, `verify_jwt=true`. Source relue après déploiement et identique au fichier revu ; empreinte de déploiement `c933f26736e5d52629ff646bd93d94b681f26a10128a870533260d93c90a3d14`. Requête anonyme refusée (401). Aucun envoi de recette.
- **Interface :** déploiement Vercel `dpl_9NuKf5yADCbgZiK1FhhN1zbTReNS`, production READY, commit `edef06c`, alias `app.clementplane.fr` vérifié.
- **Contrôle HTTP public :** page, manifeste, service worker et bundle répondent 200 sur l’adresse officielle. Bundle `/assets/index-QTJgi9Z6.js`, SHA-256 `e7f45b4b884d633b68176a7d9dfa6da8c05f73fbcdfecf39e3fcdf29e3bc1af8` : version V1.3.1, nouvelle action d’installation et routes création/statistiques présentes, `appBaseUrl` absent du frontend livré.
- **Sources :** archive candidate générée et vérifiée localement ; le workflow `Release V1.3.1 sources` publie le tag, la [release v1.3.1](https://github.com/Macor77/clementplane/releases/tag/v1.3.1), le ZIP exact et son SHA-256 après réussite de Quality sur le commit de clôture. Il retélécharge et contrôle l’archive publiée. `SOURCE_COMMIT.txt` pointe explicitement vers le présent dossier.

## Exploitation et limites

- Seule `send-feature-announcement` a été déployée côté Supabase, puis l’interface ; aucune migration SQL.
- Pas de redirection globale des prévisualisations, ni transfert de paramètres ou session entre domaines.
- Le bouton intégré ne propose l’installation locale que sur `app.clementplane.fr`. Le menu natif du navigateur reste indépendant.
- Les anciennes PWA attachées à une autre origine ne reçoivent pas rétroactivement le correctif. Message de remplacement ponctuel préparé dans `COMMUNICATION.md`, non envoyé.
- Pas de nouveau suivi d’origine/version : les 8 comptes ayant utilisé la PWA ne sont pas automatiquement 8 comptes touchés.
- Repli : restaurer la version précédente du frontend et le fichier Edge du commit parent ; aucun retour arrière de données nécessaire. Préférer conserver la correction serveur, indépendante de l’interface.

## Revue documentaire et confidentialité

README, roadmaps, changelogs, décisions, architecture, fonctionnel, tests et aide produit actualisés. CGU, mentions légales, confidentialité, traceurs, registre, sous-traitants, conservation, droits et procédure de violation examinés au regard de ce périmètre : aucune catégorie, finalité, persistance, durée, destinataire ni prestataire supplémentaire ; aucune mise à jour juridique ou réacceptation requise par ce correctif. Authentification administrateur et préférences/désabonnement préservés. Aucun e-mail réel de recette.

## Retour au pilotage

Correction de fiabilité V1.3.1 livrée, sans lancement d’un nouveau lot fonctionnel. Roadmap et aide produit actualisées. Le pilote Outlook reste restreint. Suivi restant : décision d’envoi du message, puis vérification des retours des utilisateurs ; ne pas assimiler publication technique et migration effective de toutes les anciennes installations.
