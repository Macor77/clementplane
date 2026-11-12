# Recette — V1.3 / 12 novembre 2026

État : corrections de revue intégrées, contre-revue sans blocage, CI validée et production autorisée et réalisée le 12 novembre 2026. Les comptes, missions et captures de recette sont fictifs.

| Exigence | Implémentation / preuve |
|---|---|
| Une mission, plusieurs groupes ; un groupe sur plusieurs jours | Sessions JSON identifiées ; tests 3 groupes sur un jour et 14 h sur 2 jours, effectif compté une fois |
| Réalisation explicite et durée réelle | Par journée : à renseigner / réalisée / non réalisée ; heures réelles seulement si réalisée, date future refusée ; unités métier et SQL |
| Réalisation partielle / en cours | État déduit des journées, distinguant dates futures restantes ; tests dédiés |
| Comptage sans identités d’apprenants | Un effectif agrégé par session, zéro conservé, valeurs manquantes explicites ; aucune fiche nominative |
| Contrat et déclaration distincts | Instantané serveur du tarif initial, HT/TTC explicite pour déclaration ; pas de modification du tarif ni du planning source |
| Partage OF limité | Table partagée sous RLS ; lecture OF commanditaire seulement, auteur identifié par instantané serveur ; aucune écriture OF |
| Données privées | Frais, détails, kilomètres, difficultés dans table propriétaire seule ; SQL vérifie lectures directes/jointures et refus autres comptes |
| Mission personnelle privée | Source propriétaire ; aucun organization_id même si donneur d’ordre connu ; test SQL OF sans accès |
| Saisie par formateur seulement | RPC authentifiée, affectation exigée à la création, révision contrôlée ; DML direct révoqué |
| Saisie progressive | Valeurs nulles autorisées, saisies conservées en échec ou retour d’onglet ; reprise idempotente après réponse perdue ; zéro distinct de vide |
| Accès après changement d’affectation | Bilans conservés dans statistiques, même complets ; route dédiée modifiable par propriétaire ; test navigateur dédié |
| Distances | Distance existante Haversine à vol d’oiseau, aller simple : pas de préremplissage routier trompeur ; kilométrage réel total manuel privé, modifiable |
| Statistiques réalisées | Seulement journées explicitement réalisées ; heures par date ; sessions/missions distinctes ; effectif ancré à première réalisation |
| Statistiques futures | Affectations confirmées seulement, dates non réalisées à partir d’aujourd’hui ; propositions/options séparées ; effectifs/durées prévus distincts |
| Périodes / années | Heures par journée, participations une seule fois à la première réalisation, tarif total à première date contractuelle ; tests interannuels et explication visible |
| Pas de double comptage financier | Tarif mission totalisable uniquement si montant/unité/base connus ; HT/TTC séparés ; jour/heure non convertis et signalés |
| Périmètre conservé | Aucun chiffre d’affaires, marge, comptabilité, BPF, facturation ou nouvelle synchronisation |
| Pas d’effets externes | Aucun trigger métier sur bilans ; aucune écriture mission/calendrier ; navigateur surveille appels d’envoi ; contrats et affectations inchangés en SQL |
| Mobile / bureau | Recette Chromium 390 et 1440 px, contrôles de largeur, captures fictives formulaire/statistiques/consultation OF |
| Montants / sécurité | Validation brute avant arrondi numeric(10,2), refus -0.001 et 1.234 ; nombres JSON seulement ; listes fermées de champs ; atomique |
| Aide / juridique / documentation | FAQ, parcours Découvrir, notice confidentialité, registre et droits actualisés ; matrice juridique séparée |

## Preuves et limites

- `npm test` : **349 tests / 58 fichiers réussis**, suite complète exécutée avec les variables Supabase fictives de CI. Sans ces variables, deux suites historiques refusent de démarrer ; aucune connexion réelle nécessaire.
- `npm run test:activity-sql` : PostgreSQL embarqué PGlite, rôles/RLS et RPC réels. Tests supplémentaires des valeurs brutes et de l’auteur.
- `scripts/testing/trainer-activity-staging.sql` : exécuté avec succès sur PostgreSQL hébergé **documentation-demo** après les trois migrations. Créations fictives, contrôles multi-rôles et ROLLBACK final. Aucune donnée de recette persistante.
- Recette notice : inscription transactionnelle fictive acceptant la nouvelle version, puis rollback. Anciennes notices conservées.
- Revue indépendante : pas de défaut critique ; deux points importants (accès aux bilans complets conservés, montants pré-arrondi) et attribution OF corrigés. La CI a aussi révélé la garde de routage racine ; routes ajoutées explicitement sans capturer les routes OF `/formateur/view`, `/edit`, `/new`.
- Les tests navigateur utilisent l’API simulée pour éviter tout envoi et donnée réelle. Ils complètent la recette SQL hébergée ; ils ne constituent pas une recette connectée de production.
- Les premiers runs CI ont échoué sur des sélecteurs/fixtures puis la garde de routage ; seules les preuves vertes du dernier commit valent validation finale. Runs historiques : 43175738623, 43177025986.
- Les alertes ESLint et npm existantes sont relevées dans CLOSURE ; aucune conformité globale de l’ensemble historique n’est revendiquée.

## Recette du code c8adb463

[Quality 43178452742](https://github.com/Macor77/clementplane/actions/runs/43178452742) : **349 tests unitaires, 43 tests navigateur et toutes les suites SQL réussis**, lint sans erreur, audit sans haute/critique, build réussi. Les cinq scénarios d’activité couvrent bureau, mobile, mission OF, lecture OF sans privé et bilan historique complet. Captures relues : formulaire 390/1440 px, statistiques 390/1440 px et consultation OF ; aucun débordement, aucune identité réelle.

L’archive candidate a été générée et contrôlée (624 fichiers), mais son dépôt comme artifact a échoué car upload-artifact refuse les chemins relatifs `../`. Le chemin de dépôt est corrigé dans le commit documentaire suivant. **Le statut de la dernière CI sur PR #21 est la référence avant production**, incluant vérification de l’archive déposée ; le run ci-dessus n’est pas présenté comme entièrement vert.

Contre-revue des corrections : aucun blocage restant. Prévisualisation Vercel du code `c8adb463` : `dpl_EXogMUuXL2MY5rkRxMdq17duXmAK`, READY, target preview ; aucune mutation lancée sur cette prévisualisation dont la base n’a pas été reconfigurée. Production inchangée.

## Validation finale et production

- [Quality de la PR, 43179007679](https://github.com/Macor77/clementplane/actions/runs/43179007679) : entièrement réussi sur 1691daa, archive déposée puis téléchargée et vérifiée (624 fichiers, manifestes et SHA-256).
- [Quality après fusion, 43184262847](https://github.com/Macor77/clementplane/actions/runs/43184262847) : entièrement réussi sur cb0c1ccd.
- Autorisation de Vincent : « Je t’autorise », en réponse à la demande couvrant les trois migrations production, publication et clôture/tag/release.
- Vérifications production : PRODUCTION.md. Pas d’essai connecté d’écriture sur les missions réelles ; le contrôle de production est non destructif et complète la recette SQL hébergée et les parcours navigateur simulés.
- La clôture documentaire déclenche une nouvelle Quality sur son commit exact ; la release v1.3.0 ne peut être créée qu’après son succès et vérifie le téléchargement de son archive.
