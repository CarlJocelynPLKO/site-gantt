-- =============================================================================
-- GanttAI — Équipes, personnes, affectations + RLS par utilisateur
-- Supabase → SQL Editor → New query → Run
--
-- Prérequis : activer Authentication (Email) dans Supabase.
-- Après exécution : créez un compte dans l'app (email / mot de passe).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Colonne user_id sur projects (propriétaire du projet)
-- ---------------------------------------------------------------------------
alter table public.projects
  add column if not exists group_id uuid,
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_group_id_idx on public.projects(group_id);

-- ---------------------------------------------------------------------------
-- 2. Table groups (équipes)
-- ---------------------------------------------------------------------------
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists groups_user_id_idx on public.groups(user_id);

-- FK projects → groups (après création de groups)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_group_id_fkey'
  ) then
    alter table public.projects
      add constraint projects_group_id_fkey
      foreign key (group_id) references public.groups(id) on delete set null;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Table people (membres d'une équipe)
-- ---------------------------------------------------------------------------
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  first_name text not null,
  job_title text not null,
  created_at timestamptz not null default now()
);

create index if not exists people_group_id_idx on public.people(group_id);

-- ---------------------------------------------------------------------------
-- 4. Table task_assignments (tâche ↔ personne, N-N)
-- ---------------------------------------------------------------------------
create table if not exists public.task_assignments (
  task_id uuid not null references public.tasks(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, person_id)
);

create index if not exists task_assignments_person_id_idx on public.task_assignments(person_id);

-- ---------------------------------------------------------------------------
-- 5. Droits SQL de base
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.groups to authenticated;
grant select, insert, update, delete on public.people to authenticated;
grant select, insert, update, delete on public.task_assignments to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Fonctions utilitaires RLS
-- ---------------------------------------------------------------------------
create or replace function public.is_group_owner(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = target_group_id
      and g.user_id = auth.uid()
  );
$$;

create or replace function public.is_project_owner(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and p.user_id = auth.uid()
  );
$$;

create or replace function public.is_task_owner(target_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = target_task_id
      and p.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 7. Activer RLS sur toutes les tables
-- ---------------------------------------------------------------------------
alter table public.groups enable row level security;
alter table public.people enable row level security;
alter table public.task_assignments enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

-- ---------------------------------------------------------------------------
-- 8. Supprimer les anciennes politiques ouvertes (prototype)
-- ---------------------------------------------------------------------------
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('projects', 'tasks', 'groups', 'people', 'task_assignments')
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      pol.policyname,
      pol.tablename
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 9. Politiques RLS — groups
-- ---------------------------------------------------------------------------
create policy "groups_select_own" on public.groups
  for select to authenticated
  using (user_id = auth.uid());

create policy "groups_insert_own" on public.groups
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "groups_update_own" on public.groups
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "groups_delete_own" on public.groups
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 10. Politiques RLS — people
-- ---------------------------------------------------------------------------
create policy "people_select_own_groups" on public.people
  for select to authenticated
  using (public.is_group_owner(group_id));

create policy "people_insert_own_groups" on public.people
  for insert to authenticated
  with check (public.is_group_owner(group_id));

create policy "people_update_own_groups" on public.people
  for update to authenticated
  using (public.is_group_owner(group_id))
  with check (public.is_group_owner(group_id));

create policy "people_delete_own_groups" on public.people
  for delete to authenticated
  using (public.is_group_owner(group_id));

-- ---------------------------------------------------------------------------
-- 11. Politiques RLS — projects
-- ---------------------------------------------------------------------------
create policy "projects_select_own" on public.projects
  for select to authenticated
  using (user_id = auth.uid());

create policy "projects_insert_own" on public.projects
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "projects_update_own" on public.projects
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "projects_delete_own" on public.projects
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 12. Politiques RLS — tasks
-- ---------------------------------------------------------------------------
create policy "tasks_select_own_projects" on public.tasks
  for select to authenticated
  using (public.is_project_owner(project_id));

create policy "tasks_insert_own_projects" on public.tasks
  for insert to authenticated
  with check (public.is_project_owner(project_id));

create policy "tasks_update_own_projects" on public.tasks
  for update to authenticated
  using (public.is_project_owner(project_id))
  with check (public.is_project_owner(project_id));

create policy "tasks_delete_own_projects" on public.tasks
  for delete to authenticated
  using (public.is_project_owner(project_id));

-- ---------------------------------------------------------------------------
-- 13. Politiques RLS — task_assignments
--     La personne doit appartenir au groupe du projet de la tâche
-- ---------------------------------------------------------------------------
create policy "task_assignments_select_own" on public.task_assignments
  for select to authenticated
  using (public.is_task_owner(task_id));

create policy "task_assignments_insert_own" on public.task_assignments
  for insert to authenticated
  with check (
    public.is_task_owner(task_id)
    and exists (
      select 1
      from public.tasks t
      join public.projects p on p.id = t.project_id
      join public.people pe on pe.id = person_id
      where t.id = task_id
        and p.group_id is not null
        and pe.group_id = p.group_id
    )
  );

create policy "task_assignments_delete_own" on public.task_assignments
  for delete to authenticated
  using (public.is_task_owner(task_id));

-- ---------------------------------------------------------------------------
-- 14. Trigger : renseigner user_id automatiquement à l'insertion d'un projet
-- ---------------------------------------------------------------------------
create or replace function public.set_project_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_projects_set_user_id on public.projects;
create trigger trg_projects_set_user_id
  before insert on public.projects
  for each row execute function public.set_project_user_id();

-- ---------------------------------------------------------------------------
-- 15. Trigger : renseigner user_id automatiquement à l'insertion d'un groupe
-- ---------------------------------------------------------------------------
create or replace function public.set_group_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_groups_set_user_id on public.groups;
create trigger trg_groups_set_user_id
  before insert on public.groups
  for each row execute function public.set_group_user_id();
