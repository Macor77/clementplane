# Préparation de livraison · V1.8.0

Au 20 novembre 2026, le serveur FirstHeberg de 8 Go exécute l’API sur la boucle locale, le validateur, ClamAV et FreshClam. Les estimations OVHcloud ci-dessous retracent la préparation du 18 novembre. [Tests sur le serveur](ACCEPTANCE.md)

## Architecture et limites

Le navigateur Clementplane parle en HTTPS à l’API documentaire. Le front Vercel ne transporte pas les octets. Le lien invité arrive sur dossier-invite.html sans initialiser Supabase Auth. Le fragment est retiré de la barre d’adresse. Le service vérifie les utilisateurs auprès de l’Auth de Clementplane et recoupe le session_id en base. L’OF sélectionné doit correspondre à une adhésion active dont le rôle figure dans dossier.managers. Le formateur peut posséder un deuxième rôle OF et reste limité à ses propres dépôts.

PDF passifs lisibles, JPEG et PNG simples. Maximum 5 Mio à l’entrée et après réencodage, 100 pages par PDF, 24 mégapixels par photo, 30 pièces actuelles, 64 Mio par formateur (historique compris), 512 Mio global pour le pilote, 100 partages actifs par formateur. Le PDF accepté conserve ses octets. Le validateur refuse notamment PDF chiffrés, formulaires, pièces jointes, actions et liens interactifs. Pour une pièce refusée, choisir une version PDF simple ou une photo lisible. Les images sont réencodées et leurs métadonnées retirées. Seul un aperçu en image est présenté au navigateur. Les octets déjà reçus peuvent être conservés par le destinataire.

Le projet n’avait aucun bucket. Pour le pilote limité, les fichiers chiffrés sont dans un schéma PostgreSQL privé. Attribution, chiffrement, version courante, historique et mise en file sont atomiques. La limite globale représente 6,25 % de 8 Gio à titre d’ordre de grandeur, hors index, WAL, espace récupérable et snapshots. La base mesurait 309 MB. Le forfait Pro annonce 8 GB de disque inclus et 0,125 USD/GB/mois au-delà sur gp3. La taille exacte allouée, le trafic sortant et la facture agrégée restent à vérifier. Le quota applicatif ne plafonne pas la facture fournisseur. [Tarification Supabase](https://supabase.com/docs/guides/platform/manage-your-usage/disk-size)

ClamAV recommande au moins 3 Gio de RAM sur Linux. Pour héberger API, validateur et antivirus avec marge de rechargement des signatures, enveloppe de 8 Go. Exemple chiffré, VPS-2 8 Go OVHcloud affiché à partir de 7,21 € HT/mois, prix et site exacts à confirmer à la commande. Exploitation, sauvegarde des clés, éventuels dépassements de trafic et quotas Brevo sont distincts. Un hôte UE existant convenablement dimensionné évite l’abonnement supplémentaire. Au 18 novembre, aucun service souscrit. [ClamAV](https://docs.clamav.net/Introduction.html) · [Configurateur OVHcloud](https://www.ovhcloud.com/fr/vps/configurator/)

## Mise en recette puis livraison

1. Choisir une machine de recette UE et une base isolée compatible avec le schéma Clementplane. Ne pas utiliser la branche documentation-demo en échec pour ce sprint. Épingler les images construites et conserver leurs empreintes et inventaires. Déployer un reverse proxy HTTPS devant 127.0.0.1:8260. Accepter POST et OPTIONS, corps JSON de 7 Mio maximum, fixer délais et limitations de débit à l’entrée. Interdire la mise en cache et les journaux de corps, de paramètres et d’Authorization. Le port de scan et la base restent inaccessibles au public. Désactiver les core dumps et exclure tmpfs des sauvegardes.
2. Appliquer uniquement les deux nouvelles migrations dans l’ordre, après comparaison du nom, de l’empreinte et de l’historique. La première crée dossier, son rôle NOLOGIN et les objets privés. La seconde étend la liste des versions CGU/confidentialité acceptées à l’inscription, avec compatibilité des clients en cache. Le rôle PostgreSQL dédié à l’API doit hériter uniquement de dossier_runtime. Activer sslmode=verify-full et lui fournir la chaîne de confiance Supabase. Vérifier par SELECT son absence de privilèges administratifs, d’accès aux tables Auth et d’accès via les rôles Web. Ne jamais fournir un login postgres, BYPASSRLS ou service_role au service. Paramétrer son logging opérateur sans valeurs ni paramètres de requête, examiner les messages d’erreur avec des marqueurs fictifs.
3. Le modèle services/dossier/compose.yaml prévoit API, worker, analyseur privé, clamd et actualisation des signatures. Préparer les volumes Unix accessibles à l’UID 10001 et le répertoire de certificats. Les conteneurs clamd et validator n’ont pas de réseau. Seul l’actualiseur a besoin des serveurs de distribution ClamAV. Restreindre en sortie l’API à Auth et à PostgreSQL, et le worker à PostgreSQL et Brevo. Le test local ne valide pas à lui seul le confinement du système hôte.
4. Fournir des fichiers d’environnement externes au dépôt, droits opérateur seulement. API : DOSSIER_ENABLED, DOSSIER_WEB_ORIGIN, DOSSIER_DSN, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, DOSSIER_HMAC_KEY (aléatoire ≥ 32 octets), DOSSIER_FILE_KEYS (objet JSON identifiant → clé AES de 32 octets en base64), DOSSIER_CURRENT_KEY_ID. Worker : DSN distinct si disponible, DOSSIER_WEB_ORIGIN, DOSSIER_ENABLED, DOSSIER_HMAC_KEY, DOSSIER_MAIL_MODE, BREVO_API_KEY. Le worker ne reçoit pas les clés de fichiers. Le navigateur reçoit uniquement VITE_DOSSIER_ENABLED et VITE_DOSSIER_API (origine HTTPS approuvée). En recette utiliser une origine et un projet isolés. DOSSIER_MAIL_MODE=off par défaut, test et DOSSIER_TEST_MAILBOXES uniquement pour des boîtes autorisées. Le mode live exige une décision de production.
5. Faire un dépôt fictif suivi d’un téléchargement et de plusieurs pages d’aperçu. Examiner le flux en ouvrant un partage OF et un partage invité, puis après changement de rôle, remplacement, révocation et suppression. Vérifier que les journaux des fournisseurs et le cache de la PWA ne contiennent aucun document, note, code ou lien d’accès. Désactiver les aperçus Brevo pour l’expéditeur, vérifier le suivi/réécriture de liens et la conservation des journaux, sans modifier incidemment les autres expéditeurs. Vérifier DKIM et l’expéditeur contact@clementplane.fr.
6. Pour l’ouverture, attester MFA, quotas/coûts, contrats, restauration, recette et revue de sécurité. L’autorisation de fusion/déploiement est distincte de celle d’ouvrir le service. L’API et le front sont fermés par défaut. Le tag final, l’archive et la release sont liés au SHA effectivement validé après ce point.

### Recette privée sur un hôte qui exécute déjà ClamAV

Depuis `services/dossier`, utiliser le projet Compose du moteur existant pour reprendre son volume de sockets. Pour l’hôte de recette, ce projet est `clementplane-antivirus`. Le profil `recette` lance le client de test et PostgreSQL dans un conteneur éphémère sans réseau externe. Les pièces, les identités et les clés de chiffrement sont générées pour le test. Le service de validation et ClamAV communiquent par sockets Unix. L’API liée à la boucle locale peut rester fermée pendant les essais.

Sur cet hôte, fournir à `DOSSIER_API_ENV_FILE` le chemin absolu d’un fichier hors du dépôt contenant `DOSSIER_WEB_ORIGIN=https://recette.example.invalid` et `DOSSIER_ENABLED=0`. Pointer `DOSSIER_WORKER_ENV_FILE` sur un fichier vide hors du dépôt. Le worker reste arrêté. Vérifier que le projet, son volume de sockets et le service `clamd` correspondent à l’installation attendue avant de démarrer les deux services.

```bash
dc=(docker compose -p clementplane-antivirus -f compose.yaml -f compose.recette.yaml)
"${dc[@]}" up -d --build --no-deps validator api
"${dc[@]}" --profile recette build recette
"${dc[@]}" --profile recette run --no-deps --rm recette
```

Le résultat détaille les scénarios terminés et omis. Le témoin EICAR utilise les signatures officielles. Le test supplémentaire avec un PNG marqué est conditionné à une signature de laboratoire distincte. Contrôler aussi que l’API de l’hôte répond 404 à un POST sur `http://127.0.0.1:8260/v1/upload` et que le moteur et le validateur ne publient aucun port.

### Essai HTTPS depuis un téléphone sur le VPS de recette

Utiliser le nom DNS du VPS FirstHeberg et un certificat public valide pour ce nom. Le serveur HTTPS sert une copie dédiée de la page invitée. Construire depuis la racine du dépôt, avec une origine identique pour la page, l’API et les liens des courriels. Le répertoire de sortie doit être neuf et réservé à cette page.

```bash
VITE_DOSSIER_ENABLED=true VITE_DOSSIER_API="https://${DOSSIER_GUEST_HOST}" \
  npm exec -- vite build --config services/dossier/recette/vite.guest.config.mjs \
  --outDir "$DOSSIER_GUEST_ROOT"
```

Renseigner le nom d’hôte, l’adresse d’écoute et les chemins absolus du certificat, de sa clé et du répertoire compilé. Rendre le modèle avec la liste explicite de variables ci-dessous pour conserver les variables internes de Nginx. Charger le résultat dans le contexte `http` après validation avec `nginx -t`.

```bash
envsubst '${DOSSIER_HTTPS_LISTEN} ${DOSSIER_GUEST_HOST} ${DOSSIER_TLS_CERT} ${DOSSIER_TLS_KEY} ${DOSSIER_GUEST_ROOT}' \
  < services/dossier/recette/nginx-guest.conf.template > "$DOSSIER_RENDERED_CONF"
```

Le proxy relaie cinq actions invitées vers la boucle locale. Le formulaire de dépôt, les routes du propriétaire et la base restent privés. Vérifier le certificat depuis l’extérieur avant de créer le partage. Utiliser la base de recette isolée, une pièce fictive, le mode de messagerie `test` et une seule adresse autorisée. Fournir au worker son accès Brevo par la configuration privée du serveur. Créer le partage une seule fois, rapprocher l’invitation des journaux de livraison puis demander le code une seule fois depuis la page. En fin de test, révoquer le partage, vérifier le refus d’un nouveau téléchargement, arrêter le worker de recette et retirer l’entrée HTTPS temporaire.

## Enveloppe validée pour la recette et le passage en production

Décision de Vincent du 18 novembre 2026. Garder une cible de **8 Go de RAM** pendant le développement et lors de la préparation de production. Les limites documentaires et la capacité disque sont distinctes de la mémoire vive. Ne pas activer d’augmentation automatique payante.

Décision actualisée le 18 novembre 2026. Attendre le contrôle de disponibilité du VPS-2 Linux en France le vendredi 20 novembre. L’option temporaire Discovery d2-8 (48 heures maximum, 5 € TTC tout compris) est suspendue. Le contrôle porte sur le site disponible, le tarif TTC réel sans engagement annuel et, en cas de rupture, les alternatives durables en France dans le budget indicatif de 10 à 12 € TTC/mois. Communiquer le résultat à Vincent pour décision. Aucune commande automatique.

La recette peut se poursuivre en environnement isolé avec des pièces fictives. Un déploiement technique du code en production nécessiterait un accord distinct, les contrôles de livraison et les drapeaux API et interface désactivés. Avant toute ouverture aux utilisateurs, vérifier sur l’hôte choisi le scan, le refus en cas de panne, les droits et les autres points de confidentialité de la matrice. Si le même hôte est retenu pour la production, le réinitialiser après la recette et séparer les données et les secrets des deux environnements.

Avant d’ouvrir en production, mesurer le pic pendant les dépôts concurrents et le rechargement des signatures, vérifier la réception des alertes et présenter le coût mensuel réel. Tout abonnement de production, dépassement du plafond ou augmentation de capacité requiert un accord budgétaire distinct.

[Tarifs OVHcloud](https://www.ovhcloud.com/fr/public-cloud/prices/) · [Facturation IPv4 et stockage](https://blog.ovhcloud.com/fr/posts/public-cloud-pricing-model-update-2026/)

## Surveillance mémoire de la recette

Le serveur de 8 Go doit prévenir l’opérateur avant saturation. Sur le nouvel hôte Linux, Monit mesure toutes les minutes la RAM utilisée sur l’ensemble de la machine, y compris les conteneurs. Sur Debian, sa mesure utilise la mémoire disponible du noyau, cache récupérable compris. Les seuils portent sur la mémoire utilisable détectée au démarrage.

| Seuil atteint | Notification opérateur |
|---|---|
| 70 % sur cinq relevés consécutifs | Préalerte, environ 5,6 Go utilisés sur 8. Comparer la consommation au repos, pendant un dépôt fictif et pendant la mise à jour des signatures. |
| 90 % dès un relevé | Alerte critique, environ 7,2 Go utilisés sur 8. Suspendre les tests de charge et identifier le processus concerné. Vérifier aussi la limite propre à clamd. |
| Trois relevés sous un seuil précédemment franchi | Message de rétablissement pour ce seuil. La préalerte peut rester ouverte après la fin d’une alerte critique. |

Le dispositif s’exécute sur l’hôte. Il fonctionne navigateur fermé et ne lit aucun fichier documentaire. Les messages contiennent la mesure, l’état et l’heure. Monit traite chaque franchissement et met les alertes non transmises en file locale bornée. Un serveur complètement arrêté ne peut pas émettre cette alerte locale. Le dimensionnement reste une décision de l’opérateur.

**Installation sur une machine Debian de recette neuve**

1. Installer les paquets Debian `monit` et `ca-certificates`. Conserver la configuration d’origine avant d’installer le profil dédié. Sur une machine déjà supervisée, intégrer les règles au service existant.
2. Depuis le dépôt, installer `services/dossier/monitoring/monitrc` dans `/etc/monit/monitrc` (root, mode 0600). Créer `/etc/monit/clementplane/` (0700), y copier `services/dossier/monitoring/mail.conf.example` sous le nom `mail.conf` (0600). Renseigner localement le relais Brevo de Clementplane, sa clé SMTP dédiée et la boîte autorisée de l’opérateur. Autoriser le SMTPS sortant vers ce seul relais (port 465). Vérifier l’expéditeur avant l’essai.
3. Exécuter `sudo monit -t`, puis `sudo systemctl enable monit && sudo systemctl restart monit`. Contrôler `systemctl is-active monit` puis `journalctl -t monit`. Aucun port entrant ni tableau de bord public n’est nécessaire.
4. Pour vérifier la réception sur la machine louée, utiliser temporairement un seuil inférieur à sa consommation au repos et une seule boîte de recette autorisée. Relever l’heure du message dans la boîte, rétablir le fichier de référence, relancer le service et contrôler les seuils actifs. Vérifier le démarrage automatique après redémarrage. Supprimer les alertes de test de la file avant de changer de destinataire. Aucune réception sur OVHcloud n’a encore été observée.

[Configuration Monit](../../../services/dossier/monitoring/monitrc) · [Manuel Monit](https://mmonit.com/monit/documentation/monit.html)

## Exploitation et retour arrière

- Surveiller uniquement des compteurs de refus, erreurs, files, latence, occupation disque, mémoire et âge des signatures. Alerter sur arrêt du worker, retard de maintenance, envois en sending/unknown, 503 répétés, seuils 70/90 % et dernier succès de sauvegarde. Un rejet d’envoi définitif doit être visible à l’opérateur. Un 429 est réessayé avec délai croissant. Après un délai réseau ambigu ou un crash, rapprocher l’identifiant technique chez Brevo avant tout renvoi. Retenter via un nouveau partage ou le renvoi contrôlé du partage actif. « Accepté » signifie prise en charge par Brevo.
- Le worker fonctionne hors navigateur. Le rappel J−30 est éligible jusqu’à J−8, le rappel J−7 jusqu’à J−1. Un délai manqué avant la saisie de la date n’est jamais créé rétroactivement. La date, la version et les droits sont relus avant traitement. Une date expirée coupe le partage seulement s’il s’agit de la date de fin d’accès.
- Choisir une clé de chiffrement distincte de la clé HMAC. Pour une rotation AES, ajouter d’abord une nouvelle clé, la désigner pour les nouveaux dépôts puis rechiffrer les anciennes lignes dans une opération contrôlée avant de retirer une clé. Garder les clés des sauvegardes encore restaurables dans un coffre distinct. En cas de compromission, fermer l’API et le worker, révoquer sessions/invitations, examiner les événements minimaux et activer la procédure d’incident.
- Une révocation ou une expiration bloque la prochaine requête, y compris avec un ticket invité existant. Aucun lien de téléchargement n’est émis. Une réponse déjà en cours, un aperçu déjà rendu ou une copie téléchargée ne peut pas être repris.
- Retour arrière : fermer d’abord API et worker et désactiver le front. Préserver la base, les clés et l’état de purge. Ne pas supprimer le schéma en rollback. Une restauration doit se faire à l’écart du trafic et des envois. Réappliquer les suppressions survenues depuis le point restauré, invalider toutes les sessions et partages restaurés, vider/réconcilier les envois, rejouer les purges, puis vérifier avant exposition. Si les suppressions intermédiaires ne sont pas réconciliables, garder le dossier restauré hors ligne et ne pas réintroduire ses pièces.

Le conteneur antivirus attend les bases officielles main, daily et bytecode. La disponibilité d’un fichier de signatures n’établit pas à elle seule son chargement : vérifier le journal de démarrage, la version effective, l’âge < 48 h et un fichier témoin inoffensif reconnu. L’inactivité d’un scanner ou une base trop ancienne ferme le dépôt et le rendu PDF. Le moteur de test local a chargé la base daily officielle 28187 et une signature de test pour une image PNG fictive ; main/bytecode n’ont pas été qualifiées localement. Les clauses de consentement à l’inscription doivent être livrées au plus tard avec le frontend qui les utilise.
