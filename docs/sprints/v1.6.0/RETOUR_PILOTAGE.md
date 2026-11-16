# Retour au pilotage — V1.6.0 candidate

Le besoin est traité : saisie et consultation distinguent les apprenants entièrement formés et partiellement formés ; total des participants automatique. Les durées par personne sont préservées. Les statistiques affichent les deux effectifs et leur total sans augmenter les heures animées.

Développement/revue et recette terminés : 413 tests unitaires/contrats, 67 parcours navigateur, toutes les suites SQL/RLS, lint, audit et build réussis (Quality 43873670898). PR #27 en brouillon ; preview READY protégée. Captures fictives examinées et archive candidate téléchargée/vérifiée, détails dans ACCEPTANCE. Aucune migration ni modification des permissions. Production, tag et release définitifs attendent validation ; V1.5.1 reste la version publiée. Verdict : non clôturé, livraison restante.

Points de vigilance : anciens bilans simples interprétés à partir des lignes partielles effectivement renseignées ; anciens détaillés sans répartition signalés séparément ; pas de conversion des jours en heures. La future aide au BPF devra traiter les heures inconnues et les sessions traversant les périodes. Ne pas lancer ce chantier automatiquement. Pilote Outlook inchangé.
