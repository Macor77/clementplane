# Exploitation V1.6.0 — publiée

Frontend uniquement : aucun SQL, RPC, RLS, fonction Edge, secret, drapeau ou fournisseur à modifier. L’API et le stockage conservent leur total inclusif. Ne pas rejouer les migrations V1.5.0 déjà appliquées. Les anciens clients restent compatibles et montrent leur ancien total inclusif avec leur ancien libellé ; actualiser l’application pour bénéficier de la saisie séparée.

Publication explicitement autorisée par Vincent le 16 novembre 2026. PR #27 fusionnée ; Vercel production READY et V1.6.0 servie sur l’origine officielle vérifiés. Références et contrôles dans PRODUCTION.md. Le workflow release-v1.6.0 attend Quality réussi sur le commit documentaire exact avant de créer tag, release et archive, puis vérifie le téléchargement de l’archive jointe.

Retour arrière : redéployer V1.5.1. Stockage identique, aucune restauration de base ou opération destructive ; l’ancienne interface retrouve son décompte inclusif. Surveiller les erreurs de sauvegarde et les bilans historiques ; ne jamais soustraire deux fois les participations partielles dans le service. Aucun changement du mécanisme PWA ou du pilote Outlook.

Recette : Quality 43873670898 et 43874641015, 413 tests unitaires/contrats et 67 parcours navigateur, captures fictives examinées ; contrôles SQL/RLS PGlite réussis. Portée : API simulée et mobile émulé, production contrôlée sans écriture de données réelles. Pas de recette sur smartphone physique/PWA installée dans cette livraison.
