# Retour au pilotage · Dossier professionnel

**Sprint non clôturé.** La V1.8.0 candidate est sur la PR #29 en brouillon. La production observée reste la V1.7.0. La clarification de Vincent réserve toute intégration ou modification des pièces au formateur propriétaire. Le rôle de l’OF est limité à la consultation et au téléchargement de la sélection partagée.

## Partage vérifié sur le VPS FirstHeberg · 21 novembre 2026

Le test exécuté par Vincent a réuni Chromium, les comptes fictifs du formateur et de l’organisme, et le validateur antivirus du VPS. Le fichier reçu était identique à celui téléchargé par le formateur. Dès la révocation, une nouvelle tentative de téléchargement dans l’onglet de l’organisme a reçu HTTP 404. L’environnement temporaire a été supprimé.

Pour préparer l’ouverture, il reste notamment à vérifier le suivi dans une invitation réellement envoyée par l’API après le changement de réglage Brevo et à obtenir l’annexe de sous-traitance demandée à FirstHeberg. [Preuve et périmètre du test](ACCEPTANCE.md)

## Confidentialité et récupération du 21 novembre 2026

Vincent a choisi un suivi Brevo limité aux contacts consentants et une archive de clés chiffrée dans son Dropbox professionnel, avec la phrase de passe conservée séparément. Les deux réglages Brevo ont été enregistrés puis relus. Le consentement de la boîte d’essai était non renseigné. À 12 h 38 min 05 s, heure de Paris, Gmail a reçu l’unique essai envoyé par l’éditeur de modèles. Le HTML d’origine contenait un lien direct vers l’accueil et aucune image. Dans le MIME reçu, le lien passe par le domaine de redirection Brevo et une image distante a été ajoutée. Cela ne permet pas de conclure à une mesure individuelle ni de valider l’envoi du worker, qui utilise l’API et transmet explicitement le refus de suivi. Le modèle de recette est inactif.

Une archive OpenPGP de clés fictives a été récupérée depuis le dossier Clementplane du Dropbox professionnel. Son empreinte correspondait à l’original. La mauvaise phrase a été refusée. La bonne a permis de relire deux PDF chiffrés avec deux générations de clés et de vérifier la clé HMAC. Le même jour, la première archive de clés de production retenue pour l’ouverture a été sauvegardée dans le Dropbox professionnel. Après téléchargement, son empreinte et son contenu chiffré correspondaient à l’original. [Référence de l’archive](OPERATIONS.md)

Le partage formateur vers un OF a réussi dans Chromium sur la branche candidate. Le téléchargement a été refusé dès la révocation dans l’onglet déjà ouvert. [Exécution sur comptes fictifs](https://github.com/Macor77/clementplane/actions/runs/44901114884/job/136837017553)

## Point du 21 novembre 2026

Vincent a ouvert et téléchargé le PDF reçu sur son téléphone en 5G après l’envoi depuis FirstHeberg. Sur la candidate, deux comptes fictifs authentifiés ont ensuite permis de vérifier le partage vers un OF et la perte d’accès immédiate à la révocation. Une restauration en base isolée a restitué la pièce à l’identique avec une clé récupérée séparément. Supabase affiche sept sauvegardes physiques. La plus récente précède la migration du dossier.

La surveillance mémoire tourne sur le VPS avec le démarrage automatique activé. Gmail a reçu l’unique alerte de test émise par Monit depuis le VPS via Brevo à 12 h 20 min 55 s, heure de Paris.

Avant l’ouverture, vérifier le parcours sur la configuration hébergée retenue, la garde hors VPS des clés et le comportement du suivi dans un e-mail Brevo après décision sur le réglage du compte. Le serveur de messagerie de FirstHeberg a rejeté la demande d’accord de sous-traitance du 21 novembre pour destinataire inconnu. Le même jour à 11 h 33, heure de Paris, Gmail a confirmé un nouvel envoi à l’adresse de contact général. La prise en charge par l’hébergeur reste à confirmer. [Résultats de recette](ACCEPTANCE.md)

## Point du 20 novembre 2026

Le VPS FirstHeberg accueille l’API documentaire privée, le validateur et l’antivirus. La recette des dépôts fictifs est passée sur cet hôte. Le parcours navigateur a ensuite réussi sur une instance Supabase Auth isolée avec trois comptes fictifs. Le propriétaire a retrouvé et téléchargé sa pièce. Le deuxième formateur a vu son dossier vide. L’administrateur a dû valider son second facteur pour accéder au dossier. La réception des courriels et des alertes de supervision sur l’infrastructure cible reste à vérifier. [Résultats des deux recettes](ACCEPTANCE.md)

Le 20 novembre, les deux messages de test Brevo ont été reçus dans Gmail. Le lien et le code reçus ont servi à vérifier le téléchargement et la révocation dans la recette privée. Le prochain contrôle de messagerie porte sur l’envoi automatique depuis le worker du VPS et l’ouverture du lien HTTPS depuis un appareil externe. Avant ouverture, attester la sauvegarde de la base et des clés, la réception des alertes mémoire et les réglages de confidentialité du prestataire de messagerie. Le contrôle npm de la candidate ne signale plus d’alerte élevée. [Constats de mise en service](ACCEPTANCE.md)

## Point du 18 novembre 2026

Le prochain travail utile est la recette hébergée sur données fictives, avec MFA, cycle de sauvegarde et vérification Brevo. Vincent a retenu un hôte de recette OVHcloud de 8 Go en France et demandé une alerte mémoire. Le configurateur du VPS-2 ne proposait aucun site français le 18 novembre. Vincent a décidé d’attendre le point de stock du vendredi 20 novembre. La location temporaire de 48 heures est suspendue. Un contrôle ponctuel avec compte rendu privé est programmé, sans commande. Garder 8 Go comme référence en développement et en production. Le suivi mémoire est préparé sur la branche. Tout abonnement de production ou dépassement demande un nouvel accord. L’activation et la réception sur la boîte de l’opérateur restent à vérifier sur la machine livrée. Les trois rôles documentaires retenus à titre conservatoire correspondent aux libellés existants Propriétaire, Administrateur et Dirigeant. Toute extension de cette lecture demande un arbitrage. L’alerte de chaîne de construction et les garanties fournisseurs restent ouvertes.

Aucun message général prévu. Aucun tag ni release finale pour cette candidate. Ne pas reprendre la production sur un simple feu vert budgétaire. Le suivi Outlook, les missions et les statistiques restent gérés dans leurs sprints respectifs.
