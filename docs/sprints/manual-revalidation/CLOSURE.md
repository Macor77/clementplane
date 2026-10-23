# V1.2.4 — Non clôturé, publication en attente

État au 23 octobre 2026. Code applicatif local : 74ed48f, branche feature/manual-mission-revalidation. Aucune migration ni modification de mission appliquée en production.

| Obligation | État / preuve / reste |
|---|---|
| Périmètre | Vérifié localement : confirmation individuelle après tout canal initial, accord explicite, journal OF et canal, affectation conservée, ancien lien bloqué. |
| Développement | Commit local 74ed48f ; publication bloquée par validation automatique. |
| Recette | 247 tests Vitest ; SQL métier et sécurité ; 2 tests Chromium 1440/390 px avec API fictive. Pas de test sur appareil PWA réel ni modification d’une mission client. |
| Supabase | Historique distant consulté ; migration dédiée préparée seulement. Permissions et effets testés dans PGlite. Contrôle RPC déployée restant. |
| Qualité/CI | Build réussi, lint 0 erreur/2 warnings préexistants ; audit sous seuil high avec 3 avis modérés Vitest. CI distante non déclenchée. |
| Production | Non déployée. Lecture Vercel équipe formaplane refusée 403 ; rétablir accès ou obtenir preuve de déploiement fiable. |
| Documentation | README, fonctionnel, architecture, base, décisions, tests, exploitation actualisés ; dossier de sprint présent. |
| Légal/RGPD | Revue technique LEGAL_REVIEW.md ; registre précisé, autres documents inchangés avec justification. |
| Roadmap | Préparation explicitement signalée, pas de statut livré. |
| Changelog / notes | Préparés pour 1.2.4. |
| Version affichée | package, lockfile, Découvrir : 1.2.4 locale ; production inchangée. |
| GitHub | Push refusé : accord explicite pour transfert du code demandé par auto-review. PR et fusion non réalisées. |
| Tag / archive / release | Workflow prêt à partir du commit main contrôlé ; pas de tag/release publiés. |
| Évolutions envisagées | Revue : pas de retrait nécessaire pour cette amélioration du fonctionnement existant. |
| Découvrir | FAQ ajoutée ; captures/tutoriels existants non invalidés ; landing inchangée. |
| Communication | E-mail nouveautés non nécessaire pour cette amélioration ciblée ; aide contextuelle/FAQ suffisantes. Aucun envoi. |
| Pilotage | RETOUR_PILOTAGE.md ; sprint non clôturé jusqu’à livraison/vérification. |

Revue indépendante sans défaut bloquant. Suivis mineurs : contention avec annulation simultanée (transaction annulée, reprise manuelle) ; libellé historique côté formateur général mais auteur OF distinct. Aucun risque de corruption détecté ; concurrence réelle PostgreSQL non testée par PGlite.

Action minimale : autoriser explicitement le push vers https://github.com/Macor77/clementplane, création de PR puis publication. L’autorisation ne résout pas à elle seule l’accès Vercel refusé : contrôler l’accès à l’équipe formaplane avant de déclarer la production vérifiée.

Vérification finale : suite navigateur CI complète exécutée localement avec Chromium et API fictive : 20/20 tests réussis (26,5 s). Archive locale du commit 105cfbb : 551 fichiers, intégrité vérifiée, SHA-256 ce7606eb98414aecefbc71ceb81409ca1531ef6aa34bf9a2d0b8cbc6d1c99fd5 ; archive de prépublication, aucune release publiée.
