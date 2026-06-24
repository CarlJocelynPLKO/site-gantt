-- Ajoute une description textuelle optionnelle aux projets (table tasks)
alter table public.tasks
  add column if not exists description text;
