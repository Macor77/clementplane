> **État courant — 28 octobre 2026 : pilote restreint activé en production, PR #19 fusionnée.** Recette personnelle réelle réussie ; report du test Microsoft 365 professionnel explicitement accepté par Vincent pour ce pilote. Aucune ouverture générale ni clôture. [Preuves et actions restantes](PILOT.md). Les états antérieurs ci-dessous sont historiques.

# Retour au pilotage — 28 octobre 2026

**Non clôturé.** L'intégration Microsoft est développée et testée avec API simulée ; CI finale verte (311 tests Vitest, 36 navigateur) ; configuration Entra, recette personnelle/professionnelle et livraison restent requises. Le sprint Google reste opérationnel ; aucune modification des fonctions ou tables Google en production.

## Intervention minimale du titulaire

- Entra : reprendre/créer l'application compatible organisations + comptes personnels, plateforme Web, callback exact `/microsoft-calendar-callback.html`, permissions déléguées définies dans OPERATIONS ; renseigner les secrets directement dans Supabase, jamais dans la conversation.
- Rendre disponibles deux comptes de recette autorisés (Outlook personnel et Microsoft 365 Exchange Online) et réaliser leurs consentements ; confirmer l'environnement isolé existant ou une recette restreinte sur l'origine de production sans ouverture publique. Aucun nouvel abonnement/projet payant n'a été créé.
- Vercel : autoriser le connecteur pour l'équipe formaplane via le lien de consentement fourni à la fin de session. Ce n'est pas une demande de réautorisation des opérations du sprint : le service refuse techniquement cet accès.
- Qualifier les conditions Microsoft et réglages de journaux applicables au flux avant ouverture ; voir LEGAL_REVIEW.

Le mandat de développement/fusion/déploiement déjà donné reste acquis. Il ne sera pas nécessaire de redonner « GO » pour chaque étape ; les tests réels conditionnent l'ouverture comme demandé.

## Prochaine séquence technique

Configurer environnement de recette et secrets → appliquer migrations ciblées → déployer les deux fonctions → scheduler et frontend restreints → recette ACCEPTANCE → corriger si nécessaire → vérifier CI/revue → version 1.3.0 → fusion/déploiement/ouverture contrôlée → tag/archive/release et preuve de téléchargement → bilan de clôture. Les références et preuves exactes sont dans DELIVERY.md.

Ne pas démarrer un autre sprint. Dette distincte : outillage npm à 4 vulnérabilités modérées et 5 faibles, deux warnings ESLint préexistants ; aucune high/critical au contrôle. Une montée majeure Vitest/PWA exige son propre travail de compatibilité.

## Communication préparée, non envoyée

Cible proposée après activation : formateurs disposant d'un compte Clementplane et éligibles aux communications produit. Ne pas solliciter les OF ni envoyer de campagne sans autorisation de Vincent.

Contenu proposé : « Vos missions Clementplane peuvent désormais rejoindre Outlook ou Microsoft 365. Dans vos paramètres formateur, connectez le compte de votre choix : les missions seront copiées dans un calendrier distinct, même lorsque Clementplane est fermé. Google Agenda reste disponible et les deux connexions peuvent coexister. La connexion est facultative ; vos rendez-vous personnels ne sont pas utilisés pour calculer vos disponibilités. »

Ce contenu ne doit pas être envoyé ni présenté comme disponible avant recette et ouverture. Pas d'envoi réalisé.
