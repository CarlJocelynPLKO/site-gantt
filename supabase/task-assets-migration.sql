-- Image de couverture et documents utiles (table tasks = projets)
alter table public.tasks
  add column if not exists cover_image_path text;

alter table public.tasks
  add column if not exists documents jsonb not null default '[]'::jsonb;

-- Bucket Storage (lecture publique pour afficher les images / liens)
insert into storage.buckets (id, name, public)
values ('project-assets', 'project-assets', true)
on conflict (id) do update set public = excluded.public;

-- Politiques Storage : chaque utilisateur dans son dossier {user_id}/...
drop policy if exists "project_assets_select" on storage.objects;
drop policy if exists "project_assets_insert" on storage.objects;
drop policy if exists "project_assets_update" on storage.objects;
drop policy if exists "project_assets_delete" on storage.objects;

create policy "project_assets_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'project-assets');

create policy "project_assets_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "project_assets_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "project_assets_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
