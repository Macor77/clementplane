# Clementplane v0.21.1 — L’agenda autonome du formateur

Livrée le 6 octobre 2026 sur https://www.clementplane.fr.

## Nouveautés
- Ajout, consultation, modification et annulation de missions personnelles privées, avec plusieurs dates, horaires, lieu, notes et rémunération HT facultative.
- Intégration à Mes missions, Mon planning, l’accueil et aux disponibilités ; compteurs par mission distincte et avertissements de chevauchement.
- Formation comme titre principal ; client final et donneur d’ordre affichés séparément ; adresse structurée sans répétition.
- Proposition d’ajout du donneur d’ordre dans Mes OF, avec formulaire ouvert et nom prérempli.
- Confidentialité : les OF voient une indisponibilité neutre, jamais les détails privés ; aucun contact averti automatiquement.
- FAQ, tutoriel, information de confidentialité et documentation actualisés.

## Validation
159 tests Vitest (33 fichiers), 3 tests Playwright en CI (PWA, ordinateur et mobile), tests SQL/RLS et inscriptions, build réussi. Lint : 0 erreur, 2 avertissements préexistants. CI après fusion : https://github.com/Macor77/clementplane/actions/runs/37449273527.

Trois migrations appliquées avant le frontend ; droits vérifiés. PR : https://github.com/Macor77/clementplane/pull/4. Commit applicatif livré : 55ba895abaa23ca92d63b5bf9ef9f4f9b50ce0d7 ; le tag inclut ensuite la clôture documentaire sans changement applicatif.

## Archive et limites
L’archive complète du sprint contient les sources et documents du commit indiqué dans SOURCE_COMMIT.txt, hors secrets locaux et anciennes archives. La correspondance entre migrations sources et versions distantes est détaillée dans CLOSURE.md : ne pas réappliquer aveuglément ces migrations.

Synchronisation Google/Outlook/Apple, statistiques/BPF, facturation et suivi des paiements hors périmètre. Aucun e-mail de nouveautés envoyé.
