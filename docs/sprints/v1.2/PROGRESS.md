# V1.2 — Avancement

| Étape | État |
| --- | --- |
| Développement et protections | Préparés et testés |
| Recette isolée et préversion | Opérationnelles |
| Retour OAuth PWA | Corrigé et vérifié |
| Connexion Google réelle et premières journées | Réussies |
| Statuts métier, revalidation, annulation et expiration autonome | Vérifiés côté serveur |
| Propriétés Google et retrait des champs optionnels | Vérifiés avec le compte propriétaire |
| Confidentialité en disponibilités seules et lecture des détails | Vérifiée avec deux comptes Google distincts le 9 octobre |
| Droits d’édition Google | Non testés : options indisponibles dans le partage de recette |
| Déconnexion et reconnexion du même compte Google | Réussies ; calendrier conservé, reprise sans doublon |
| Annulation OAuth | Retour après expiration rejeté sans réactivation ; refus avant expiration à rejouer |
| Appareil PWA réel | À terminer |
| Publication Google pour tous | Non effectuée |
| Fusion, production, tag et release publique | Non effectués |

La session de recette et la connexion Google sont rétablies. La déconnexion a supprimé le jeton conservé côté serveur sans supprimer le calendrier ni les événements ; la reconnexion a repris sur les mêmes identifiants. Restent le refus avant expiration, la PWA sur appareil réel et les conditions de publication décrites dans [ACCEPTANCE.md](ACCEPTANCE.md). Les preuves détaillées restent privées. Le cas d’édition n’est pas déclaré réussi.
