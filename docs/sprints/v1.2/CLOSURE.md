# V1.2 — Livraison conditionnelle

**Développement préparé, recette réelle partielle, PR et release en brouillon. Production V1.1 inchangée.**

## Livré

Synchronisation volontaire Clementplane → Google Agenda : propositions, options, missions OF et personnelles, événements privés par journée, horaires, revalidation, historique et suppression des événements devenus sans objet. Rémunération et notes exclues par défaut ; aucun invité automatique.

OAuth serveur avec PKCE, jetons chiffrés, calendrier dédié, file durable, verrous, reprise, rapprochement périodique et réglages formateur. Le callback PWA couvre désormais les retours avec paramètres ; régressions et scénario sous contrôle d'un service worker réussis.

## Vérifié

Connexion Google réelle, premières journées personnelles, transitions de statuts avec identifiant stable, suppressions, annulation personnelle depuis l’interface, récupération d’une correspondance perdue, ajout/retrait de journées et conditions antérieures puis acceptées d'une revalidation. Mutation synchronisée après fermeture de l'onglet de recette. Options d'export activées puis remises à zéro via l'interface.

La livraison applicative dispose de 211 tests réussis et d'une CI complète réussie : sécurité SQL/RLS, audit, compilation et scénario PWA. Deux avertissements de lint préexistants. [ACCEPTANCE.md](ACCEPTANCE.md) distingue preuves serveur, observations Google et contrôles ouverts.

## Conditions de clôture

Inspection Google détaillée bloquée par le navigateur ; terminer descriptions, invités et confidentialité, partages avec comptes distincts, reconnexion et appareil PWA réel. Qualifier audience et exigences Google, protection des données et conservation des journaux du callback.

L'accès reste réservé aux testeurs. Fusion, migrations et déploiement de production, tag et publication de release nécessitent l'accord final prévu dans le mandat. Aucun accord de production n'est déduit de la recette.

Les preuves détaillées, références de déploiement et correspondances de migrations restent dans le rapport privé. Les anciennes archives sont des sauvegardes intermédiaires. Aucune nouvelle dépense engagée. Voir [OPERATIONS.md](OPERATIONS.md), [STAGING.md](STAGING.md) et [RETOUR_PILOTAGE.md](RETOUR_PILOTAGE.md).
