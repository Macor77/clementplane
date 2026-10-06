# Procédure d’exercice des droits

Canal : contact@clementplane.fr. Responsable opérationnel : direction Alter Prévention.

1. Enregistrer la date, l’identité déclarée, la demande et le canal.
2. Identifier les traitements concernés et le rôle de Clementplane (responsable ou sous-traitant pour un OF).
3. Ne demander un justificatif d’identité que si un doute raisonnable existe ; ne conserver que ce qui est nécessaire.
4. Traiter selon le droit invoqué : accès, rectification, effacement, limitation, portabilité lorsque applicable, opposition.
5. Répondre en principe sous un mois. En cas de demande complexe ou nombreuse, documenter toute prolongation permise et informer la personne dans le délai initial.
6. Si Clementplane agit pour le compte d’un OF, transmettre/assister l’OF concerné conformément au contrat et tracer l’action.
7. Conserver une preuve minimale du traitement de la demande et de la réponse.

## Missions personnelles — v0.21.1
Inclure `trainer_personal_missions` dans les demandes d’accès, de portabilité, de rectification et d’effacement, en filtrant par `owner_user_id` vérifié. Ne jamais transmettre ces lignes à un OF. La suppression définitive du compte Auth entraîne leur suppression en cascade ; la simple annulation d’une mission conserve sa trace. Les droits restent traités par la procédure existante, aucun export utilisateur automatique ajouté dans ce sprint.
