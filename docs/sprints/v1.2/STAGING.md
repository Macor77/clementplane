# V1.2 — Recette isolée

## Périmètre

Base isolée, comptes Clementplane fictifs et compte Google propriétaire autorisé. Aucune mission de production modifiée. Identifiants, URL propres aux environnements, correspondances de versions et relevés précis conservés en privé.

## Prérequis

Trois migrations calendrier appliquées en recette : tables/file, notice de confidentialité, accès minimal du rôle serveur. Comparer les contenus des anciennes migrations dont les identifiants locaux et distants diffèrent ; ne pas les rejouer.

Fonctions Edge, paramètres et scheduler configurés ; appels sans authentification refusés. Le rôle serveur dispose des cinq colonnes de lecture et trois RPC nécessaires. Aucun accès navigateur aux jetons.

## Vérification

Contrôles SQL d’isolation et de droits, connexion réelle et cycles Google réussis. Mutations limitées aux fixtures dédiées. Contrôler les identifiants et suppressions après achèvement du moteur, pas sur la simple mise en file. Les propriétés et descriptions distantes ont ensuite été inspectées via Google Calendar avec le compte propriétaire du seul calendrier de recette. Deux sessions Google distinctes ont confirmé les vues en disponibilités seules et en lecture des détails. Le cas d’édition reste non testé : les autorisations sont indisponibles dans le partage. Aucune modification des règles d’organisation pour contourner cette limite.

## Sécurité

Le 9 octobre, la déconnexion via Clementplane a retiré le jeton serveur et conservé les trois événements Google. La reconnexion du même propriétaire a repris sur le calendrier existant ; cycle terminé sans erreur et identifiants inchangés. Le retour d’une annulation après expiration et un refus dans le délai de validité ont été rejetés sans réactivation. Le message de refus explicite est observé, puis la reconnexion finale a terminé son cycle sur les mêmes événements. Aucun changement de fixture ni de partage pendant ce contrôle.

Ne lire ni exporter jetons, secrets, en-têtes ou corps OAuth. Ne pas exposer les schémas réseau/Vault. Vérifier les rôles et RPC privilégiés avant installation ailleurs. Aucun partage avec un tiers ni modification automatique des permissions Google.

Les limites d’inspection et contrôles ouverts figurent dans [ACCEPTANCE.md](ACCEPTANCE.md). Cette recette ne modifie pas la production et ne vaut pas accord de publication.
