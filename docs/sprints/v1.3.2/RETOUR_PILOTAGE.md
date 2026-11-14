# Retour au pilotage — V1.3.2, 14 novembre 2026

La simplification demandée est livrée : une mission = une session = un groupe, intitulé non modifiable dans le bilan, apprenants effectivement formés, jours/heures réels indépendants. Les demi-journées sont possibles ; aucun effectif ni durée pédagogique prévisionnels à saisir. Les anciens détails restent conservés et les anciens groupes distincts restent corrigeables.

PR #23 fusionnée, application a611276b déployée, migration production 20261114200754. Tests : 367 unitaires, 49 navigateur, SQL réel en recette, contrôles production non destructifs. PRODUCTION.md, ACCEPTANCE.md et release v1.3.2 donnent les preuves.

Suite proposée : observer la compréhension et la complétude du formulaire simplifié avant les statistiques approfondies/BPF. Ne pas rouvrir le multi-groupe sans nouveau besoin explicite. Les totaux simples sont affectés à une seule date ; la ventilation détaillée par année reste une éventuelle évolution. Aucun prochain sprint démarré. Le pilote Outlook et les anciennes limites de sauvegarde/contrats/purge ne sont ni étendus ni clôturés par ce correctif.
