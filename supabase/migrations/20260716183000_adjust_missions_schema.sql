-- ==========================================================
-- MINI SPRINT 6.1
-- Ajustement du modèle des missions
-- ==========================================================


-- ==========================================================
-- TABLE : missions
-- ==========================================================

alter table public.missions
    alter column client drop not null;

alter table public.missions
    alter column intitule drop not null;


alter table public.missions
    add column if not exists code_interne text,

    add column if not exists formation text,

    add column if not exists statut text
        not null
        default 'brouillon',

    add column if not exists competences text[]
        not null
        default '{}',

    add column if not exists materiel text[]
        not null
        default '{}',

    add column if not exists prix_vente numeric(10, 2),

    add column if not exists cout_formateur numeric(10, 2);


-- Seul le lieu est obligatoire directement dans la mission.
alter table public.missions
    alter column lieu set not null;


-- Contrôle des statuts possibles d'une mission.
alter table public.missions
    drop constraint if exists missions_statut_check;

alter table public.missions
    add constraint missions_statut_check
    check (
        statut in (
            'brouillon',
            'a_pourvoir',
            'affectee',
            'confirmee',
            'realisee',
            'annulee',
            'archivee'
        )
    );


-- Contrôle des montants.
alter table public.missions
    drop constraint if exists missions_prix_vente_check;

alter table public.missions
    add constraint missions_prix_vente_check
    check (
        prix_vente is null
        or prix_vente >= 0
    );


alter table public.missions
    drop constraint if exists missions_cout_formateur_check;

alter table public.missions
    add constraint missions_cout_formateur_check
    check (
        cout_formateur is null
        or cout_formateur >= 0
    );


-- ==========================================================
-- TABLE : mission_dates
-- ==========================================================

alter table public.mission_dates
    alter column heure_debut set default '09:00';

alter table public.mission_dates
    alter column heure_fin set default '17:00';


alter table public.mission_dates
    drop constraint if exists mission_dates_horaires_check;

alter table public.mission_dates
    add constraint mission_dates_horaires_check
    check (
        heure_debut is null
        or heure_fin is null
        or heure_fin > heure_debut
    );


-- Une même date ne doit pas être enregistrée deux fois
-- dans une même mission.
alter table public.mission_dates
    drop constraint if exists mission_dates_mission_id_date_key;

alter table public.mission_dates
    add constraint mission_dates_mission_id_date_key
    unique (mission_id, date);


-- ==========================================================
-- TABLE : mission_formateurs
-- ==========================================================

-- Suppression de la liaison incorrecte vers l'ancienne table
-- public.formateurs.
alter table public.mission_formateurs
    drop constraint if exists mission_formateurs_formateur_id_fkey;


-- Liaison vers la table réellement utilisée par TimeForma.
alter table public.mission_formateurs
    add constraint mission_formateurs_formateur_id_fkey
    foreign key (formateur_id)
    references public.trainers(id)
    on delete cascade;


-- Statut par défaut conforme au vocabulaire validé.
alter table public.mission_formateurs
    alter column statut set default 'selectionne';


alter table public.mission_formateurs
    drop constraint if exists mission_formateurs_statut_check;

alter table public.mission_formateurs
    add constraint mission_formateurs_statut_check
    check (
        statut in (
            'selectionne',
            'proposition_envoyee',
            'accepte',
            'refuse',
            'affecte',
            'annule'
        )
    );


-- Un formateur ne doit être lié qu'une seule fois
-- à une même mission.
alter table public.mission_formateurs
    drop constraint if exists mission_formateurs_mission_id_formateur_id_key;

alter table public.mission_formateurs
    add constraint mission_formateurs_mission_id_formateur_id_key
    unique (mission_id, formateur_id);


-- Informations utiles pour suivre les propositions.
alter table public.mission_formateurs
    add column if not exists propose_le timestamptz,

    add column if not exists repondu_le timestamptz,

    add column if not exists affecte_le timestamptz,

    add column if not exists commentaire text;


-- ==========================================================
-- MISE À JOUR AUTOMATIQUE DE updated_at
-- ==========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


drop trigger if exists missions_set_updated_at
on public.missions;

create trigger missions_set_updated_at
before update on public.missions
for each row
execute function public.set_updated_at();