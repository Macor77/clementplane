# Sprint 19 — Mes OF & invitations organisme

Ordre d'intégration recommandé depuis la racine du projet :

```bash
unzip -o Formaplane_Sprint19_Etape9_MesOF_Invitations.zip
npx supabase login
npx supabase link --project-ref <VOTRE_PROJECT_REF>
npx supabase db push
npx supabase functions deploy send-transactional-email
npm run dev
```

Recette fonctionnelle :
1. Espace Formateur → Mes OF → ajouter un organisme non inscrit.
2. Envoyer l'invitation ; vérifier l'e-mail reçu.
3. Vérifier que le bouton est bloqué 7 jours après un envoi réussi.
4. Ouvrir le lien d'invitation → inscription/connexion OF.
5. Vérifier l'arrivée sur la fiche du formateur.
6. Cliquer `Ajouter à mon réseau`.
7. Retour côté Formateur → Mes OF → actualiser : l'OF doit être `Sur Formaplane` et le formateur `Dans son réseau`.
8. Ouvrir `Partager mes disponibilités` : la même liste d'OF doit être présente.
