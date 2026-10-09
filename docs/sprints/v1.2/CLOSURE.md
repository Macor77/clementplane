# V1.2 — Livraison conditionnelle

**Développement préparé, recette réelle partielle, PR et release en brouillon. Aucun déploiement de production par cette recette.**

## Livré

Synchronisation volontaire Clementplane → Google Agenda : propositions, options, missions OF et personnelles, événements privés par journée, horaires, revalidation, historique et suppression des événements devenus sans objet. Rémunération et notes exclues par défaut ; aucun invité automatique.

OAuth serveur avec PKCE, jetons chiffrés, calendrier dédié, file durable, verrous, reprise, rapprochement périodique et réglages formateur. Le callback PWA couvre désormais les retours avec paramètres ; régressions et scénario sous contrôle d'un service worker réussis.

## Vérifié

Connexion Google réelle, premières journées personnelles, transitions de statuts avec identifiant stable, suppressions, annulation personnelle depuis l’interface, récupération d’une correspondance perdue, ajout/retrait de journées et conditions antérieures puis acceptées d’une revalidation. Mutation synchronisée après fermeture de l’onglet de recette.

Lecture réelle Google côté propriétaire : événements privés sans invités ni rappels, disponibilités selon statut, descriptions et liens, ajout puis retrait des tarifs et notes. Modification manuelle restaurée, événement supprimé recréé, événement externe préservé puis nettoyé. Avertissement et créneau conservés pendant une revalidation, nouveau créneau après acceptation. Recherche finale : les trois événements attendus, sans doublon dans la fenêtre contrôlée. Les parcours d’interface et mutations serveur de fixtures sont distingués dans la recette.

Le 9 octobre, deux comptes distincts ont confirmé le masquage des détails privés en disponibilités uniquement et en lecture des détails. Propositions et options absentes chez ces lecteurs, missions confirmées réduites à « occupé » ; restauration de la fixture et synchronisation vérifiées. Le droit d’édition reste non testé, car indisponible dans le partage de recette.

La livraison applicative dispose de 211 tests réussis et d'une CI complète réussie : sécurité SQL/RLS, audit, compilation et scénario PWA. Deux avertissements de lint préexistants. [ACCEPTANCE.md](ACCEPTANCE.md) distingue preuves serveur, observations Google et contrôles ouverts.

Déconnexion et reconnexion du même propriétaire vérifiées le 9 octobre : jeton serveur supprimé, calendrier et événements préservés, puis synchronisation terminée sur les mêmes trois identifiants sans doublon dans la fenêtre contrôlée. Le retour expiré et le refus avant expiration ont été vérifiés séparément : aucune réactivation, message explicite pour le refus valide, puis reconnexion et cycle final réussis.

## Conditions de clôture

Lectures propriétaire, deux niveaux de consultation et déconnexion/reconnexion vérifiés. Terminer la PWA sur appareil réel ; qualifier les droits avancés dans un environnement autorisé ou faire accepter explicitement cette réserve avant clôture. Les observations de lecture ne prouvent pas la protection contre tous les droits avancés. Qualifier audience et exigences Google, protection des données et conservation des journaux du callback. Le contrôle du code et les limites d’accès sont consignés dans [PUBLICATION_READINESS.md](PUBLICATION_READINESS.md).

L'accès reste réservé aux testeurs. Fusion, migrations et déploiement de production, tag et publication de release nécessitent l'accord final prévu dans le mandat. Aucun accord de production n'est déduit de la recette.

Les preuves détaillées, références de déploiement et correspondances de migrations restent dans le rapport privé. Les anciennes archives sont des sauvegardes intermédiaires. Aucune nouvelle dépense engagée. Voir [OPERATIONS.md](OPERATIONS.md), [STAGING.md](STAGING.md) et [RETOUR_PILOTAGE.md](RETOUR_PILOTAGE.md).
