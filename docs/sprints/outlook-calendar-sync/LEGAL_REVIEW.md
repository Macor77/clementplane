> **État courant — 28 octobre 2026 : pilote restreint activé en production, PR #19 fusionnée.** Recette personnelle réelle réussie ; report du test Microsoft 365 professionnel explicitement accepté par Vincent pour ce pilote. Aucune ouverture générale ni clôture. [Preuves et actions restantes](PILOT.md). Les états antérieurs ci-dessous sont historiques.

# Revue technique des impacts de confidentialité — 28 octobre 2026

État : préparée avant activation. Ce document constate les traitements et les changements documentaires ; il ne certifie pas des contrats Microsoft ou paramètres d'organisation non consultés.

| Obligation | Décision / action |
|---|---|
| Politique de confidentialité | Notice Microsoft ajoutée à LegalPage, affichée seulement avec le flag ; données, caractère facultatif, stockage chiffré, copies restantes, permissions étendues et limites de confidentialité exposés. Version 2026-10-28 ; migration accepte aussi les trois versions antérieures des clients en cache. |
| CGU | Pas de changement technique nécessaire : fonctionnalité facultative dans le service demandé, aucun changement tarifaire ou contractuel introduit. Qualification contractuelle externe à vérifier lors de la publication. |
| Mentions légales | Inchangées : opérateur, contact et hébergeur ne changent pas. |
| Cookies/traceurs | Notice de stockage session Microsoft ajoutée ; aucun traceur publicitaire, aucune donnée Microsoft envoyée aux analytics par cette intégration. Le code de retour est transitoire et l'URL nettoyée. |
| Registre | Ajout du flux Microsoft facultatif et des destinataires, distinct du Google Workspace de Clementplane. |
| Sous-traitants/DPA/transferts | Qualification des rôles et conditions personnelles/professionnelles Microsoft à vérifier avec le titulaire avant ouverture ; ne pas présumer qu'un compte choisi par un formateur relève du contrat Microsoft de Clementplane. Aucun contrat ni paramètre de tenant obtenu durant cette session. |
| Conservation | Jetons supprimés à la déconnexion ; marqueurs conservés pour reprise jusqu'à suppression du compte ; state valable 10 min, consommé une fois, nettoyage par worker actif ou nouvelle connexion/déconnexion. Copies distantes gérées par le titulaire. |
| Droits | Export des métadonnées utiles, exclusion des secrets ; suppression locale en cascade ; expliquer suppression/révocation chez Microsoft. |
| Violation | Périmètre élargi aux copies Microsoft, arrêt du worker dédié et retrait des accès ; aucun token dans les preuves d'incident. |
| Journaux amont | Headers callback no-store/no-referrer/CSP préparés ; pas de corps OAuth ni Graph journalisé par le code. Vérifier les paramètres d'hébergement/monitoring concernant URL et query strings avant ouverture ; ces headers ne garantissent pas l'absence de collecte par Vercel ou Microsoft. |
| Communication | Aucun message envoyé. Proposition d'annonce réservée aux formateurs après ouverture, à soumettre à Vincent ; pas d'envoi implicite autorisé. |

Points bloquant l'ouverture : recette technique réelle, configuration/consentement Entra, contrôle Vercel et qualification des conditions Microsoft applicables. Les réserves Google historiques ne valent pas acceptation des réserves Microsoft.
