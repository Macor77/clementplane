-- Sprint 10 - suppression du statut métier "brouillon".
-- Toute mission créée entre directement dans le workflow "à pourvoir".

update public.missions
set statut = 'a_pourvoir'
where statut = 'brouillon';

alter table public.missions
  alter column statut set default 'a_pourvoir';

alter table public.missions
  drop constraint if exists missions_statut_check;

alter table public.missions
  add constraint missions_statut_check
  check (
    statut in (
      'a_pourvoir',
      'affectee',
      'confirmee',
      'realisee',
      'annulee',
      'archivee'
    )
  );
