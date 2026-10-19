# Conservation des saisies au retour sur un onglet

19 octobre 2026. Mandat : corriger la perte des informations non enregistrées lors du retour sur Clementplane. Base : a1f631d (V1.2.1). Branche : fix/preserve-forms-on-tab-return.

## Diagnostic et solution

Le SDK installé émet SIGNED_IN au retour visible. AuthProvider passait loading à true, démontant les formulaires protégés. Même après suppression de ce chargement, AccountRouter relançait une recherche de fiche formateur pour les OF à chaque nouvelle référence objet user et démontait à nouveau la page.

Réutiliser le contexte déjà chargé avec succès uniquement pour SIGNED_IN/TOKEN_REFRESHED du même identifiant. Les nouvelles connexions, changements de compte et déconnexions gardent leur traitement. Faire dépendre le routage de l'identifiant utilisateur plutôt que de l'objet renouvelé. Aucun changement de schéma, API, stockage de brouillon, permission ou dépendance.

## Acceptation

- Saisie conservée et même élément DOM après hidden → visible, OF et formateur, largeurs 1440 et 390.
- Déconnexion reçue depuis un autre onglet : formulaire privé retiré et retour à la connexion.
- Parcours de création/modification de mission personnelle et reprise des disponibilités conservés.
- Test ajouté à Quality pour chaque PR.

Hors périmètre : restauration après fermeture, rechargement complet ou éviction mémoire de l'onglet par le navigateur ; ces cas nécessiteraient un stockage de brouillons. Aucun enregistrement automatique ajouté.

Retour arrière : revert des modifications frontend, aucune migration à inverser. Version publiée : V1.2.2 (technique 1.2.2).
