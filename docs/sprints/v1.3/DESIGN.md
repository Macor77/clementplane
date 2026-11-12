# V1.3 — Suivi des réalisations et premières statistiques formateur

Mandat validé le 12 novembre 2026 : document utilisateur joint. Production non autorisée. Base auditée : main 6bd565404d3c9f7a9b7ffa07eae85b5cbcd6d940 ; Vercel dpl_5ZMnNYVkHjufnW8RMNjgyFbVgey5 READY. Version précédente 1.2.4, cible 1.3.0. Outlook pilote hors périmètre.

## Données et accès
Deux tables additives : `trainer_activity_reports` (partagée seulement pour une mission OF) et `trainer_activity_private` (dépenses, kilomètres, difficultés, propriétaire seul). Sessions/journées JSON validées et reconstruites côté serveur par liste de champs autorisés. Une mutation atomique vérifie le titulaire, l'affectation pour créer un bilan OF, une révision optimiste et un UUID de mutation pour reprise après réponse perdue. Pas de modification des tables de planning ni des files de messages/calendriers. Suppression en cascade du compte ou de la mission. RPC publique invoker, implémentation definer à search_path vide dans un schéma non exposé, droits explicites et contrôles auth. Tables en lecture uniquement pour authenticated, RLS sans accès privé OF.

Une session par défaut sans effectif ni réalisation. Une session = un groupe, plusieurs journées possibles ; plusieurs groupes peuvent partager une date. Durée prévue pédagogique saisie séparément : les horaires contractuels sont affichés en référence, jamais convertis en durée réelle. Sessions/dates indépendantes du contrat, pas de modification silencieuse du planning.

Tarif source photographié au premier enregistrement par le serveur et jamais réécrit : mission personnelle explicitement HT, unité mission/jour/heure conservée. Préremplissage du montant total uniquement pour l'unité mission. Pour une mission OF, le schéma actuel ne documente pas HT/TTC/unité : affichage de la source sans conversion ni préremplissage. Saisie déclarative distincte avec HT/TTC obligatoire si montant renseigné. Les tarifs futurs inconnus/à unité horaire ou journalière sont signalés sans conversion arbitraire.

Distance : `distanceService.js` utilise Haversine depuis les coordonnées du lieu cible (mission ou ville recherchée) vers celles du formateur (adresse/ville selon géocodage). Distance géographique aller simple, pas routière. Aucun préremplissage kilométrique ; valeur réelle totale privée saisie et jamais recalculée.

## Comptage et périodes
Date métier : Europe/Paris. Journées réalisées explicites uniquement, au plus à la date du jour ; futures = date >= aujourd'hui et état à renseigner sur mission confirmée. Une journée réalisée/non réalisée est exclue du futur. Propositions/options séparées. Dates passées inconnues signalées à compléter.
Heures : date effective de chaque journée. Sessions/missions : distinctes dans chaque vue/période avec au moins une journée admissible ; leurs nombres ne sont donc pas additifs entre périodes. Participations : une fois par session à sa première journée réalisée, même si le bilan est incomplet ; indication des sessions dont l'effectif est affecté hors période. Effectifs prévus (facultatifs, saisis par session) : première date prévue seulement, jamais multipliés par journée. Tarifs futurs : montant total connu de la mission personnelle à la première date contractuelle, jamais proratisé ni répété ; les autres montants sont indiqués non totalisables. Aucun total financier réalisé, aucune rentabilité, aucun BPF.

## Plan et validation
1. Migration additive, RLS/RPC et tests SQL isolés PGlite avec rôles réels (schéma de dépendances minimal).
2. Modèle de calcul testé, service, formulaire intégré aux deux fiches et lecture OF.
3. Page Réalisé / À venir, liste À compléter et navigation mobile.
4. Tests navigateur desktop/mobile API simulée, échec réseau, zéro/vide, sauvegarde sans notifications ; tests existants et CI.
5. Documentation produit, technique, aide, RGPD, exploitation, release préparée, PR brouillon. Demande d'accord de production seulement après préparation.

L'unique branche Supabase de démonstration est MIGRATIONS_FAILED (lecture du 12/11). Aucun reset ni migration distante automatique. Les tests SQL locaux ne prouvent pas un déploiement Supabase. Historique distant divergent des noms sources pour les migrations anciennes : appliquer uniquement la nouvelle migration, jamais db push global.
