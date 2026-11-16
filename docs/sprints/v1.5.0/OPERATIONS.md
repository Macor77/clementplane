# Exploitation — candidate

Migration source : `supabase/migrations/20261116065258_partial_trainer_attendance.sql`.

Base demo `jqhbrkyeawtsuzrzrnvm` inspectée (RLS actifs, dernière migration frais `20261115111417`). Application refusée par le contrôle automatique le 16 novembre : autorisation explicite de mutation de cet environnement requise. Aucun DDL hébergé appliqué. Production `hctvkynrgmnxjynbncdi` inchangée.

Après autorisation : appliquer cette seule migration à demo, lancer la recette fictive transactionnelle avec ROLLBACK, vérifier politiques/droits/conservation/advisors. Historique divergent connu : aucun db push global. Répéter en production seulement après accord de publication et vérifications non destructives, puis frontend Vercel du bon commit. Aucun secret, job ni fonction Edge à ajouter.

Ordre impératif : base avant frontend (les sélections demandent la nouvelle colonne). Retour arrière : conserver colonne et données, ne pas restaurer l’ancienne RPC qui effacerait la protection des détails. Un ancien frontend reçoit une demande d’actualisation pour les bilans comportant des participations partielles ; privilégier une correction en avant.

Surveillance : erreurs de chargement/save, REPORT_APP_UPDATE_REQUIRED, conflits de révision ; aucune journalisation du contenu privé. Aucun service externe sollicité, aucun coût récurrent ajouté.
