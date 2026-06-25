-- Phases projet : Étude/Conception, Chantier, Livraison (somme = 100 %)
alter table public.tasks
  add column if not exists phase_etude_pct integer not null default 34;

alter table public.tasks
  add column if not exists phase_chantier_pct integer not null default 33;

alter table public.tasks
  add column if not exists phase_livraison_pct integer not null default 33;

alter table public.tasks
  drop constraint if exists tasks_phase_pct_range;

alter table public.tasks
  add constraint tasks_phase_pct_range
  check (
    phase_etude_pct between 0 and 100
    and phase_chantier_pct between 0 and 100
    and phase_livraison_pct between 0 and 100
  );

alter table public.tasks
  drop constraint if exists tasks_phase_pct_sum;

alter table public.tasks
  add constraint tasks_phase_pct_sum
  check (phase_etude_pct + phase_chantier_pct + phase_livraison_pct = 100);
