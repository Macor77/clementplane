# Mes OF & invitations organisme — Design

## Objectif
Créer dans l’espace Formateur un carnet central « Mes OF », utilisé comme source unique par « Partager mes disponibilités », avec statut Formaplane, invitation d’un OF, anti-spam 7 jours et parcours de redirection vers la fiche du formateur invitant.

## Parcours Formateur
- Nouveau menu « Mes OF » placé avant « Partager mes disponibilités ».
- La page liste les contacts déjà stockés dans `trainer_availability_contacts`; aucune duplication de carnet.
- Chaque contact affiche : organisme, contact, e-mail, téléphone, statut `Sur Formaplane` / `Pas encore sur Formaplane`, et état de référencement.
- Si l’OF n’est pas sur Formaplane : CTA `Inviter sur Formaplane`.
- Après un envoi réussi, nouvel envoi interdit pendant 7 jours complets par couple formateur + adresse e-mail. Le serveur expose la date/heure du prochain envoi autorisé.
- Dès que l’adresse e-mail correspond à un membre actif d’un OF Formaplane, le CTA d’invitation disparaît.
- « Partager mes disponibilités » ne gère plus son propre carnet : il lit les mêmes contacts centralisés.
- La modale pédagogique de partage envoie `Inviter un organisme` vers `/formateur/mes-of?ajouter=1`.

## Parcours OF invité
- L’e-mail contient un lien d’invitation Formaplane lié au formateur invitant.
- Le lien ouvre `/invitation-of/:token`.
- OF non inscrit : création d’espace OF, avec e-mail et organisme préremplis lorsque disponibles. Après confirmation/connexion, retour dans le contexte d’invitation.
- OF déjà inscrit : connexion puis retour dans le contexte d’invitation.
- Une fois un espace OF actif disponible, Formaplane redirige vers `/formateur/view/:trainerId?space=organization`.

## Fiche formateur côté OF
- Un OF authentifié peut consulter la fiche d’un formateur revendiqué même hors de son réseau.
- Si le formateur n’est pas encore dans le réseau : afficher uniquement son profil public (identité, ville, compétences, matériel), masquer ses coordonnées détaillées et les données internes OF (tarif, statut interne, notes internes, actions d’édition), puis afficher le CTA `Ajouter à mon réseau`.
- Après ajout, la fiche repasse dans son comportement normal.
- La recherche globale permet d’ouvrir la fiche avant de l’ajouter.

## Données & sécurité
- Le carnet existant `trainer_availability_contacts` reste la source de vérité.
- Le statut « Sur Formaplane » est résolu côté serveur par correspondance exacte de l’e-mail du contact avec un utilisateur membre actif d’un OF; si une seule organisation est déterminable, elle est renvoyée comme `organization_id` résolu.
- Les invitations utilisent `email_logs` (`email_type = trainer_organization_invitation`) pour l’historique et le cooldown; aucune nouvelle table d’historique n’est nécessaire.
- Une RPC `reserve_my_trainer_organization_invitation` effectue une réservation atomique avant envoi et applique le cooldown de 7 jours côté serveur.
- Le token public d’invitation est un UUID aléatoire stocké uniquement dans les métadonnées du journal e-mail; une RPC publique n’expose que les données nécessaires au parcours d’invitation.
- Une invitation échouée ne bloque pas 7 jours; les statuts envoyés/délivrés/bounces/différés comptent comme tentative ayant quitté Formaplane.
