# Sprint 19 — Socle mobile et navigation responsive

## Objectif
Rendre le squelette commun de Formaplane agréable sur smartphone sans modifier le comportement desktop existant ni refondre chaque page métier à ce stade.

## Comportement desktop
À partir de 721 px, la sidebar OF/Formateur actuelle reste affichée et la structure existante est conservée.

## Comportement mobile
À 720 px et moins, la sidebar disparaît. Un header mobile fixe en haut affiche le logo Formaplane, le nom de l'espace actif et un bouton menu. Le contenu principal occupe toute la largeur avec des marges adaptées au téléphone.

Le bouton menu ouvre un drawer plein hauteur depuis la gauche avec :
- toutes les rubriques de l'espace actif, dans le même ordre que la sidebar desktop ;
- l'identité de l'utilisateur / organisme dans le footer ;
- changement d'espace lorsque l'autre espace est disponible ;
- déconnexion.

Le drawer se ferme avec le bouton de fermeture, un clic sur l'overlay, la touche Échap ou après navigation vers une rubrique.

## Accessibilité et ergonomie
Les contrôles tactiles principaux font au moins 44 px de haut. Le bouton menu possède un libellé accessible et expose son état ouvert/fermé. Quand le drawer est ouvert, le scroll du body est bloqué.

## Hors périmètre
Cette étape ne refond pas encore les pages Dashboard, disponibilités, missions, formulaires ou calendriers pour mobile. Elle fournit uniquement le socle de navigation responsive sur lequel ces écrans seront adaptés ensuite.
