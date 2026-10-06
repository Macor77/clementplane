# Retour au pilotage — v0.21.1

Développé et publié en branche de recette : création/consultation/modification/annulation de missions personnelles privées, dates multiples, client libre ou nom copié de Mes OF, notes et rémunération HT avec unité ; intégration Mes missions/Mon planning/accueil/disponibilités. Engagements quotidiens dérivés, alertes de chevauchement non bloquantes, compteurs de missions distinctes.

Branche : feature/v0.21.1-personal-missions. PR brouillon : https://github.com/Macor77/clementplane/pull/4. Référence exacte dans SOURCE_COMMIT.txt de l’archive. Aucune fusion, aucun tag final, aucune release de production.

Les deux migrations `20261005113329_personal_trainer_missions.sql` et `20261005135703_personal_missions_privacy_version_compatibility.sql` sont appliquées sur documentation-demo, après autorisation directe. La seconde évite une régression des inscriptions lors de la mise à jour de la notice. Production inchangée.

Tests : 157 tests Vitest ; SQL RLS/mutations/dates/engagements/effacement compte et compatibilité des inscriptions ; 3 tests navigateur simulés (PWA, cycle personnel desktop/mobile). API réelle CRUD/RLS, OF et double espace validés. Deux parcours navigateur connectés passent (1440/390 px), avec inspection visuelle et zéro appel de notification. Build réussi ; lint 0 erreur/2 avertissements préexistants ; audit 0 high/critical et 3 moderate Vitest.

Décisions : modèle privé distinct du modèle OF, origine explicite dans la lecture d’agenda commune, dates JSON validées atomiquement, UUID stable, contrôle de révision, annulation terminale, pas d’envoi. Déclarations OF/formateur conservent la priorité de dernière modification existante.

Documentation : technique, fonctionnelle, base, décisions, README, changelogs, roadmaps, FAQ/Découvrir, tutoriel et capture fictive, confidentialité/registre/conservation/droits. Autres documents légaux revus sans changement identifié pour ce périmètre.

Archive de préparation : Clementplane_v0.21.1_Preparation.zip (source complète du commit, hors anciens ZIP/variables locales ; SOURCE_COMMIT.txt). Ce n’est pas une archive de sprint officiellement clos.

Suite logique : vérifier la CI ; accord distinct de production ; migration, déploiement, vérification et clôture selon docs/ROADMAP.md. Ne pas démarrer la synchronisation d’agendas tant que ce socle n’est pas livré et vérifié. Aucun e-mail de nouveautés envoyé.
