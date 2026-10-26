# Téléchargement du modèle d’import des formateurs — 26 octobre 2026

## Diagnostic

Le bouton demandait `/templates/Clementplane_Modele_Import_Formateurs_v1_1.xlsx`, absent du dossier public. Le fichier livré s’appelle encore `Formaplane_Modele_Import_Formateurs_v1_1.xlsx`. La route de secours SPA renvoie alors index.html, ce qui correspond au fichier transmis dans le signalement.

## Correction préparée

Le lien utilise le fichier existant. Le nom proposé au téléchargement reste Clementplane. Le classeur, ses colonnes et le traitement d’import ne changent pas. Son contenu utilise encore l’ancien nom Formaplane ; sa refonte éditoriale est hors périmètre de ce correctif ciblé.

## Vérifications locales

- Test de régression observé en échec avant correction (cible absente), puis réussi : présence réelle du fichier, signature ZIP/XLSX, ouverture et 12 colonnes attendues.
- Suite Vitest : 47 fichiers, 248 tests réussis avec les variables fictives de la CI. Le premier lancement sans variables échouait dans monitoringService.test.js et trainerAvailabilityShareService.test.js (supabaseUrl requis).
- Build réussi ; cible présente dans dist et classeur ZIP valide (12 854 octets). Avertissement existant concernant la taille du bundle.
- ESLint du nouveau test et git diff --check réussis.
- Aucun test navigateur ni contrôle du téléchargement de production exécuté à ce stade.

## Impacts et livraison

Aucun changement de données, de droits, de service externe ou de Supabase. Aucun changement nécessaire des documents légaux/RGPD, tutoriels ou captures : comportement déjà décrit restauré. Aucun message envoyé aux utilisateurs.

État : correction préparée sur branche, non déployée, non clôturée comme sprint. La fusion et la vérification du téléchargement réel restent à effectuer. Retour arrière : annuler le changement du lien (ce qui réintroduirait le défaut).
