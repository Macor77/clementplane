# Pilote Outlook / Microsoft 365 — 28 octobre 2026

## Décision et périmètre

Vincent a explicitement accepté dans la conversation de reporter le test du second cas, Microsoft 365 professionnel, après mise en production avec une cliente désignée. Le compte corrigé a été vérifié : utilisateur confirmé avec profil formateur. Les identifiants personnels restent dans la configuration d'environnement, pas dans ce dépôt.

**Pilote activé, aucune ouverture générale ; sprint non clôturé.** Le consentement professionnel appartient à la titulaire. Aucun message ne lui a été envoyé et aucun accès à son compte Microsoft n'a été effectué. Le compte habituel de Vincent est autorisé dans la liste mais ne possède pas de profil formateur de production : aucun rôle n'a été ajouté implicitement. La recette personnelle antérieure reste celle du compte fictif isolé.

## Livraison vérifiée

- PR [19](https://github.com/Macor77/clementplane/pull/19) fusionnée ; commit applicatif `d308ea451fa08cbcf93b977d6df3910c8d2cb284`, arbre identique au head testé `16efee76c36350bc7c63528279d7ecfe103a7b8b`.
- CI [40744842498](https://github.com/Macor77/clementplane/actions/runs/40744842498), job `123015764765` : 318 tests Vitest / 56 fichiers et 38 tests navigateur réussis, contrats SQL/RLS, lint, audit et build réussis. Zéro erreur lint, deux warnings préexistants ; audit 0 high/critical, 4 moderate et 5 low documentés dans DELIVERY.
- Vercel production `dpl_JAoL5Yvcb4WPeb1XJfQZXQntWJ52`, READY, commit applicatif ci-dessus. Variables production `VITE_MICROSOFT_CALENDAR_ENABLED=true`, `VITE_MICROSOFT_CALENDAR_PILOT=true` ; Google et configuration Supabase existants préservés.
- Bundle public `/assets/index-9McyB1DV.js` vérifié : backend production présent, backend recette absent, bouton Microsoft et Google présents, tutoriel public Outlook absent, version affichée `V1.2.4`.
- Origine canonique **https://www.clementplane.fr** : le domaine sans www redirige en 308 (configuration Vercel préexistante). `MICROSOFT_APP_URL` et `MICROSOFT_REDIRECT_URI` alignés sur cette origine. URI Web Entra corrigée en `https://www.clementplane.fr/microsoft-calendar-callback.html`, visible dans la liste après enregistrement ; URI preview conservée. Un rechargement ultérieur du portail a demandé une reconnexion, sans nouvelle lecture de configuration.
- Callback HTTP 200 ; CSP `default-src 'none'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'`, Referrer-Policy `no-referrer`, Cache-Control `no-store`.
- Prévol serveur depuis www : 204 avec origine autorisée exacte ; depuis l'origine sans www : 403, refus attendu. Aucun élargissement CORS.

## Supabase production

Projet `hctvkynrgmnxjynbncdi`. Correspondance des trois migrations appliquées une seule fois :

| Fichier local | Identifiant distant | Nom |
|---|---|---|
| 20261028065329 | 20261028182601 | microsoft_calendar_sync |
| 20261028071102 | 20261028182609 | microsoft_calendar_privacy_notice |
| 20261028160000 | 20261028182614 | microsoft_calendar_worker_vault_auth |

Fonctions `microsoft-calendar` et `microsoft-calendar-worker` déployées depuis les bundles du code testé. Empreintes EZBR au déploiement : respectivement `85fbbf2f573cd2a70c76b0f9d4eecd7351b4ee8efcd4a290706a95214101e767` et `0b889289207c037e176a25c371dca4c5be9a9dc3aa54012f86d27291acd5a177`. Le handler exige un JWT ; le worker utilise sa propre authentification Vault. Aucun redéploiement Google.

Mode serveur `testing`, liste de deux UUID seulement. Les empreintes SHA-256 des paramètres non secrets ont été comparées aux valeurs attendues, y compris origine et URI canonique. Client secret et clé de chiffrement préexistants conservés sans lecture de leur valeur.

Clé worker générée aléatoirement côté Vault, jamais exportée ; URL worker dédiée stockée dans Vault. Cron minute `clementplane-microsoft-calendar`, jobid 3, exécutions réussies. Vérification ciblée du worker par requête pg_net `30252` : HTTP 200, `processed:0`, pas de timeout. Zéro connexion Microsoft en production au contrôle. Cette vérification prouve l'authentification du déclencheur, pas une synchronisation Graph professionnelle.

Sécurité vérifiée : RLS des trois tables, droits directs anon/authenticated refusés ; RPC de vérification worker réservée service_role ; rôles clients NOLOGIN. Data API refuse `Accept-Profile: net` avec 406/PGRST106 ; endpoints anonymes 401. Aucune RPC publique exportant les files pg_net ou secrets Vault, seule vérification booléenne du worker. Ne jamais exposer le schéma net ni partager les identifiants SQL directs. Les advisories Microsoft sont uniquement trois INFO « RLS enabled, no policy », voulus pour ces tables serveur ; autres warnings préexistants hors périmètre.

## Recette, limites et exploitation

La recette personnelle réelle et les missions fictives sont détaillées dans REAL_ACCEPTANCE : créations multi-date, modifications, annulations navigateur fermé, reconnexion au même calendrier, propositions/options libres, confirmation occupée, revalidation et désaffectation. Les états métier fictifs ont été préparés en SQL ; cela ne certifie pas tous les parcours UI réels.

La cliente peut ouvrir Clementplane avec son compte habituel, puis **espace formateur → Paramètres → Outlook / Microsoft 365 → Connecter Microsoft**. Elle choisit elle-même son compte ; si Microsoft exige l'accord de son administrateur, cet accord reste nécessaire. Ne pas modifier/supprimer de missions clientes pour la recette. Après son consentement, vérifier lecture seule de l'état de connexion/synchronisation puis utiliser une mission fictive explicitement autorisée si des mutations sont nécessaires.

Reste : consentement et recette professionnelle réelle, double fournisseur simultané réel, PWA installée réelle et réserves de gouvernance décrites dans LEGAL_REVIEW. Aucune réserve supplémentaire n'est réputée acceptée. Aucune nouvelle souscription payante créée ; les quotas/coûts des services existants ne sont pas certifiés nuls.

Retour arrière : passer `MICROSOFT_CALENDAR_MODE=disabled` et suspendre uniquement le cron Microsoft si nécessaire. Les connexions existantes gardent leur commande de déconnexion. Pour retirer aussi l'interface, désactiver le flag frontend et redéployer. Ne pas supprimer les tables, calendriers ou événements clients ; ne pas toucher à Google. Un rollback frontend n'annule pas les migrations.

## Clôture différée

Version stable 1.2.4 conservée, cible 1.3.0 après validation finale. Pas de tag/release/ZIP de version stable Outlook tant que le pilote n'est pas validé. FAQ et tutoriel Outlook préparés mais promotion masquée durant le pilote ; landing inchangée et contrôlée. Notices de confidentialité conditionnelles déployées. Communication préparée dans RETOUR_PILOTAGE, envoi non autorisé. Les résultats documentaires ultérieurs n'altèrent pas l'arbre applicatif testé.
