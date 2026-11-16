# Exploitation V1.6.0 — candidate

Frontend uniquement : aucun SQL, RPC, RLS, fonction Edge, secret, drapeau ou fournisseur à modifier. L’API et le stockage conservent leur total inclusif. Ne pas rejouer les migrations V1.5.0 déjà appliquées. Les anciens clients restent compatibles et montrent leur ancien total inclusif avec leur ancien libellé ; actualiser l’application pour bénéficier de la nouvelle saisie séparée.

La branche est feature/v1.6.0-separate-attendance. Publication après validation de Vincent : fusionner la PR vérifiée, contrôler Quality sur main et Vercel, vérifier la version 1.6.0 sur l’origine officielle, puis finaliser la documentation, le tag et la release avec archive du commit exact. À ce stade, aucune fusion ni publication en production autorisée pour V1.6.0.

Retour arrière : redéployer V1.5.1. Le stockage étant identique, aucun rollback de base ou recalcul destructif ; l’ancienne interface retrouvera son décompte inclusif. Surveiller les erreurs de sauvegarde et les bilans historiques ; ne jamais soustraire deux fois les participations partielles dans le service. Aucun changement du mécanisme PWA ou du pilote Outlook.
