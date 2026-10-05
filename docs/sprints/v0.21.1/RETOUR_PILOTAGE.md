# Retour au pilotage — v0.21.1

Développé localement : création/consultation/modification/annulation de missions personnelles privées, dates multiples, client libre ou nom copié de Mes OF, notes et rémunération HT avec unité ; intégration Mes missions/Mon planning/accueil/disponibilités. Engagements quotidiens dérivés, alertes de chevauchement non bloquantes, compteurs de missions distinctes.

Branche : feature/v0.21.1-personal-missions. Commit d’implémentation : 48a9a6b. Commit documentaire suivant inclus dans SOURCE_COMMIT.txt de l’archive. Push bloqué par contrôle automatique du dépôt public ; PR, tag et release non créés. Notes et description PR préparées dans docs/sprints/v0.21.1.

Migration : 20261005113329_personal_trainer_missions.sql, exécutée uniquement sur PostgreSQL isolé (PGlite). Aucun environnement distant modifié. Recette connectée bloquée par refus automatique de modification de la branche documentation-demo (jqhbrkyeawtsuzrzrnvm). Production non fusionnée, non déployée, non vérifiée.

Tests : 157 tests Vitest verts ; SQL RLS/mutations/dates/engagements/effacement compte ; 3 tests navigateur verts (PWA, cycle personnel desktop/mobile avec API simulée), inspection visuelle. Build réussi ; lint 0 erreur/2 avertissements préexistants ; audit 0 high/critical et 3 moderate Vitest. Non-régression connectée OF et double espace restant à valider.

Décisions : modèle privé distinct du modèle OF, origine explicite dans la lecture d’agenda commune, dates JSON validées atomiquement, UUID stable, contrôle de révision, annulation terminale, pas d’envoi. Déclarations OF/formateur conservent la priorité de dernière modification existante.

Documentation : technique, fonctionnelle, base, décisions, README, changelogs, roadmaps, FAQ/Découvrir, tutoriel et capture fictive, confidentialité/registre/conservation/droits. Autres documents légaux revus sans changement identifié pour ce périmètre.

Archive de préparation : Clementplane_v0.21.1_Preparation.zip (source complète du commit, hors anciens ZIP/variables locales ; SOURCE_COMMIT.txt). Ce n’est pas une archive de sprint officiellement clos.

Suite logique : autorisation directe de publication sur le dépôt public et de migration/recette sur la branche de test ; recette connectée ; accord distinct de production ; migration, déploiement, vérification et clôture selon docs/ROADMAP.md. Ne pas démarrer la synchronisation d’agendas tant que ce socle n’est pas livré et vérifié. Aucun e-mail de nouveautés envoyé.
