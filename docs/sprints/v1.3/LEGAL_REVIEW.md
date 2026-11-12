# Revue d’impact technique — 12 novembre 2026

| Élément | Décision et action |
|---|---|
| CGU | Cadre de suivi de mission et responsabilité des contenus inchangé. Aucun nouveau contrat, facturation ou acceptation tacite : explication dans le bilan et la notice. Version CGU conservée ; pas de réacceptation inventée. |
| Confidentialité | Notice 2026-11-12 : catégories, partage OF, privé, finalité, conservation et exclusions agendas. Compatibilité serveur avec notices antérieures pour clients en cache. |
| Mentions légales | Inchangées : exploitant, hébergeurs et contacts inchangés. |
| Traceurs/cookies | Inchangés : aucune nouvelle persistance locale ni télémétrie. Saisie en mémoire dans la page ; pas de nouveau cookie. |
| Registre | Traitement bilan/statistiques et catégories/destinataires ajoutés. |
| Sous-traitants / DPA | Aucun prestataire ni transfert supplémentaire. Supabase et Vercel existants. Aucun nouvel envoi Brevo/Google/Microsoft. Les contrats n’ont pas été renégociés ni certifiés dans ce sprint. |
| Conservation | Vie du compte pour historique professionnel, cascade compte/mission/formateur testée. Pas de durée fiscale/BPF inventée. |
| Droits | Inventaire des deux tables, filtrage propriétaire, exclusion du privé des réponses OF. |
| Violation | Procédure existante applicable ; nouveaux actifs à inclure dans toute analyse d’exposition. Aucune modification du canal ou des rôles nécessaire. |
| Minimisation | Aucun nom d’apprenant. Mention dans la saisie ; textes bornés ; données privées physiquement séparées. |
| Sécurité | RLS/RPC/grants testés localement et SQL hébergé sur documentation-demo ; aucun advisor relatif aux objets activity. Alertes préexistantes hors périmètre conservées, non assimilées à une certification. |

Cette revue décrit l’implémentation et les documents examinés ; ce n’est pas un avis juridique ni une certification des DPA historiques.
