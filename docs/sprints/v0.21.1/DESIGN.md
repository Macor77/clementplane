# Sprint v0.21.1 — agenda professionnel autonome

## Brief et autorisation
Le prompt du 5 octobre 2026 autorise audit, conception, implémentation, tests, branche, commits, push et PR autonomes. Fusion et production nécessitent un accord après présentation du résultat vérifié. Aucun message aux utilisateurs. Version cible imposée : v0.21.1.

## Audit
Base main : 97e13a1e6e68824dba77c5349d46951b5e0da588. Version UI v0.20.6, package 0.0.0, dernier tag v0.20.5. 148 tests passent avec les variables CI. Missions OF et dates séparées, propositions/affectations accessibles au formateur par RPC. Disponibilités déclarées distinctes des engagements. La dernière modification départage les déclarations OF/formateur. Clôture officielle : docs/ROADMAP.md, section « Méthode de clôture d’un sprint ». Supabase production inspecté en lecture ; migration tutorial_analytics présente dans git mais absente de l’historique distant. Branche documentation-demo signalée MIGRATIONS_FAILED ; ne pas la réinitialiser.

## Architecture retenue
Une table trainer_personal_missions privée, propriété trainer_id vérifiée par RLS, avec dates JSON validées côté serveur. Écriture atomique de toute la mission et des dates, UUID client stable pour empêcher une duplication après une réponse réseau perdue. Révision optimiste pour ne pas écraser une modification concurrente. Annulation conservée et horodatée. Aucune relation automatique à organizations : le carnet Mes OF ne sert qu’à recopier le nom privé du donneur d’ordre.

Alternative écartée : rendre nullable organization_id dans missions étendrait les nombreuses permissions, RPC et triggers OF avec un risque élevé de divulgation et de notification. Une table de dates séparée ajouterait une transaction RPC inutile pour les interventions courtes ; JSON conserve des dates/horaires explicites validés. L’engagement est dérivé des dates confirmées, jamais écrit dans les disponibilités manuelles. Réalisation et paiement sont hors périmètre.

Lecture commune par service trainerAgendaService : origine explicite, clés et liens distincts, mêmes listes et agenda. Les propositions restent dans leur service historique. Les RPC d’engagement existantes reçoivent les missions personnelles : détail uniquement au propriétaire ; agrégat neutre sans identifiant ni titre aux OF. Aucun trigger e-mail.

## Parcours
Intitulé et au moins une date requis ; horaires facultatifs par paire cohérente, lieu/formation/client/notes/rémunération complétables ensuite. Unité de rémunération explicite (mission/jour/heure, montant HT). Création, consultation, modification, annulation. Avertissements informatifs sur chevauchements et indisponibilités déclarées, sans blocage, selon règle existante de la roadmap. Une courte intervention bloque la journée partagée. Connexion requise, aucune promesse hors ligne.

## Validation
Tests comportementaux JS, exécution PostgreSQL isolée avec rôles et auth.uid pour RLS et mutations directes, conservation des disponibilités et engagements multiples, recette navigateur desktop/mobile sur données fictives, suite existante, build et PWA. Les simulations navigateur ne prouvent pas les permissions ; SQL les teste séparément. Toute recette distante non disponible doit rester explicitement non vérifiée.

## Clôture
Suivre la méthode du dépôt : recette, Supabase, doc, revue RGPD, roadmaps et changelogs, version, GitHub, déploiement et test en ligne après accord, tag, ZIP complet sans secrets, revue Découvrir/FAQ/tutoriels/évolutions, décision e-mail (proposé, aucun envoi). Release brouillon avant production. Ne pas déclarer le sprint clos tant que les gates restent ouverts.
