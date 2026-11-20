# Retour au pilotage · Dossier professionnel

**Sprint non clôturé.** La V1.8.0 candidate est sur la PR #29 en brouillon. La production observée reste la V1.7.0. La clarification de Vincent réserve toute intégration ou modification des pièces au formateur propriétaire. Le rôle de l’OF est limité à la consultation et au téléchargement de la sélection partagée.

## Point du 20 novembre 2026

Le VPS FirstHeberg accueille l’API documentaire privée, le validateur et l’antivirus. La recette des dépôts fictifs est passée sur cet hôte. Le parcours navigateur a ensuite réussi sur une instance Supabase Auth isolée avec trois comptes fictifs. Le propriétaire a retrouvé et téléchargé sa pièce. Le deuxième formateur a vu son dossier vide. L’administrateur a dû valider son second facteur pour accéder au dossier. La réception des courriels et des alertes de supervision sur l’infrastructure cible reste à vérifier. [Résultats des deux recettes](ACCEPTANCE.md)

Le 20 novembre, les deux messages de test Brevo ont été reçus dans Gmail. Le lien et le code reçus ont servi à vérifier le téléchargement et la révocation dans la recette privée. Le prochain contrôle de messagerie porte sur l’envoi automatique depuis le worker du VPS et l’ouverture du lien HTTPS depuis un appareil externe. Avant ouverture, attester la sauvegarde de la base et des clés, la réception des alertes mémoire et les réglages de confidentialité du prestataire de messagerie. Le contrôle npm de la candidate ne signale plus d’alerte élevée. [Constats de mise en service](ACCEPTANCE.md)

## Point du 18 novembre 2026

Le prochain travail utile est la recette hébergée sur données fictives, avec MFA, cycle de sauvegarde et vérification Brevo. Vincent a retenu un hôte de recette OVHcloud de 8 Go en France et demandé une alerte mémoire. Le configurateur du VPS-2 ne proposait aucun site français le 18 novembre. Vincent a décidé d’attendre le point de stock du vendredi 20 novembre. La location temporaire de 48 heures est suspendue. Un contrôle ponctuel avec compte rendu privé est programmé, sans commande. Garder 8 Go comme référence en développement et en production. Le suivi mémoire est préparé sur la branche. Tout abonnement de production ou dépassement demande un nouvel accord. L’activation et la réception sur la boîte de l’opérateur restent à vérifier sur la machine livrée. Les trois rôles documentaires retenus à titre conservatoire correspondent aux libellés existants Propriétaire, Administrateur et Dirigeant. Toute extension de cette lecture demande un arbitrage. L’alerte de chaîne de construction et les garanties fournisseurs restent ouvertes.

Aucun message général prévu. Aucun tag ni release finale pour cette candidate. Ne pas reprendre la production sur un simple feu vert budgétaire. Le suivi Outlook, les missions et les statistiques restent gérés dans leurs sprints respectifs.
