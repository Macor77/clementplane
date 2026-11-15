# Recette V1.4.0 — validée puis publiée

- 389 tests Vitest réussis, dont 20 nouveaux cas dépenses et 31 cas bilan/service.
- ESLint : aucune erreur, deux avertissements préexistants (usePlanningAvailability et TrainerSearch).
- Build de production réussi ; avertissement de bundle volumineux préexistant.
- SQL PGlite : les trois suites bilan passent. Migration vérifiée pour ancien montant/texte, zéro, aucun frais, texte sans montant, exactitude 0,10+0,20, édition/suppression, archives, non-duplication, CAS/reprise, transaction refusée sans modification, requêtes falsifiées, ancien client, droits propriétaire/OF/tiers/anonyme, absence de trigger agenda et structure d’agrégation future.
- PostgreSQL hébergé documentation-demo : recette scripts/testing/trainer-expenses-staging.sql réussie, transaction fictive annulée. Advisors sécurité inchangés.
- Revue indépendante : aucun défaut concret identifié. Nouveau bilan après migration vérifié en mémoire en complément.
- CI Quality [43708276988](https://github.com/Macor77/clementplane/actions/runs/43708276988), commit b750ded : 389 tests unitaires, toutes les suites SQL du projet, audit, build et 53 parcours Chromium réussis. Les quatre nouveaux parcours couvrent 1440/768/390 px et une ancienne saisie sans montant. API simulées et identités fictives ; la preuve SQL hébergée couvre les véritables droits serveur.
- Captures bureau/tablette/mobile inspectées : lignes lisibles, commandes accessibles, total visible et absence de débordement horizontal. La prise mobile de la section seule recouvrait son titre avec la barre fixe ; la capture finale est prise en page entière depuis le haut pour conserver tout le contexte réel.
- Vérification agenda renforcée : le test de projection existant inclut les dépenses/archives/kms/difficultés et vérifie leur exclusion, même lorsque le partage des notes et du tarif est activé. Test ciblé réussi.
- Audit : 12 vulnérabilités historiques (3 faibles, 9 modérées), aucune haute/critique ; aucune dépendance ajoutée.
- Archive candidate produite par Quality : 660 fichiers et manifeste vérifiés automatiquement. La CI archive le commit de fusion de recette de la PR, pas une fusion dans main. Chaque archive contient SOURCE_COMMIT.txt et son propre checksum ; aucun tag/release de production.
- CI finale du candidat [43708788416](https://github.com/Macor77/clementplane/actions/runs/43708788416) réussie sur ce996a97 : 389 unitaires, 53 parcours, toutes suites SQL, audit, build. Publication autorisée ensuite ; contrôles de production dans PRODUCTION.md. La clôture ne modifie que documentation et workflow de release.
- Limites : pas de saisie réelle en production, pas de test matériel iOS/Android installé ni de mesure de forte concurrence PostgreSQL. Le verrou transactionnel et le mécanisme CAS existants sont conservés.
