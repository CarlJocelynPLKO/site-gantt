-- GanttAI — schéma + correction RLS
-- Supabase → SQL Editor → New query → coller tout → Run

-- 1. Tables
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  progress integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists tasks_project_id_idx on public.tasks(project_id);

-- 2. Droits de base pour les rôles Supabase
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.projects to anon, authenticated;
grant select, insert, update, delete on public.tasks to anon, authenticated;

-- 3. Activer RLS
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

-- 4. Supprimer TOUTES les anciennes politiques (évite les conflits)
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('projects', 'tasks')
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      pol.policyname,
      pol.tablename
    );
  end loop;
end $$;

-- 5. Politiques ouvertes (prototype / stage — pas pour production publique)
create policy "projects_select" on public.projects
  for select to anon, authenticated
  using (true);

create policy "projects_insert" on public.projects
  for insert to anon, authenticated
  with check (true);

create policy "projects_update" on public.projects
  for update to anon, authenticated
  using (true)
  with check (true);

create policy "projects_delete" on public.projects
  for delete to anon, authenticated
  using (true);

create policy "tasks_select" on public.tasks
  for select to anon, authenticated
  using (true);

create policy "tasks_insert" on public.tasks
  for insert to anon, authenticated
  with check (true);

create policy "tasks_update" on public.tasks
  for update to anon, authenticated
  using (true)
  with check (true);

create policy "tasks_delete" on public.tasks
  for delete to anon, authenticated
  using (true);
