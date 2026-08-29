# Registre des traitements — Clementplane

Responsable de traitement : Alter Prévention. Contact : contact@clementplane.fr. Version : 29/08/2026.

| Traitement | Personnes / données principales | Finalité | Base principale | Destinataires / outils | Conservation |
|---|---|---|---|---|---|
| Comptes et authentification | utilisateurs, identité, e-mail, données Auth | créer/sécuriser le compte | exécution CGU, intérêt légitime sécurité | Supabase | vie du compte + délais nécessaires |
| Réseau OF / formateurs | formateurs, identité pro, coordonnées, relation OF, notes/tarifs privés OF | gérer le réseau professionnel | intérêt légitime / exécution du service | Supabase, membres OF autorisés | durée de la relation/besoin professionnel, revue périodique |
| Disponibilités et missions | formateurs, OF, planning, propositions, réponses | planification et collaboration | exécution du service / intérêt légitime | Supabase, parties autorisées | durée utile opérationnelle puis historique nécessaire |
| E-mails opérationnels | destinataire, type, statut, identifiants techniques | délivrance, preuve technique, diagnostic | exécution du service / intérêt légitime | Brevo, Supabase | logs techniques max. 12 mois |
| Support / contact | identité, e-mail, message, suivi interne | répondre et suivre les demandes | mesures précontractuelles / intérêt légitime | Supabase, Google Workspace selon besoin | demandes clôturées max. 3 ans |
| Mesure produit | utilisateur, événement, contexte, métadonnées minimisées | comprendre l’usage et améliorer le service | intérêt légitime | Supabase | max. 12 mois |
| Erreurs techniques | utilisateur éventuel, erreur, chemin, user-agent, stack limitée | sécurité et diagnostic | intérêt légitime | Supabase | max. 6 mois |
| Anti-abus formulaire | empreinte SHA-256 IP/e-mail, compteur, fenêtre | prévenir spam et abus | intérêt légitime | Supabase Edge/DB | purge > 24 h |
| Nouveautés produit | utilisateurs éligibles, statut d’envoi/désabonnement | informer sur les nouveautés | intérêt légitime avec opposition/désabonnement | Brevo, Supabase | pendant relation + preuve d’opposition nécessaire |

## Mesures principales
RLS et contrôles d’autorisation, séparation des rôles, admin plateforme restreint, fonctions serveur pour opérations sensibles, liens publics à jetons et expiration, journalisation ciblée, minimisation des données visibles entre organismes.
