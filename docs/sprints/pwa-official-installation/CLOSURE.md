# V1.3.1 — Installation depuis l’adresse officielle

## Situation et périmètre

Le 12 novembre 2026, une installation Android était liée à `clementplane-nfk75zfe1-formaplane.vercel.app`, déploiement individuel supprimé (404). L’adresse stable `https://app.clementplane.fr` expose les nouveautés ; Vincent confirme qu’une installation depuis cette adresse fonctionne.

Correctifs : parcours d’installation dirigé vers l’adresse officielle ; origine des liens d’e-mails de nouveautés fixée côté serveur, même pour les anciens clients ; aide mobile et FAQ actualisées. Les invitations transactionnelles utilisaient déjà la bonne adresse. Aucun changement de mission, bilan, droit, agenda ou base de données.

## Vérification et livraison

En cours sur branche isolée `fix/pwa-official-installation`. Le test du gestionnaire Edge a reproduit 6 échecs avant correction (adresse temporaire, externe et localhost, modes envoi et test). Les 10 cas passent après correction, sans aucun appel réel à Brevo ni écriture Supabase. Les parcours navigateur utilisent le bundle local et une API fictive, sous les origines simulées de production et de prévisualisation.

À compléter après CI : résultats finaux, revue, PR, commit, fonction Edge, déploiement Vercel et release.

## Exploitation et limites

- Déployer seulement `send-feature-announcement`, en conservant `verify_jwt: true`, puis l’interface ; aucune migration SQL.
- Pas de redirection globale des prévisualisations, ni transfert de paramètres ou session entre domaines.
- Le bouton intégré ne propose l’installation locale que sur `app.clementplane.fr`. Le menu natif du navigateur reste indépendant.
- Les anciennes PWA attachées à une autre origine ne reçoivent pas rétroactivement le correctif. Message de remplacement ponctuel préparé dans `COMMUNICATION.md`, non envoyé.
- Pas de nouveau suivi d’origine/version : les 8 comptes ayant utilisé la PWA ne sont pas automatiquement 8 comptes touchés.
- Repli : restaurer la version précédente du frontend et le fichier Edge du commit parent ; aucun retour arrière de données nécessaire. Préférer conserver la correction serveur, indépendante de l’interface.

## Revue documentaire et confidentialité

README, roadmaps, changelogs, décisions, architecture, fonctionnel, tests et aide produit actualisés. CGU, mentions légales, confidentialité, traceurs, registre, sous-traitants, conservation, droits et procédure de violation examinés au regard de ce périmètre : aucune catégorie, finalité, persistance, durée, destinataire ni prestataire supplémentaire ; aucune mise à jour juridique ou réacceptation requise par ce correctif. Authentification administrateur et préférences/désabonnement préservés. Aucun e-mail réel de recette.

## Retour au pilotage

Correction de fiabilité V1.3.1, sans lancement d’un nouveau lot fonctionnel. Le pilote Outlook reste restreint. Suivi restant : décision d’envoi du message, puis vérification des retours des utilisateurs ; ne pas assimiler publication technique et migration effective de toutes les anciennes installations.
