# V1.5.0 — Participations partielles

Besoin : détailler les personnes ayant suivi une partie de la formation, dans un volet fermé par défaut. Décision utilisateur du 16 novembre : inclus dans le total.

- Une ligne : UUID stable, effectif entier positif, jours et heures connus ; une durée au moins. Pas de conversion automatique ni d’addition aux heures du formateur.
- Effectif cumulé <= total ; durée <= durée animée correspondante si connue. Deux décimales maximum. Ligne entièrement vide ignorée, zéro apprenant/durée refusé sur une ligne partielle.
- Une session = un groupe. Les anciens bilans à un groupe sont convertibles sans perdre leurs sessions ; multigroupes historiques conservés sans nouveau détail partiel.
- Même partage que la réalisation : OF commanditaire en lecture seule ; mission personnelle privée. Aucune identité d’apprenant.
- Enregistrement atomique avec le bilan, erreurs sans perte, contrôle révision et répétition inchangés. Ancien client refusé si présence d’un détail qu’il ne peut pas éditer.

Plan : inspecter UI/RPC/RLS ; ajouter modèle/validation/volet ; tester migration, permissions, sous-total, rechargement et mobile ; préparer PR et documentation ; recette hébergée puis publication uniquement avec les autorisations adaptées.
