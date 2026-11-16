# Exploitation — candidate

Migration source : `supabase/migrations/20261116065258_partial_trainer_attendance.sql`.

Base demo `jqhbrkyeawtsuzrzrnvm` inspectée avant changement : RLS actifs, dernière migration frais `20261115111417`, aucune ligne dans les tables de bilans. Après le refus initial du contrôle automatique, Vincent a explicitement autorisé le 16 novembre la migration sur démonstration et ses tests, sans production. Migration appliquée une seule fois sous `20261116095029` ; aucun db push global. Production `hctvkynrgmnxjynbncdi` non modifiée.

Recette `scripts/testing/partial-attendance-staging.sql` exécutée avec succès sur PostgreSQL hébergé : création, sous-total, modification d’un autre champ, suppression/réajout, répétition idempotente, refus des anciens clients, OF en lecture seule, autres OF/formateurs refusés et données privées séparées. Transaction fictive terminée par ROLLBACK. Aucun utilisateur/organisme de test restant ; tables bilans et privées vides avant et après. Conservation des anciens bilans non vides vérifiée par les tests de migration locaux.

Source déployée contrôlée par MD5 du corps des fonctions : `validate_partial_attendance` = `907354d0ca7760c74930712b036598b1`, `save_report` = `2930e393a1686ca6d32bb273c14eaacb`, identiques aux sources. Colonne JSONB non nulle, défaut `[]`. Politiques SELECT inchangées, UPDATE direct interdit aux authenticated, wrapper RPC invoker autorisé aux authenticated et interdit aux anon ; helper de validation inaccessible aux clients. Aucun nouveau trigger d’activité.

Advisors sécurité avant/après : mêmes constats, aucun nouveau, aucun sur activity. Dette historique : [23 RLS sans politique](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [2 search_path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [6 fonctions anon](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [86 fonctions authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Aucun élargissement des droits.

Étape restante : publication uniquement après accord spécifique. Appliquer cette seule migration en production après précontrôles non destructifs, puis frontend Vercel du bon commit. Aucun secret, job ni fonction Edge à ajouter. La recette SQL fictive est réservée à demo, jamais à production.

Ordre impératif : base avant frontend (les sélections demandent la nouvelle colonne). Retour arrière : conserver colonne et données, ne pas restaurer l’ancienne RPC qui effacerait la protection des détails. Un ancien frontend reçoit une demande d’actualisation pour les bilans comportant des participations partielles ; privilégier une correction en avant.

Surveillance : erreurs de chargement/save, REPORT_APP_UPDATE_REQUIRED, conflits de révision ; aucune journalisation du contenu privé. Aucun service externe sollicité, aucun coût récurrent ajouté.
