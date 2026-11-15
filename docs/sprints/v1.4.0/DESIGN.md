# V1.4.0 — dépenses privées par ligne

Demande de Vincent du 15 novembre 2026. Base main a580021 (V1.3.2). Développement ciblé autorisé, production explicitement interdite sans nouvelle validation. Une mission = une session = un groupe. Statistiques, agendas et messages hors périmètre.

## Architecture retenue

- Réutilisation de trainer_activity_private et de sa RLS SELECT propriétaire uniquement ; aucun accès DML direct. Pas de nouvelle table publique, de nouvelle API de lecture ni de vue partageable. Le document JSONB structuré suffit aux futures agrégations par catégorie/mission/période.
- expense_items est un tableau de lignes {id UUID, category, amount_cents entier, details texte}. Les onze codes stables sont validés côté client et serveur. Un même code peut se répéter, pas le même identifiant dans un bilan.
- Montants saisis en euros (virgule ou point), convertis par lecture des chiffres en centimes entiers. Calcul exact côté client et NUMERIC côté serveur. expenses devient le total dérivé ; aucun total reçu du navigateur. Plafond technique existant du total : 99 999 999,99 €.
- Précision facultative sauf other ; texte limité à 5 000 caractères par ligne. Les lignes entièrement vierges sont ignorées. Une ligne partielle doit être complétée ou supprimée. Aucun plafond métier du nombre de lignes.
- Sauvegarde atomique avec le bilan, révision optimiste et identifiant de reprise existants. Ajouter/modifier/supprimer marque le bilan non enregistré. Une erreur conserve le brouillon. La modification d’un autre champ renvoie la même liste.
- Input texte à clavier décimal pour prendre en charge la virgule française et signaler les valeurs non numériques, plutôt que les convertir silencieusement en champ vide. Toutes les valeurs sont validées avant la requête ; le serveur valide de nouveau.

## Migration et anciens clients

Migration additive 20261115110744_trainer_expense_items.sql générée avec la CLI Supabase 2.115.0. Ajout expense_items, legacy_expenses et legacy_expense_details, sans suppression ni modification des anciens champs lors de la migration. Toute ancienne saisie avec montant (zéro inclus) ou texte devient une seule ligne other ; UUID créé une fois. Le texte est conservé à l’identique. Si aucun texte utile n’existe, une mention d’origine neutre remplit la précision ; le texte exact reste archivé.

Un texte ancien sans montant devient une ligne à amount_cents=null. L’interface indique qu’elle ne contribue pas au total et permet de modifier les autres champs sans inventer de zéro. Le serveur n’accepte null que pour un identifiant déjà enregistré avec montant inconnu. Après avoir complété puis enregistré le montant, le retour à null est refusé ; zéro reste possible. Les archives d’origine restent visibles dans un volet fermé, exclues du total et non modifiables. Supprimer une ligne ne relance jamais la conversion depuis l’archive.

Une ancienne PWA qui n’envoie pas expense_items est refusée avec REPORT_APP_UPDATE_REQUIRED : aucune écriture partielle ni effacement. Une répétition exacte d’une ancienne requête déjà acquittée peut recevoir son résultat idempotent sans écriture. Déployer le frontend immédiatement après la migration lors de la publication autorisée.

## Préparation des statistiques

Les lignes sont privées et rattachées au report_id et à l’owner_user_id ; le bilan porte activity_date et l’identifiant de mission. Pour une future requête sous le rôle authentifié, joindre ces deux tables et déplier jsonb_array_elements(expense_items). Sommer amount_cents par category ou report_id ; filtrer activity_date pour la période. Les montants inconnus restent identifiables séparément. Compter une mission ayant des frais quand le total est strictement positif. Ne jamais additionner legacy_expenses ou les archives aux lignes, ni ventiler arbitrairement sur les journées. Cette règle de période doit être confirmée lors du futur sprint statistiques ; aucune UI ni requête Mes statistiques ne change ici.

## Confidentialité

L’OF et les autres formateurs ne lisent aucune ligne privée. La RPC dérive le propriétaire de auth.uid/current_trainer_profile_id ; elle conserve ses contrôles d’affectation et les bilans historiques. Le helper de validation est dans activity_private, search_path vide, EXECUTE révoqué aux rôles API. Aucun trigger de calendrier, événement ou service externe ajouté. Kms manuels et difficultés inchangés.
