# Téléchargement du modèle d’import des formateurs — 26 octobre 2026

## Diagnostic

Le bouton demandait `/templates/Clementplane_Modele_Import_Formateurs_v1_1.xlsx`, absent du dossier public. Le fichier livré s’appelle encore `Formaplane_Modele_Import_Formateurs_v1_1.xlsx`. La route de secours SPA renvoie alors index.html, ce qui correspond au fichier transmis dans le signalement.

## Correction publiée

Le lien utilise le fichier existant. Le nom proposé au téléchargement reste Clementplane. Le classeur, ses colonnes et le traitement d’import ne changent pas. Son contenu utilise encore l’ancien nom Formaplane ; sa refonte éditoriale est hors périmètre de ce correctif ciblé.

## Vérifications locales

- Test de régression observé en échec avant correction (cible absente), puis réussi : présence réelle du fichier, signature ZIP/XLSX, ouverture et 12 colonnes attendues.
- Suite Vitest : 47 fichiers, 248 tests réussis avec les variables fictives de la CI. Le premier lancement sans variables échouait dans monitoringService.test.js et trainerAvailabilityShareService.test.js (supabaseUrl requis).
- Build réussi ; cible présente dans dist et classeur ZIP valide (12 854 octets). Avertissement existant concernant la taille du bundle.
- ESLint du nouveau test et git diff --check réussis.
- CI complète de la PR réussie, y compris tests navigateur/PWA, SQL/sécurité et audit : https://github.com/Macor77/clementplane/actions/runs/40364772383.
- Vérification HTTP réelle sur https://www.clementplane.fr : bundle `/assets/index-BtxVA068.js` contenant le lien corrigé et plus le lien absent ; téléchargement HTTP 200, type Excel, 12 854 octets ; classeur ouvert avec openpyxl et les 12 colonnes validées. Ce contrôle ne simule pas un clic dans une session OF authentifiée.

## Impacts et livraison

Aucun changement de données, de droits, de service externe ou de Supabase. Aucun changement nécessaire des documents légaux/RGPD, tutoriels ou captures : comportement déjà décrit restauré. Aucun message envoyé aux utilisateurs.

État : correctif publié et téléchargement de production vérifié le 26 octobre 2026, après accord explicite de Vincent (« Tu peux le publier »). PR #17 fusionnée ; commit applicatif `284cfc0116c96cbf3737f6098d2b75fce793ce21` ; statut Vercel success : https://vercel.com/formaplane/clementplane/2XVAddNonLFCt6BMWbaTd6RNxkYa. L’API Vercel directe est inaccessible pour l’équipe (403) ; preuves utilisées : statut de l’intégration GitHub et fichiers publics effectivement servis. Publication ciblée sans changement de version ni déclaration de clôture d’un nouveau sprint. Retour arrière : annuler le changement du lien (ce qui réintroduirait le défaut).
