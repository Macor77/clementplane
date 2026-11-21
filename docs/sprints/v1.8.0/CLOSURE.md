# Dossier professionnel du formateur · V1.8.0

**Non clôturé — éléments restants.** Le code, les migrations, les tests et la préparation de livraison sont proposés en PR #29, branche feature/trainer-professional-dossier. Au point du 18 novembre, aucun document réel, envoi d’e-mail, achat ou déploiement de production n’avait été engagé pour ce sprint. État initial réel vérifié sur main c822db5c1d4154de333570c7e253bd49d0a3ddaf et Vercel dpl_8ouwBHyZP4byDea9YGg4TDiCcDok, V1.7.0. Le frontend de la candidate est désactivé par défaut.

Le 20 novembre, la liaison entre l’API, le validateur et ClamAV a été vérifiée sur le VPS FirstHeberg. Dans une instance temporaire distincte, trois comptes Supabase Auth ont servi à vérifier le dépôt privé, la reconnexion et le second facteur administrateur depuis Chromium. Le dépôt public reste fermé. [Résultats et périmètre des deux recettes](ACCEPTANCE.md)

Le 21 novembre, Vincent a vérifié sur le VPS FirstHeberg le partage et la révocation dans Chromium avec deux comptes fictifs et le validateur antivirus du serveur. Le téléchargement était identique avant révocation. La tentative suivante, depuis le même onglet, a reçu HTTP 404. La récupération des clés fictives depuis le Dropbox professionnel et la réception de l’alerte RAM du VPS ont réussi. La copie chiffrée des premières clés de production a été téléchargée depuis Dropbox et comparée avec succès à l’original. Le suivi individuel dans une invitation envoyée par l’API et l’annexe de sous-traitance FirstHeberg restent ouverts. La branche candidate reste en brouillon. [Point de pilotage](RETOUR_PILOTAGE.md)

| Obligation | État au 18 novembre 2026 |
|---|---|
| Périmètre, réalisation et sécurité | Candidate développée. Propriétaire seul en écriture, OF et invités en lecture sélective. [Audit, risques et décisions](AUDIT.md). Hors périmètre IA, fiche/planning, signature, authentification officielle et autres modules métier. |
| Recette et qualité | [Matrice et preuves](ACCEPTANCE.md). Intégration locale réelle, interface sur API simulée. Alerte élevée dans la chaîne npm de construction. |
| Base et services | Migrations additives du schéma documentaire et de compatibilité légale, services API/scan/worker préparés. Services de production et configuration examinés en lecture seule. Application et vérification des nouvelles migrations en recette hébergée puis en production à faire. |
| Confidentialité et RGPD | Textes candidats, registre et procédures révisés. [Rôles, contrats et réserves](LEGAL_REVIEW.md). Paramétrage effectif des fournisseurs et engagements contractuels encore ouverts. |
| Documentation, roadmap, changelog et version | V1.8.0 sur la branche, version affichée et package/lock, documentation fonctionnelle, architecture, base, dépannage, roadmap et changelogs actualisés. [Aide formateur et OF](GUIDE.md). Découvrir Clementplane intègre le tutoriel sous activation. Landing inchangée pendant la préparation. |
| Exploitation, coûts et conservation | [Préparation et retour arrière](OPERATIONS.md). Aucun service souscrit. [Durées proposées](../../rgpd/POLITIQUE_CONSERVATION.md). |
| Archive et publication | Archive de candidate produite depuis le SHA de PR, manifeste et SHA-256 vérifiés par le script. Procédure de tag/release finale préparée, conditionnée à une Quality réussie et à une instruction distincte sur main. Aucune release ni tag V1.8.0 publié. |
| Revue indépendante et communication | Périmètre de revue proposé. Aucune certification ou intervention externe. Aucun e-mail d’annonce autorisé ou envoyé. |
| Production et activation | En attente de résolution des risques, recette hébergée et accord explicite. Les décisions de production antérieures n’ont pas été réutilisées. |
| Pilotage | [Éléments à reprendre](RETOUR_PILOTAGE.md), en préservant le contrôle Outlook ouvert. |

[Pull request](https://github.com/Macor77/clementplane/pull/29) · [Production V1.7.0 de référence](https://vercel.com/formaplane/clementplane/8ouwBHyZP4byDea9YGg4TDiCcDok)
