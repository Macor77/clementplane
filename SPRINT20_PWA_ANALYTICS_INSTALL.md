# Sprint 20 — Installation & statistiques PWA

Migration Supabase : `supabase/migrations/20260827113000_sprint20_pwa_analytics.sql`.

Projet Clementplane attendu : `hctvkynrgmnxjynbncdi` (`clementplane`).

Avant toute migration distante :

```bash
npx supabase login
npx supabase link --project-ref hctvkynrgmnxjynbncdi
cat supabase/.temp/project-ref
npx supabase migration list
```

La commande `cat` doit afficher exactement `hctvkynrgmnxjynbncdi`. Vérifier ensuite que la seule migration locale non appliquée attendue pour ce lot est `20260827113000_sprint20_pwa_analytics.sql` avant d'exécuter :

```bash
npx supabase db push
```

Après application, vérifier l'Admin et la table `product_events` selon `docs/TESTING.md`.
