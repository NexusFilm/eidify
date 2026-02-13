-- Migration: Row Level Security policies (idempotent with DROP IF EXISTS)

-- helper function
create or replace function public.get_user_tenant_id()
returns uuid as $$
  select tenant_id from public.user_profiles where id = (select auth.uid());
$$ language sql security definer stable;

-- TENANTS
drop policy if exists "Authenticated users can view their own tenant" on public.tenants;
create policy "Authenticated users can view their own tenant"
  on public.tenants for select to authenticated
  using (id = (select public.get_user_tenant_id()));

drop policy if exists "Authenticated users can update their own tenant" on public.tenants;
create policy "Authenticated users can update their own tenant"
  on public.tenants for update to authenticated
  using (id = (select public.get_user_tenant_id()))
  with check (id = (select public.get_user_tenant_id()));

-- USER_PROFILES
drop policy if exists "Users can view profiles in their tenant" on public.user_profiles;
create policy "Users can view profiles in their tenant"
  on public.user_profiles for select to authenticated
  using (tenant_id = (select public.get_user_tenant_id()));

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile"
  on public.user_profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- PROJECTS
drop policy if exists "Users can view projects in their tenant" on public.projects;
create policy "Users can view projects in their tenant"
  on public.projects for select to authenticated
  using (tenant_id = (select public.get_user_tenant_id()));

drop policy if exists "Users can create projects in their tenant" on public.projects;
create policy "Users can create projects in their tenant"
  on public.projects for insert to authenticated
  with check (tenant_id = (select public.get_user_tenant_id()));

drop policy if exists "Users can update their own projects" on public.projects;
create policy "Users can update their own projects"
  on public.projects for update to authenticated
  using (user_id = (select auth.uid()) and tenant_id = (select public.get_user_tenant_id()))
  with check (user_id = (select auth.uid()) and tenant_id = (select public.get_user_tenant_id()));

drop policy if exists "Users can delete their own projects" on public.projects;
create policy "Users can delete their own projects"
  on public.projects for delete to authenticated
  using (user_id = (select auth.uid()) and tenant_id = (select public.get_user_tenant_id()));

-- IMAGES
drop policy if exists "Users can view images in their tenant" on public.images;
create policy "Users can view images in their tenant"
  on public.images for select to authenticated
  using (tenant_id = (select public.get_user_tenant_id()));

drop policy if exists "Users can upload images to their tenant" on public.images;
create policy "Users can upload images to their tenant"
  on public.images for insert to authenticated
  with check (tenant_id = (select public.get_user_tenant_id()));

drop policy if exists "Users can update their own images" on public.images;
create policy "Users can update their own images"
  on public.images for update to authenticated
  using (user_id = (select auth.uid()) and tenant_id = (select public.get_user_tenant_id()))
  with check (user_id = (select auth.uid()) and tenant_id = (select public.get_user_tenant_id()));

drop policy if exists "Users can delete their own images" on public.images;
create policy "Users can delete their own images"
  on public.images for delete to authenticated
  using (user_id = (select auth.uid()) and tenant_id = (select public.get_user_tenant_id()));

-- PROCESSING_HISTORY
drop policy if exists "Users can view their processing history" on public.processing_history;
create policy "Users can view their processing history"
  on public.processing_history for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can create processing history entries" on public.processing_history;
create policy "Users can create processing history entries"
  on public.processing_history for insert to authenticated
  with check (user_id = (select auth.uid()));

-- CHATBOT_CONVERSATIONS
drop policy if exists "Users can view their own conversations" on public.chatbot_conversations;
create policy "Users can view their own conversations"
  on public.chatbot_conversations for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can create conversation messages" on public.chatbot_conversations;
create policy "Users can create conversation messages"
  on public.chatbot_conversations for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own conversations" on public.chatbot_conversations;
create policy "Users can delete their own conversations"
  on public.chatbot_conversations for delete to authenticated
  using (user_id = (select auth.uid()));

-- BATCH_JOBS
drop policy if exists "Users can view batch jobs in their tenant" on public.batch_jobs;
create policy "Users can view batch jobs in their tenant"
  on public.batch_jobs for select to authenticated
  using (tenant_id = (select public.get_user_tenant_id()));

drop policy if exists "Users can create batch jobs in their tenant" on public.batch_jobs;
create policy "Users can create batch jobs in their tenant"
  on public.batch_jobs for insert to authenticated
  with check (tenant_id = (select public.get_user_tenant_id()));

drop policy if exists "Users can update their own batch jobs" on public.batch_jobs;
create policy "Users can update their own batch jobs"
  on public.batch_jobs for update to authenticated
  using (user_id = (select auth.uid()) and tenant_id = (select public.get_user_tenant_id()))
  with check (user_id = (select auth.uid()) and tenant_id = (select public.get_user_tenant_id()));

drop policy if exists "Users can delete their own batch jobs" on public.batch_jobs;
create policy "Users can delete their own batch jobs"
  on public.batch_jobs for delete to authenticated
  using (user_id = (select auth.uid()) and tenant_id = (select public.get_user_tenant_id()));
