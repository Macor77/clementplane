# Distances inconnues — incident IGN du 12 novembre 2026

## Diagnostic vérifié

La fonction `geocode` de production (version 27, projet hctvkynrgmnxjynbncdi) est conforme au code de main. Les journaux du 12/11/2026 à 05:34:33, 05:36:26 et 05:36:57 UTC montrent des réponses IGN 504, propagées en HTTP 500. Un appel direct pour `75002 Paris` reproduit cette panne. Sans coordonnées du lieu, les distances des formateurs restent inconnues ; aucune coordonnée n'est inventée.

## Correctif préparé

En cas d'erreur HTTP, réseau ou JSON de l'IGN, tenter l'API publique `geo.api.gouv.fr/communes`. Une ville et/ou un code postal doivent identifier une seule commune ; noms comparés exactement après normalisation accents/ponctuation, code postal vérifié. Les adresses complètes, homonymes et coordonnées invalides ne donnent pas de résultat approximatif silencieux. Le libellé précise « centre de la commune » : ce sont toujours des distances à vol d'oiseau, avec une précision communale, pas un itinéraire routier ni le centre d'un arrondissement.

Le résultat normal IGN reste prioritaire. Un lieu explicitement introuvable ou de faible pertinence n'active pas le secours. Chaque appel fournisseur est limité à 10 secondes. Pas de modification des données, migrations, secrets, permissions ou dépendances. Contrôle de session inchangé avant les appels externes. Ne transmettre au fournisseur aucun jeton, identifiant utilisateur, nom de formateur ou contenu de mission ; seulement la recherche géographique. Pas de nouveau stockage ni traceur.

## Vérification

- Trois cas de secours échouaient avant correction (HTTP 504, exception réseau, ville seule), puis passent.
- 43 tests ciblés géocodage/distances passent.
- Suite complète : 328 tests, 56 fichiers passent avec les variables fictives de la CI. Premier lancement sans ces variables : deux suites ne pouvaient initialiser Supabase ; relance correctement configurée verte.
- ESLint : 0 erreur ; deux avertissements préexistants dans usePlanningAvailability et TrainerSearch.
- Build : réussi. Audit : 0 high/critical, 9 moderate et 3 low préexistantes ; aucune dépendance modifiée.
- Essai local du handler avec vrais appels HTTP : IGN 504 puis API communes 200 ; résultat `Paris (75002) — centre de la commune`, latitude 48.8589, longitude 2.347. Authentification simulée uniquement dans ce harnais ; aucune session réelle utilisée. Le délai initial de secours de 5 secondes était trop court dans cet environnement ; porté à 10 secondes et essai réussi.
- Recette en production et déploiement non réalisés à ce stade.

## Livraison et retour arrière

Correctif préparé en branche dédiée, sans ouverture générale Outlook ni nouvelle version produit. Après accord de publication : intégrer la PR, déployer uniquement `geocode` avec authentification conservée, puis vérifier un appel authentifié et les distances sur la mission. Retour arrière : redéployer le fichier antérieur, sans opération sur la base. Tant que cette étape n'est pas effectuée, le problème de production reste dépendant du rétablissement de l'IGN.

## Revue documentaire

Pas de nouvelle fonctionnalité, rôle ou parcours : FAQ/tutoriels/captures, évolutions envisagées et e-mail de nouveautés sans changement. Aucun e-mail envoyé. Le registre des flux géographiques et l'information sur leurs destinataires devront mentionner le secours public lors de la publication ; aucune garantie contractuelle de fournisseur n'est présumée. Ce correctif n'est pas déclaré clôturé ; déploiement, recette authentifiée et documentation de livraison restent à finaliser.
