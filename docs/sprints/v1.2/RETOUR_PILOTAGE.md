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

L’intégration Google Calendar a permis l’inspection détaillée des événements réels avec le compte propriétaire : propriétés privées, absence d’invités et rappels, disponibilités, retrait des champs optionnels, reprises et revalidation. Deux comptes lecteurs sont désignés ; leurs droits de consultation restent à tester après partage manuel. Restent également la reconnexion et la PWA sur appareil réel. Qualifier aussi audience Google, protection des données et journaux callback avant ouverture publique.

La prochaine étape produit est d'achever cette qualification. Outlook, iCloud, BPF et suivi d'activité restent hors sprint. Aucune nouvelle dépense engagée ; mesurer les quotas avant montée en charge. Références exactes et archives dans le dossier privé de livraison et la PR. Ne pas déclarer le sprint entièrement terminé.
