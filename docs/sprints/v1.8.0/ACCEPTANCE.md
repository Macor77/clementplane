# Matrice de recette du dossier professionnel

Données fictives uniquement. Chaque niveau de vérification ci-dessous est à lire dans son environnement. Les fichiers de tests sont dans services/dossier/tests, les scénarios Playwright 20 et 21 de tests/e2e/specs et la configuration Quality.

## Réception réelle du partage invité · 20 novembre 2026

L’opérateur a autorisé un envoi de test par Brevo à sa seule boîte. Le worker d’une base de recette temporaire a composé l’invitation et le code pour une pièce fictive. L’envoi a utilisé la fonction de test du compte Brevo de Clementplane. Brevo a marqué les deux messages livrés. Gmail les a reçus dans la boîte de réception à 16 h 57 et 17 h 00, heure de Paris.

Le lien extrait du premier message a permis de demander le code au service privé. Le code extrait du second a ouvert la session invitée. L’API a listé une seule des deux pièces présentes et rendu un PDF identique à celui déposé. Après révocation, une nouvelle demande de téléchargement a renvoyé 404. L’instance a été arrêtée. Le lien fonctionnait sur la boucle locale de recette. L’envoi automatique par le worker du VPS et le parcours HTTPS depuis un appareil externe restent à vérifier.

## Préparation du partage invité et de la mise en service · 20 novembre 2026

- Le test `test_guest_follows_mailed_invitation_and_code` a suivi le lien et le code issus du contenu réellement composé par le worker. Le transport HTTP vers Brevo a été remplacé par un collecteur local. Une seule invitation et un seul code ont été présentés pour l’adresse fictive autorisée. Le partage vers une deuxième adresse est resté en attente. Le bénéficiaire a téléchargé la seule pièce sélectionnée, dont les octets ont été comparés à l’original. La révocation a immédiatement coupé son accès. Aucun courriel n’a quitté le test.
- Expéditeur historique vérifié dans Gmail sur un courriel Clementplane du 4 septembre 2026. Les résultats d’authentification consignés par Gmail indiquent SPF, DKIM et DMARC réussis. La réception d’une invitation et de son code par le nouveau service documentaire reste à vérifier avec la boîte autorisée. Le réglage des aperçus et de la conservation Brevo reste à contrôler dans le compte.
- L’espace client FirstHeberg indique un VPS en ligne à Valenciennes 1 et aucune sauvegarde disponible pour cette machine. Il indique aussi que son service SMTP exige la certification du compte. La portée de cette restriction sur le relais externe au port 465 reste à tester. Le worker documentaire utilise l’API HTTPS de Brevo. Les alertes mémoire utilisent SMTP.
- Le contrôle en lecture seule de la base Supabase de production à 16 h 35 (Paris) confirme l’absence du schéma documentaire. La sauvegarde distante de la base et celle des clés conservées séparément doivent être attestées avant ouverture. La liste des sauvegardes Supabase demande une connexion au tableau de bord.

## Parcours navigateur du 20 novembre 2026 à 16 h 03, heure de Paris

Deux scénarios Playwright ont réussi en 5,3 secondes avec Chromium 149 sur la candidate `654b7e2`. La recette a utilisé une instance Supabase Auth 2.197.0 auto-hébergée temporaire, PostgREST 14.18, PostgreSQL 16.2 et l’API documentaire de la branche. ClamAV 1.5.5 a chargé la base officielle 28188 du 19 novembre. La page de connexion a obtenu les sessions par mot de passe auprès de Supabase Auth. Aucun jeton de session ni aucune réponse d’API n’a été injecté dans le navigateur.

| Parcours | Observation |
|---|---|
| Formateur propriétaire | Depuis la page du dossier, redirection vers la connexion puis retour au dossier. Dépôt d’un PNG fictif de 4 × 4 pixels, état privé après actualisation, aperçu décodé aux dimensions attendues, téléchargement au nom du document avec en-tête PNG et dimensions vérifiés. Dans un nouveau navigateur isolé, la pièce est réapparue après une nouvelle connexion. |
| Second formateur | Connexion indépendante dans un autre contexte du navigateur. Le dossier affichait l’état vide et la pièce du premier formateur était absente. |
| Formateur également administrateur de la plateforme | Dossier bloqué après le mot de passe. Enregistrement du facteur TOTP depuis l’écran de Clementplane, validation du code et accès au dossier après actualisation. PostgreSQL a confirmé un facteur vérifié et une session de niveau AAL2. |

Le contrôle final en base a compté trois utilisateurs distincts avec session, une pièce, une version et zéro entrée dans la file de courriels. La base utilisait les migrations Auth et la migration documentaire de la branche, avec les tables de profils et de rattachements nécessaires à ces parcours. Les services de recette communiquaient par boucle locale. La liaison sur le VPS par sockets Unix a été vérifiée séparément à 15 h 42. Le projet Supabase Cloud de production et le VPS n’ont reçu aucun compte ni document de cette recette. [Capture du dossier du propriétaire](assets/dossier-recette-connectee.webp)

### Rejouer le parcours connecté

Utiliser une préproduction isolée avec trois identités fictives de formateur. Le deuxième dossier doit être vide et le troisième compte doit également être administrateur de plateforme, avec un facteur TOTP encore à inscrire. Compiler la candidate avec `VITE_DOSSIER_ENABLED=true`, l’URL de cette API documentaire et les paramètres publics de cette instance Supabase. Servir le frontend sur `http://127.0.0.1:4173` et désactiver l’envoi de courriels.

Fournir `DOSSIER_BROWSER_FIXTURE=1` et les variables `DOSSIER_TEST_OWNER_EMAIL`, `DOSSIER_TEST_OWNER_PASSWORD`, avec les mêmes suffixes pour `DOSSIER_TEST_OTHER` et `DOSSIER_TEST_ADMIN`. Exécuter `npx playwright test 21-professional-dossier-connected --retries=0` puis détruire l’instance et ses comptes de recette. Les traces et vidéos sont désactivées pour ce scénario.

## Recette hébergée du 20 novembre 2026

Hôte français de 8 Go, code applicatif `e522efe94be9484776250a7649e42ebb357c1626`. L’API locale a transmis une image PNG fictive au validateur et reçu un PNG de 78 octets. Le validateur et ClamAV communiquent par sockets Unix. À 15 h 42, heure de Paris, le service de dépôt fermé répondait HTTP 404 et l’API écoutait uniquement sur la boucle locale.

| Environnement | Résultat observé |
|---|---|
| Moteur permanent, signatures officielles | Dix scénarios réussis. Le fichier EICAR a été identifié par ClamAV et son dépôt refusé avant enregistrement. Les PDF, JPEG et PNG sains ont été acceptés. Les tests de panne ont retourné 503 et conservé la version précédente. Deux tentatives identiques après reprise ont produit une seule nouvelle version. |
| Deuxième moteur éphémère sur le même hôte | Onze scénarios réussis en 23,928 s. Une copie des bases officielles, enrichie d’une signature de laboratoire, a également permis de refuser un PNG valide et marqué. Les volumes et les services de ce test ont été supprimés. |
| Dépendances métier | Les scénarios appellent les routes FastAPI avec un PostgreSQL temporaire et des identités fictives. L’authentification distante est simulée et l’envoi d’e-mails est désactivé. Le parcours depuis le navigateur a ensuite été vérifié dans l’instance isolée décrite ci-dessus. |

Les journaux de test ont signalé des avertissements Python sur des sockets lors de la simulation de panne. Les assertions de refus et de reprise sont passées. Le contrôle Quality a réussi sur le commit applicatif testé.

## Recette du 18 novembre 2026

| Exigence | État et environnement | Preuve et limite |
|---|---|---|
| Dépôt réservé au formateur propriétaire, plusieurs CV | Vérifié en intégration locale | API FastAPI, PostgreSQL temporaire et rôle SQL applicatif, deux formateurs dont un également membre OF, compte OF seul et autre organisme. Le compte OF seul est refusé dès le dépôt. L’autre formateur ne peut remplacer ni modifier le document d’autrui. Auth distante simulée, vérification de l’existence des sessions et de l’exigence MFA réelle en base locale. |
| PDF, JPEG, PNG, format incorrect et taille | Vérifié en intégration locale | PDF de deux pages téléchargé identique, JPEG/PNG décodés, entrées texte et surdimensionnées refusées. Rendu de la page 2 en JPEG. ClamAV 1.4.3, signatures daily 28187 du 18 novembre et signature de test reconnaissant uniquement un PNG inoffensif. Le PNG témoin a été refusé avant création de pièce. Formats avancés, appareil photo physique et bases officielles complètes à vérifier en recette hébergée. |
| Quotas et indisponibilité | Vérifié en intégration locale | Limites de nombre, d’octets propriétaire et globaux testées avec seuils abaissés dans le test. Connexion réelle vers une socket privée absente lors du dépôt et du remplacement. L’API refuse les deux opérations (503). Le destinataire garde uniquement la version précédente déjà contrôlée et aucun avis de remplacement ne part. Après reprise, deux requêtes identiques créent une seule version et un seul avis en file. Lorsque le dossier est désactivé, toutes les routes documentaires renvoient 404. Taille réelle d’entrée dépassée également testée. Coût et saturation d’un hôte réel non mesurés. |
| RAM de la recette | Intégration Monit et relais SMTP local | Lecture réelle de mémoire Linux, syntaxe du relais TLS et seuils de 70/90 %. Les franchissements, les retours sous seuil et l’absence de renvoi en régime stable sont testés sur un compteur fictif à cycles accélérés. Activation, pression réelle de ClamAV et réception sur le VPS à vérifier. |
| Échéance inconnue, sans expiration, proche, expirée | Vérifié en intégration locale | Création et modification, J−30/J−7 et rattrapage après interruption, aucune avalanche lors d’un dépôt tardif. Pièce expirée accessible dans un partage actif. Pas de rappel destiné à l’OF. |
| Partage explicite, partiel, ou de toutes les pièces présentes | Vérifié en base et navigateur | Sélection d’identifiants concrets, retry idempotent, nouvelle pièce invisible dans le partage. Récapitulatif et sélection de toutes les pièces à 390/1440 px avec API simulée. |
| Confidentialité OF, historique, notes, lecture directe | Vérifié en intégration locale | Contrôles avec références d’une pièce appartenant à l’autre compte, OF de lecture seule, autre OF et membre devenu inactif. Métadonnées destinataire sans note. Ancienne version lisible exclusivement par le propriétaire. Aucun accès par URL de stockage. |
| Remplacement et notifications | Vérifié en intégration locale | Remplacement sans notification, sélection d’un seul destinataire actif, relecture des droits, refus d’une confirmation périmée. Une seule entrée dans la file lors du retry. |
| OTP, expiration, renvoi et révocation en session | Vérifié en intégration locale | Lien seul refusé, code incorrect et périmé, cinq tentatives, délai de renvoi, session invalide après fin/renouvellement/révocation. Le fournisseur de mail n’est pas contacté. |
| Envois différenciés et reprise | Vérifié avec outbox PostgreSQL et transport de mail simulé | Une seule invitation initiale par requête, renvoi distinct et limité. Libellés d’envoi sans affirmation de réception. Recette réelle Brevo et contrôle des logs fournisseur en attente. |
| Crypto, purge, sauvegarde | Vérifié en intégration locale | Octets en base différents du PDF. Restauration effective d’un pg_dump dans une autre base locale, déchiffrement avec les clés de test, réapplication d’un effacement. Purge historique/journaux, suppression pièce et cascade du compte vérifiées. La sauvegarde distante Supabase et son calendrier ne sont pas attestés par cet essai. |
| PWA, réseau et mobile | Vérifié sur Chromium headless, API de parcours simulée | 77 parcours dont 3 nouveaux. Reprise après coupure en conservant fichier, champs et identifiant. Le service worker construit est installé dans le navigateur invité, et CacheStorage examiné après consultation. Mobile simulé à 390 px et ordinateur à 1440 px. Une installation physique et la mise à jour depuis une ancienne PWA restent à tester. |
| Non-régression | Vérifié localement | 424 tests unitaires/contrats réussis. Suites SQL missions, Google, Outlook, revalidation, bilans, frais, présences et statistiques réussies. Compilation de production réussie, avertissement de taille de bundle. ESLint sans erreur, deux avertissements Hooks historiques. |
| Dépendances et chaîne de livraison | Bloqué pour la livraison finale | Audit npm hors dev : zéro alerte. Audit Python des exigences API/scan : aucune vulnérabilité connue renvoyée. Audit npm intégral : 18 alertes dont 11 élevées avec répercussions transitives de picomatch, utilisé pour les outils de construction. Quality du premier commit s’est arrêté sur ce contrôle. Le seuil élevé est conservé et la recette indépendante s’exécute avant ce contrôle. |
| Environnement public | À faire | Absence d’activation et de migration de ce sprint en production. Les parcours authentifiés en préproduction et le scan hébergé, la preuve MFA, les paramètres Brevo, les DPA et l’accord de production restent à obtenir. |

## Rejouer

- Frontend et non-régression : les variables de test et les commandes exactes figurent dans .github/workflows/quality.yml. Les API de navigateur pointent exclusivement vers des domaines de test.
- Backend : Python 3.12, requirements.txt et requirements-validator.txt, PostgreSQL local avec pg_config ou pgserver==0.1.4. Exécuter python services/dossier/tests/acceptance.py sous un compte non root. Le test démarre son propre cluster loopback et n’utilise aucune DSN de production. Par défaut, la réponse antivirus est simulée et le parseur réel s’exécute en processus séparé.
- Profil antivirus réel : démarrer les services privés scanner/clamd de recette. Pour la boucle locale du test, scanner écoute sur 127.0.0.1:8261 et clamd sur 127.0.0.1:3310. Avec DOSSIER_REAL_SCANNER=1, le chemin API → scanner → ClamAV est réel. Le scénario de détection conditionnel utilise DOSSIER_TEST_SIGNATURE=1 et une signature HDB de l’image générée par PIL Image.new('RGB',(17,13),'navy') puis sauvegardée en PNG, uniquement dans l’antivirus de recette. But : vérifier un refus de contenu marqué sans manipuler de logiciel malveillant. Le 18 novembre, les dix scénarios sont passés ensemble dans ce profil avec PostgreSQL local et ClamAV 1.4.3, dont la panne de liaison et la reprise. L’authentification distante et la remise des e-mails restent simulées.

- Supervision RAM : installer Monit Debian et `aiosmtpd==1.4.6` dans un environnement Python de test. Exécuter `python services/dossier/tests/ram_monitor.py`. Le relais écoute uniquement sur la boucle locale.
