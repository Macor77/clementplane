# V1.5.0 — Clôture de livraison, 16 novembre 2026

Volet des apprenants partiellement formés, inclus dans le total selon la décision de Vincent. Démonstration puis production explicitement autorisées. PR #25 fusionnée : `9cad9cb3881afcaad5892b4541899282e26242a1`. Version 1.5.0 dans package/lock/UI. Le tag v1.5.0 vise le commit documentaire de clôture, de code applicatif identique.

| Obligation | Résultat / preuve | Portée et reste |
|---|---|---|
| Volet fermé, lignes effectifs/jours/heures | Implémenté, cinq nouveaux parcours navigateur | Desktop/tablette/mobile 1440/768/390 px |
| Sous-total inclus, pas de sessions/heures doublées | Validations client/serveur, 17 tests unitaires ajoutés | Une session = un groupe ; statistiques inchangées |
| Édition, suppression, rechargement et erreurs | Sauvegarde atomique/révision/retry, autres champs conservés | 406 unitaires et 58 parcours ; API navigateur simulée |
| Anciens bilans et clients | Migration additive, groupes historiques conservés, ancien client protégé | Trois bilans production intacts, empreintes PRODUCTION.md |
| Permissions et confidentialité | RLS propriétaire/OF/tiers sur PostgreSQL demo, droits prod identiques | Frais/km/difficultés privés ; aucun nom d’apprenant |
| Supabase | Source 20261116065258, demo 20261116095029, prod 20261116095526 | Aucun rejeu ni db push global nécessaire |
| Qualité et sécurité | Quality candidat 43843828444, main 43844346720 ; contrôle exact avant release | Deux warnings Hooks, gros bundle et 12 vulnérabilités faibles/modérées préexistants |
| Production et version | Vercel dpl_7HG3PCycKrE7Bz5ToU6kQ6FB9aJb READY, asset V1.5.0/HTTP 200 | Non destructif, aucune donnée réelle saisie |
| Accessibilité / mobile / PWA | Summary clavier, réouverture sur erreur, captures fictives examinées | PWA physique non testée ; mécanisme inchangé |
| Documentation | README, fonctionnel, architecture, base, décisions, tests, dépannage, guide/exploitation | Racine/docs synchronisés |
| Légal/RGPD | LEGAL_REVIEW : mêmes finalités/destinataires, pas de traceur/sous-traitant ajouté | Registre complété ; autres textes/procédures inchangés avec motif |
| Découvrir / FAQ / tutos / landing | Guide et FAQ intégrés actualisés, sous-total/durée par personne expliqués | Pas de nouvelle promesse landing ; captures fictives uniquement |
| Évolutions envisagées | Aucun item du volet à retirer, statistiques/BPF restent ultérieurs | Aucun nouvel engagement ajouté |
| GitHub / tag / archive / release | PR intégrée, workflow release-v1.5.0 après Quality du commit exact | ZIP/manifeste puis téléchargement et vérification requis |
| Communication | Aide intégrée et notes suffisantes pour ce changement ciblé | Aucun e-mail ni message autorisé/envoyé |
| Pilotage | RETOUR_PILOTAGE à jour | Aucun prochain sprint automatique |

Verdict : **clôturé** lorsque le workflow de release du commit est réussi et les pièces jointes vérifiées. Ce contrôle est requis avant le compte rendu final ; une intention de publication ne vaut pas preuve.

Limites : navigateur API simulée, PostgreSQL réel en démonstration, production sans écriture métier. Aucun test matériel ou restauration fournisseur revendiqué. Pilote Outlook inchangé. Les anciens bilans multigroupes restent correctibles dans leur structure historique ; le nouveau volet concerne les bilans à un groupe.

[PR #25](https://github.com/Macor77/clementplane/pull/25) · [Release v1.5.0](https://github.com/Macor77/clementplane/releases/tag/v1.5.0). Détails : DESIGN, ACCEPTANCE, OPERATIONS, PRODUCTION, GUIDE, LEGAL_REVIEW, COMMUNICATION.
