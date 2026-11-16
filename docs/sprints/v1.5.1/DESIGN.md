# V1.5.1 — Bilan compact et aides contextuelles

Mandat du 16 novembre 2026 : après proposition d’une aide « ? » avec fenêtre refermable, Vincent a confirmé « OK. C’est parti. ». Développement autorisé ; la validation de production précédente concernait V1.5.0. Base : `86832b7c5712ae1d05e52e44401f79c6d542ec34`.

Le formateur doit saisir plus rapidement sur mobile tout en retrouvant toutes les explications. Conserver les labels/unités, les mentions Privé / Visible par l’OF, l’inclusion des apprenants partiels et les alertes liées aux données. Les exemples et explications permanentes passent dans des aides par rubrique (bilan, partage/tarif, réalisation, présences partielles, privé, dépenses, kilométrage). Aucun changement de champs, de sauvegarde, de statistiques, de groupes ou de permissions.

Approche retenue dans l’échange : aides au clic. Un texte toujours affiché garderait le problème de défilement ; une bulle au survol serait inadaptée au tactile. Choix d’implémentation : dialog HTML natif dans un portail, fond inerte, focus restitué au déclencheur, fermeture par bouton/Echap/fond. Une fenêtre centrée sur ordinateur devient un panneau en bas du mobile ; en-tête fixe et texte défilable. Aucun ajout de dépendance. L’aide des présences partielles se trouve dans le volet ouvert, sans bouton interactif imbriqué dans son résumé.

Plan : inspecter composants/données/sécurité et instructions ; déplacer les explications sans modifier les services ; vérifier navigation clavier/tactile, états propres/modifiés/erreur, enregistrement/rechargement ; revue indépendante ; CI et captures fictives ; PR brouillon et archive candidate ; publication seulement après validation.

État ultérieur : production autorisée explicitement par Vincent le 16 novembre 2026 (« Vas-y. Tu peux mettre en production. »), puis PR #26 fusionnée. Le cadrage ci-dessus décrit l’étape initiale.
