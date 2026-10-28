> **État courant — 28 octobre 2026 : pilote restreint activé en production, PR #19 fusionnée.** Recette personnelle réelle réussie ; report du test Microsoft 365 professionnel explicitement accepté par Vincent pour ce pilote. Aucune ouverture générale ni clôture. [Preuves et actions restantes](PILOT.md). Les états antérieurs ci-dessous sont historiques.

# Recette réelle Outlook personnel — 28 octobre 2026

**État : recette personnelle partielle réussie, Microsoft 365 professionnel non testé, aucune activation publique.** Les réserves de la matrice ACCEPTANCE restent ouvertes hors des lignes documentées ici.

## Environnement et périmètre

Branche existante `feature/outlook-calendar-sync`, PR #19. Frontend de recette protégé sur l'alias Vercel de cette branche ; Supabase `documentation-demo` (`jqhbrkyeawtsuzrzrnvm`). Mode serveur `testing`, allowlist limitée au compte fictif « Vincent Recette Outlook ». Titulaire Microsoft personnel consentant. Aucune mission client réelle utilisée ni modifiée. Version de production conservée à 1.2.4.

Les heures ci-dessous proviennent de la base distante, en UTC (Paris : UTC+1 à cette date). La fixture personnelle porte le titre « RECETTE OUTLOOK — CLIENT FICTIF », la formation « Test synchronisation sans client réel », une localisation fictive à Paris et une note sentinelle confidentielle. Elle a été insérée par SQL en recette : la saisie des dates via le navigateur de contrôle ne persistait pas dans le formulaire ; la création UI n'est donc pas déclarée validée.

## Résultats observés

| Parcours | Résultat et preuve |
|---|---|
| OAuth personnel | Consentement explicite, compte personnel accepté. Premier state expiré rejeté ; nouvelle tentative réussie sans relâcher les dix minutes. Connexion active, présence du jeton chiffré contrôlée sans lire sa valeur. |
| Calendrier distinct | « Vincent Recette Outlook — Clementplane » visible dans Outlook, distinct du calendrier principal. |
| Création multi-date | À 10:40:06, deux mappings actifs, versions source/synchronisée 3/3, aucune erreur. Dates 30 octobre 09:00–12:00 et 2 novembre 14:00–17:00. |
| Confidentialité | Fiche réelle inspectée dans Outlook : privé, occupé, aucun participant, rappel désactivé, lien vers la bonne mission de recette ; note sentinelle absente, options notes/rémunération désactivées. Lecture limitée au calendrier dédié. |
| Modification horaire | À 10:48:06, 30 octobre modifié en 10:00–12:30 ; empreinte de l'identifiant Graph inchangée. Valeur visible dans Outlook. |
| Déplacement date | Ancien 2 novembre marqué supprimé ; nouveau 3 novembre 14:30–17:30 visible dans Outlook. Deux mappings actifs, sans doublon, versions 5/5, aucune erreur. |
| Annulation et application fermée | Clementplane remplacé par about:blank avant l'annulation SQL de la seule fixture. À 10:50:05, versions 7/7, zéro mapping actif, aucune erreur. Outlook affiche zéro événement dans le calendrier dédié en novembre. |
| Déconnexion | Action UI puis confirmation : statut disconnected, jeton local supprimé, identifiant calendrier conservé. |
| Reconnexion | Même compte choisi via connexion sécurisée. Retour UI « Outlook est connecté », statut active, jeton chiffré présent. Empreinte SHA-256 du calendar_id strictement identique avant/après : `2841f619211ec3a6b47b24504d78d5a4785e93a95d96b4add929244102c39080`. Aucun nouveau calendrier créé. |

## Worker et sécurité de recette

- Clé worker dédiée générée aléatoirement dans Vault, jamais affichée ; aucune clé de service ni jeton Microsoft dans le navigateur.
- RPC `microsoft_calendar_authorize_worker(text)` : résultat booléen uniquement, SECURITY DEFINER à search_path vide, exécution refusée à anon/authenticated et autorisée au service_role ; absence ou doublon de clé refusés.
- Migration distante `20261028103423_microsoft_calendar_worker_vault_auth` (fichier local `20261028160000_microsoft_calendar_worker_vault_auth.sql` : ne pas rejouer sous un autre timestamp).
- Worker de recette v9 déployé, bundle SHA-256 `7f31529b55cd5ecc502fb7f8653334dda016470a0b7626ad6dfa7c816e7012b3`.
- Scheduler distant `20261028103615_microsoft_calendar_staging_scheduler`, une minute. Google inchangé.
- Vérification réelle : Data API refuse le schéma net (406/PGRST106) ; rôles navigateur/service_role sans LOGIN ; pas de RPC publique exportant les files réseau. Vault ne reçoit aucun nouveau droit de lecture pour les navigateurs.

## Vérifications et réserves

- Après changement Vault : Vitest 56 fichiers / 318 tests réussis, test SQL Microsoft et vérifications de droits Vault réussis, ESLint zéro erreur/deux avertissements préexistants, build Vite/PWA réussi. CI Quality 40675890864 réussie sur le code 2dbe8b7 ; détail dans DELIVERY.md, dont un test de navigation préexistant réussi seulement au retry.
- Les tests automatiques couvrent propositions/options, revalidation, isolation, erreurs Graph, limites, concurrence et Google ; ils ne constituent pas une recette réelle de ces scénarios.
- Reste : Microsoft 365 professionnel avec boîte Exchange Online et politique permettant le consentement ; double fournisseur réel ; validation des actions OF/revalidation via leurs interfaces (états SQL testés ci-dessous) ; PWA installée et validation UI native des dates. Aucun compte professionnel utilisable n'est actuellement établi.
- Pas de fusion, tag, release, archive de version livrée ni activation publique avant levée des conditions de recette. Aucun e-mail d'annonce.


## Complément métier réel — fixture OF isolée

Un organisme et une mission entièrement fictifs ont été créés uniquement dans documentation-demo, sans appel aux fonctions d'envoi. Les états métier ont été préparés par SQL ; le transport Graph, la projection serveur et les événements Outlook sont réels. Ceci ne valide pas l'interface OF ni les e-mails métier.

- 5 novembre 09:00–12:00 : proposition visible « Proposition à répondre », **Free / Privé** (cycle 10:57 UTC).
- Acceptation en option : titre « Option en attente de confirmation », **Free / Privé** (cycle 10:58 UTC).
- Affectation et confirmation : « Mission confirmée », **Busy / Privé**.
- Demande de revalidation en attente : ancien 5 novembre 09:00–12:00 conservé, titre « Modification à revalider », toujours occupé.
- Acceptation et application : remplacement par le 6 novembre 10:00–13:00, sans l'avertissement de revalidation, toujours privé/occupé.
- Désaffectation : zéro événement restant dans Outlook ; base à 11:01:21 UTC : versions 35/35, aucune erreur, zéro mapping actif.
- Le bouton UI « Relancer la synchronisation » a mis le travail en attente ; le cron l'a traité. Pour les dernières transitions de revalidation/désaffectation, le même worker a aussi été appelé directement via pg_net, clé restant dans Vault. La preuve du cron sans application ouverte reste l'annulation personnelle précédente.

Les deux fixtures sont conservées en base de recette pour audit ; la mission personnelle est annulée et la relation OF est annulée. Aucun événement de test actif ne subsiste.
