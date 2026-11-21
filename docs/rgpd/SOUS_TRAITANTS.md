# Prestataires / sous-traitants — Clementplane

Version : 29/08/2026. Vérifier au moins annuellement les DPA, sous-traitants ultérieurs et lieux de traitement.

| Prestataire | Usage | Localisation / transfert à documenter | Action documentaire |
|---|---|---|---|
| Supabase | PostgreSQL, Auth, Edge Functions | projet Clementplane en eu-north-1, Stockholm (Suède) ; autres opérations du fournisseur selon DPA | conserver DPA et liste des subprocessors |
| Vercel | hébergement/déploiement web | fournisseur américain ; transferts éventuels hors EEE encadrés contractuellement | conserver DPA/SCC applicables et vérifier le plan contractuel utilisé |
| Brevo | e-mails transactionnels et nouveautés | infrastructure annoncée en UE ; vérifier sous-traitants du fournisseur | conserver DPA et liste des subprocessors |
| FirstHeberg | VPS du dossier professionnel, API privée, validation des pièces et antivirus | VPS à Valenciennes. Lieux d’accès du support et sous-traitants éventuels à confirmer. | Le 21 novembre 2026, le serveur de messagerie a rejeté la demande adressée à la boîte RGPD publiée (550 5.1.1, destinataire inconnu). La demande a été renvoyée à 11 h 33, heure de Paris, à l’adresse générale publiée dans les [CGV](https://www.firstheberg.com/fr/cgv). Prise en charge et accord applicable à confirmer. |
| Google Workspace | messagerie et outils de communication | traitements selon configuration et CDPA Google | conserver CDPA et liste des subprocessors |

Pour les données traitées par Clementplane pour le compte d’un OF, prévoir dans le cadre contractuel les clauses nécessaires au titre de l’article 28 RGPD lorsque Clementplane agit comme sous-traitant.

### V1.2 : connexion au Google Agenda du formateur
Mise en service publique autorisée le 14 octobre 2026. Ne pas assimiler le compte Google personnel/Workspace choisi par le formateur au contrat Google Workspace de Clementplane : qualification, conditions Google API/User Data Policy, localisation et garanties de transfert à valider pour ce flux. La revue de publication doit conserver les preuves correspondantes. Le prestataire d'authentification/calendrier reçoit les données volontairement exportées ; le formateur contrôle le partage côté Google.


## Outlook / Microsoft 365 — préparation du 28 octobre 2026

Connexion optionnelle au compte Microsoft choisi par le formateur ; ne pas confondre ce destinataire avec un contrat Microsoft détenu par Clementplane. Conditions personnelles/professionnelles, qualification, transferts et justificatifs à examiner avant activation ; aucune validation contractuelle inventée.

## 12 novembre 2026 — services publics de géocodage

IGN (`data.geopf.fr/geocodage/search`) : localisation des lieux saisis. API Découpage administratif (`geo.api.gouv.fr/communes`) : secours en cas d’indisponibilité, ville/code postal uniquement. Appels serveur sans identité ni jeton utilisateur transmis. Documentation du secours : https://geo.api.gouv.fr/decoupage-administratif/communes. Cet inventaire décrit les flux techniques ; il ne constitue pas une attestation de DPA, de lieu d’hébergement ou de durée de journalisation du fournisseur.

### Dossier professionnel · V1.8.0 candidate
Stockholm constatée pour le projet Supabase. Vercel sert le front. L’API documentaire utilise PostgreSQL et le service de validation privé traite les octets en clair pendant le contrôle sur le VPS FirstHeberg. ClamAV, Pillow, qpdf/pikepdf et PDFium sont exécutés sur cet hôte. L’actualiseur récupère des signatures sans soumettre de fichier. Brevo reçoit une adresse et le texte de l’invitation, du code ou du rappel, sans pièce jointe. Le 21 novembre 2026, le compte Brevo indique un mois de conservation des journaux et aucun aperçu enregistré pour les nouveaux messages. L’effet du réglage de suivi reste à vérifier sur un e-mail reçu. Accords applicables, sous-traitants ultérieurs, lieux d’assistance, accès du support et transferts restent à documenter avant ouverture. [Revue de qualification](../sprints/v1.8.0/LEGAL_REVIEW.md).
