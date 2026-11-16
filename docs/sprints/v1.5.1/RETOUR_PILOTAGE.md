# Retour au pilotage — V1.5.1 candidate validée

Besoin traité : moins de défilement pour renseigner le bilan sur mobile, avec toutes les explications dans les aides « ? ». Panneau mobile et fenêtre desktop ; mentions essentielles visibles. Dans le scénario comparatif 390 px, la page passe de 3 963 à 3 222 px (-18,7 %).

Commit applicatif `873d3ffde95f253b14c0f68c6898bc01a0a44f97`, PR #26 brouillon. Quality `43857208016` réussie : 406 unitaires, 63 navigateur, SQL/RLS, audit et build. Captures fictives contrôlées, revue indépendante sans anomalie importante. Archive candidate téléchargée et vérifiée (ACCEPTANCE.md).

Données, permissions, réalisations, tarifs, dépenses, kilomètres et statistiques conservent leur fonctionnement. Aucune migration ni communication externe. Pas de test sur smartphone physique ni de parcours de production ; prévisualisation Vercel READY protégée par connexion. Les avertissements de qualité préexistants sont détaillés dans ACCEPTANCE.md.

Restant : validation de publication par Vincent, puis livraison et clôture. Aucun tag/release de production créé. Suite proposée : observer le confort de saisie, puis reprendre les priorités existantes, dont les statistiques des frais, seulement si demandé. Aucun autre sprint lancé.
