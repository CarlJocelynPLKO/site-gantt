-- Revues de projet (table tasks = projets dans l'app)
alter table public.tasks
  add column if not exists review_first_date date;

alter table public.tasks
  add column if not exists review_frequency_days integer;

alter table public.tasks
  add constraint tasks_review_frequency_days_positive
  check (review_frequency_days is null or review_frequency_days > 0);
