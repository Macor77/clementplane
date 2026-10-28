> **État courant — 28 octobre 2026 : pilote restreint activé en production, PR #19 fusionnée.** Recette personnelle réelle réussie ; report du test Microsoft 365 professionnel explicitement accepté par Vincent pour ce pilote. Aucune ouverture générale ni clôture. [Preuves et actions restantes](PILOT.md). Les états antérieurs ci-dessous sont historiques.

# Recette Microsoft — statut au 28 octobre 2026

Les tests automatisés utilisent des données fictives. **Recette Outlook personnelle démarrée le 28 octobre 2026**, dans la branche Supabase documentation-demo uniquement, avec un compte formateur fictif et le consentement du titulaire Outlook. La recette Microsoft 365 professionnelle reste non exécutée. Ne pas déduire sa compatibilité réelle des mocks ni du compte personnel.

Preuves personnelles : calendrier dédié créé ; deux événements privés et occupés synchronisés automatiquement à 10:40 UTC. Modification réelle à 10:48 UTC : horaire corrigé sur le même identifiant Graph, ancienne date retirée et nouvelle date créée sans doublon. Corps inspecté dans Outlook : lien vers la mission, aucun invité, note privée sentinelle absente. Voir REAL_ACCEPTANCE.md pour la trace actualisée.

Pour chacun des deux types de compte (Outlook personnel ; Microsoft 365 professionnel Exchange Online), relever commit/configuration/horodatage/résultat sans secrets :

| Parcours | Résultat attendu | Preuve actuelle |
|---|---|---|
| Consentement accepté/refusé | Connexion facultative ; refus explicite, pas d'activation | Personnel : accepté et state expiré rejeté ; professionnel/refus à faire |
| Première connexion | Un calendrier « Prénom Nom — Clementplane », distinct du principal | Personnel : calendrier distinct créé et visible dans Outlook |
| Reconnexion | Même identité et même calendrier ; aucun doublon | Personnel : déconnexion avec jeton effacé, reconnexion au même calendar_id réussie |
| Autre compte / autre utilisateur | Rejet, aucune écriture dans le calendrier d'autrui | Identité liée et index unique ; vérifier sur comptes de test |
| Proposition active / option acceptée | Privé, disponible ; expiration retirée | Personnel : proposition puis option observées Free/Privé ; expiration réelle à faire |
| Affectation / mission personnelle confirmée | Privé, occupé, sans invité | Personnel : mission personnelle et affectation OF fictive observées Busy/Privé |
| Plusieurs dates, horaires, journée entière, changement d'heure | Un événement par journée, heure Paris, fin exclusive journée entière | Tests projection et Graph ; réel à faire, notamment passage été/hiver |
| Modification / annulation / désaffectation | Mise à jour/retrait de la bonne copie | Personnel : horaire modifié, date déplacée, annulation retirée ; preuves REAL_ACCEPTANCE |
| Revalidation | Engagement précédent tant que réponse en attente ; retrait si refus/indisponible | Personnel : maintien ancien créneau puis nouvelle date après acceptation observés ; refus et interface OF réels à faire |
| Navigateur fermé | Modification fictive retrouvée après passage du cron | Cron installé en recette ; annulation réellement retirée avec Clementplane fermé |
| Double fournisseur | Deux connexions indépendantes ; déconnecter Microsoft ne touche pas Google | Tables et tests Google inchangés ; recette simultanée réelle à faire |
| Notes/rémunération | Exclues initialement ; activation et retrait sur confirmation serveur | Personnel : note sentinelle absente par défaut ; activation/retrait réel à faire |
| Confidentialité | Pas de notes OF internes, invités ou lecture des agendas personnels | Projection whitelist, propriété validée avant mutations ; inspecter événement réel et partages de test |
| Jeton révoqué/expiré et rotation | Reconnexion nécessaire ou renouvellement automatique ; pas de fuite | Tests worker/SQL/OAuth ; réel à faire |
| 429/5xx, réponse perdue | Backoff, récupération par marqueur, aucun POST aveugle ambigu | Tests automatisés ; ne pas provoquer de charge réelle |
| Déconnexion concurrente, callback rejoué, verrou expiré | Aucun callback ancien ne réactive la connexion ni ne crée de calendrier | Tests concurrence et PostgreSQL |
| Desktop/mobile/PWA | Contrôles accessibles, aucune largeur excédentaire, callback hors SPA | CI Chromium 1440/390, service worker ; appareil/PWA installée réelle à faire |

Après recette réussie, mettre à jour chaque ligne avec preuve datée. Les réserves doivent être explicitement acceptées par Vincent ; aucune réserve auto-acceptée. Aucune vraie mission client ne doit être supprimée pour cette campagne.
