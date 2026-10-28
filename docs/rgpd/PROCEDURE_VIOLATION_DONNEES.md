# Procédure de violation de données personnelles

1. Contenir l’incident : couper l’accès compromis, révoquer les secrets/tokens concernés, préserver les éléments utiles.
2. Documenter immédiatement : date de découverte, systèmes, catégories de données/personnes, volume estimé, cause, conséquences et mesures.
3. Évaluer le risque pour les personnes. Toute violation est inscrite au registre interne, même si elle n’est pas notifiée.
4. Si la violation est susceptible d’engendrer un risque pour les droits et libertés, préparer la notification à la CNIL dans les 72 heures après en avoir pris connaissance ; si le délai est dépassé, documenter les motifs.
5. En cas de risque élevé, informer aussi les personnes concernées sans délai indu, sauf exception légale applicable.
6. Si Clementplane agit comme sous-traitant d’un OF pour les données touchées, informer l’OF sans délai et lui fournir les éléments nécessaires.
7. Après incident : corriger la cause, vérifier l’efficacité, compléter le registre et les mesures préventives.


## Application à Google Agenda — 15 octobre 2026

Inclure les copies Google et accès OAuth dans le périmètre d’un incident. Contenir par suspension de la synchronisation et révocation des autorisations concernées selon l’incident ; préserver uniquement les métadonnées nécessaires. Ne pas exporter de secrets pour l’enquête. Informer le titulaire des copies qui restent dans Google et vérifier les partages concernés. Le cadre général ci-dessus est conservé.


## Outlook / Microsoft 365 — préparation du 28 octobre 2026

Microsoft (préparé) : contenir par mode disabled et suspension du seul cron Microsoft, retirer les autorisations avec le titulaire, examiner copies et partages. Ne pas extraire les tokens ni les files pg_net dans les preuves d’incident.
