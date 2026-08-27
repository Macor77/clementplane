# Formaplane — Sprint 10.2 Référentiel des compétences

Fichiers à copier dans le projet en conservant l'arborescence.

1. `supabase/migrations/20260814170000_competency_catalog.sql`
2. `src/services/competencyCatalogService.js`
3. `src/components/CompetencyInput.jsx`
4. `src/pages/FormateurForm.jsx`
5. `src/pages/trainer/TrainerProfile.jsx`
6. `src/pages/MissionForm.jsx`

Ordre conseillé :
- copier les fichiers ;
- lancer `npm run build` ;
- corriger toute erreur éventuelle avant migration ;
- lancer `npx supabase db push` ;
- lancer `npm run dev` et tester les trois écrans.

Le moteur de matching n'est pas refondu : `trainers.competences` et `missions.competences`
restent dans leur format actuel. Le catalogue sert à normaliser la saisie.
