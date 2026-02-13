-- Migration: Storage bucket setup for IOPaint
-- Purpose: Creates organized storage buckets with tenant isolation
-- Buckets: originals, processed, masks, projects

-- create storage buckets with descriptive labels
-- originals: stores original uploaded images before any processing
insert into storage.buckets (id, name, public)
values ('originals', 'originals', false);

-- processed: stores images after AI processing/editing
insert into storage.buckets (id, name, public)
values ('processed', 'processed', false);

-- masks: stores inpainting masks used for editing operations
insert into storage.buckets (id, name, public)
values ('masks', 'masks', false);

-- projects: stores project-specific files organized by project id
insert into storage.buckets (id, name, public)
values ('projects', 'projects', false);

-- storage policies: tenant-scoped access
-- pattern: {tenant_id}/filename.ext

-- originals bucket policies
create policy "Users can upload originals to their tenant folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'originals' and
    (storage.foldername(name))[1] = (select public.get_user_tenant_id())::text
  );

create policy "Users can view originals in their tenant folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'originals' and
    (storage.foldername(name))[1] = (select public.get_user_tenant_id())::text
  );

create policy "Users can delete originals in their tenant folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'originals' and
    (storage.foldername(name))[1] = (select public.get_user_tenant_id())::text
  );

-- processed bucket policies
create policy "Users can upload processed images to their tenant folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'processed' and
    (storage.foldername(name))[1] = (select public.get_user_tenant_id())::text
  );

create policy "Users can view processed images in their tenant folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'processed' and
    (storage.foldername(name))[1] = (select public.get_user_tenant_id())::text
  );

create policy "Users can delete processed images in their tenant folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'processed' and
    (storage.foldername(name))[1] = (select public.get_user_tenant_id())::text
  );

-- masks bucket policies
create policy "Users can upload masks to their tenant folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'masks' and
    (storage.foldername(name))[1] = (select public.get_user_tenant_id())::text
  );

create policy "Users can view masks in their tenant folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'masks' and
    (storage.foldername(name))[1] = (select public.get_user_tenant_id())::text
  );

create policy "Users can delete masks in their tenant folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'masks' and
    (storage.foldername(name))[1] = (select public.get_user_tenant_id())::text
  );

-- projects bucket policies
create policy "Users can upload to project folders in their tenant"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'projects' and
    (storage.foldername(name))[1] = (select public.get_user_tenant_id())::text
  );

create policy "Users can view project files in their tenant"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'projects' and
    (storage.foldername(name))[1] = (select public.get_user_tenant_id())::text
  );

create policy "Users can delete project files in their tenant"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'projects' and
    (storage.foldername(name))[1] = (select public.get_user_tenant_id())::text
  );
