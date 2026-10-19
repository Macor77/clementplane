# Retour au pilotage — V1.2.2 clôturée

19 octobre 2026. Perte des saisies au retour sur un onglet corrigée dans les espaces OF et formateur. Deux causes : chargement global sur SIGNED_IN et routage OF dépendant de la référence objet user.

Livraison : PR #14, commit applicatif c0444870edd45ea0bbd5c7fc303e6d7edce49762, production Vercel READY, tag/release v1.2.2, archive vérifiée après téléchargement. CI : 226 tests et 18 scénarios navigateur ; contrôle du frontend déployé : 4 scénarios de conservation/déconnexion et version affichée, API fictive. Voir CLOSURE.md pour toutes les références et limites.

Aucun changement SQL/RLS, aucune migration, aucun e-mail. Documents et roadmap synchronisés. Deux warnings lint et dépendances Vitest modérées préexistants consignés ; mise à jour d'outillage à prévoir séparément. Fermeture/rechargement complet et persistance de brouillons hors périmètre. Prochaine priorité à arbitrer dans le pilotage ; aucun nouveau sprint démarré.
