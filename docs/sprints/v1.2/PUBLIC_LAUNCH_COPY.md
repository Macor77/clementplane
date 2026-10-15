> **État courant au 15 octobre 2026 :** les étapes ci-dessous sont historiques. PR #5 et #8 fusionnées, production ouverte le 14 octobre après autorisation. PWA installée réelle et droits avancés : réserves acceptées le 14 octobre. Voir [CLOSURE.md](CLOSURE.md) pour les contrôles actuels et les éléments restant à justifier.

# V1.2 — Textes proposés pour l'ouverture Google Agenda

Brouillon du 14 octobre 2026. Ces propositions ne sont pas publiées dans l'application et ne constituent pas une activation générale.

## Résultat de la recette de production

Connexion Google réussie. Une mission fictive apparaît avec horaires, lien Clementplane et visibilité privée. Le titulaire confirme la modification des horaires, le retrait après suppression et une reconnexion sans second calendrier. Contrôles serveur : cycles réussis sans erreur ; après retrait, aucun événement actif ; après reconnexion, état à jour. Cela ne remplace pas une inspection exhaustive de tous les agendas Google.

## Ajustement limité proposé

Fichiers concernés : src/pages/LegalPage.jsx et src/components/trainer/GoogleCalendarCard.jsx. Aucun changement des scopes, du partage Google, des données synchronisées ou de la logique de connexion.

### Bandeau du mode de test

Texte proposé :
« Accès de test : cette connexion est actuellement réservée aux comptes autorisés. »

Retirer la mention systématique des sept jours : le mode de test Clementplane ne définit pas à lui seul le statut du projet OAuth Google. Les messages existants de reconnexion restent utilisés lorsque Google retire ou laisse expirer l'autorisation.

### Confidentialité au moment de l'ouverture

Titre de section proposé :
« Synchronisation facultative Google Agenda »

Conserver les explications existantes sur les données copiées, les options rémunération/notes, le chiffrement, les destinataires, la déconnexion et la conservation.

Remplacer uniquement la dernière phrase de la section par :
« La connexion est facultative et se fait depuis les paramètres du compte formateur. Clementplane crée un calendrier séparé nommé “Prénom Nom — Clementplane”, dont le titulaire contrôle les paramètres de partage dans Google. »

Mettre à jour la date de la politique lors du déploiement effectif. Ce texte doit être déployé avec l'ouverture, et non annoncer une disponibilité générale avant son activation.

## Informations utilisateur conservées

- Invitation non bloquante après la première mission ; connexion volontaire.
- Calendrier séparé ; partager l'agenda principal ne partage pas automatiquement ce calendrier.
- Propositions/options disponibles ; missions confirmées occupées ; événements privés.
- Rémunération et notes privées exclues par défaut.
- Modifications à effectuer dans Clementplane ; aucune lecture des rendez-vous personnels Google.
- Partage en disponibilités seules conseillé aux organismes partenaires. Les droits avancés peuvent donner accès aux événements privés.
- Connexion et retour dans le même navigateur sur mobile.

## Limites de recette à accepter ou tester

PWA installée sur appareil réel non testée. Droits Google d'édition/gestion non testés dans la recette disponible. Les avertissements correspondants restent affichés ; aucune règle Workspace à modifier pour les tests.

## Journaux : portée des preuves

L'absence du témoin dans une vue de logs ne démontre pas l'absence de collecte amont. La documentation Vercel mentionne des paramètres de recherche dans les détails de requête et une conservation des Runtime Logs Hobby d'une heure ; cette durée ne couvre pas nécessairement tous les journaux internes de la plateforme. Ne pas qualifier l'ensemble des journaux comme exempt de paramètres OAuth.

Source officielle : https://vercel.com/docs/logs/runtime (consultée le 14 octobre 2026).

## Vérification et décision suivantes

Avant déploiement des textes : compilation et contrôle du rendu de la carte et de la politique, sans modifier les paramètres d'activation dans ce brouillon.
Avant ouverture générale : validation de ces formulations et décision explicite sur les limites de recette, puis activation du mode public autorisée. Un contrôle de connexion d'un second compte autorisé vérifiera ensuite l'ouverture.
