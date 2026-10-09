# Retour au pilotage — V1.2

La synchronisation Google est développée et fonctionne dans l'environnement de test autorisé. Connexion réelle, calendrier dédié, missions personnelles multidates et transitions serveur vérifiés. Le défaut de callback PWA est corrigé.

## Décisions

- Clementplane → calendrier dédié uniquement ; aucune lecture des rendez-vous personnels.
- Événements privés ; propositions/options disponibles, missions confirmées occupées.
- Rémunération et notes sur choix distincts, désactivés par défaut.
- Aucun invité automatique ; partage Google contrôlé par le formateur.
- Traitement serveur et essais sur données métier fictives.

## Livraison et limites

Préversion et tests disponibles, PR et release en brouillon, aucun déploiement de production par cette recette. Aucun tag V1.2 public ni annonce générale. Les trois migrations calendrier sont vérifiées en recette ; correspondances historiques conservées en privé.

CI applicative réussie. Contrôles réels : identifiants stables, suppressions selon les statuts, changements de journées, revalidation et mutation après fermeture de l'onglet de recette. Voir ACCEPTANCE.md pour la portée exacte.

L’intégration Google Calendar a permis l’inspection détaillée des événements réels avec le compte propriétaire : propriétés privées, absence d’invités et rappels, disponibilités, retrait des champs optionnels, reprises et revalidation. Le 9 octobre, deux comptes Google distincts ont confirmé le masquage des détails privés en disponibilités seules et en lecture des détails. Propositions/options absentes et créneaux libres ; missions confirmées « occupé ». Statut initial de la fixture restauré et synchronisation contrôlée.

La session Clementplane a été réauthentifiée. Déconnexion puis reconnexion du même propriétaire vérifiées : jeton serveur retiré, calendrier et événements conservés, reprise achevée sans doublon sur les mêmes identifiants. L’annulation effectuée après expiration et le refus dans le délai de validité ont été vérifiés séparément, sans réactivation. Le second affiche le message explicite attendu. La reconnexion finale est opérationnelle.

Le droit d’édition reste non testé : options grisées chez le titulaire, restriction Workspace probable. Aucun réglage d’organisation ni partage modifié par l’agent. Restent la PWA sur appareil réel, l’audience Google, la protection des données et les journaux callback avant ouverture publique. Le code et les documents de confidentialité sont cohérents sur les copies et leur conservation ; cela ne certifie ni les contrats ni les paramètres des fournisseurs. Voir PUBLICATION_READINESS.md pour le protocole et les accès manquants.

La prochaine étape produit est d'achever cette qualification. Outlook, iCloud, BPF et suivi d'activité restent hors sprint. Aucune nouvelle dépense engagée ; mesurer les quotas avant montée en charge. Références exactes et archives dans le dossier privé de livraison et la PR. Ne pas déclarer le sprint entièrement terminé.
