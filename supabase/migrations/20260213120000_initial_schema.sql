-- Migration: Initial schema for IOPaint multi-tenant platform
-- Purpose: Creates core tables (idempotent - uses IF NOT EXISTS)
-- Tables: tenants, user_profiles, projects, images, processing_history,
--         chatbot_conversations, batch_jobs

create extension if not exists "uuid-ossp";

-- tenants table
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now(),
  settings jsonb default '{}'::jsonb,
  storage_quota_mb integer default 1000,
  storage_used_mb integer default 0
);
alter table public.tenants enable row level security;

-- user_profiles table
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'member',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  settings jsonb default '{}'::jsonb
);
alter table public.user_profiles enable row level security;

-- projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  name text not null,
  description text,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  settings jsonb default '{}'::jsonb
);
alter table public.projects enable row level security;

-- images table
create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid not null references auth.users(id),
  original_filename text not null,
  storage_path text not null,
  file_size_bytes bigint not null,
  width integer not null,
  height integer not null,
  format text not null,
  status text not null default 'uploaded',
  created_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb
);
alter table public.images enable row level security;

-- processing_history table
create table if not exists public.processing_history (
  id uuid primary key default gen_random_uuid(),
  image_id uuid not null references public.images(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  operation_type text not null,
  parameters jsonb not null,
  result_path text,
  status text not null default 'pending',
  error_message text,
  processing_time_ms integer,
  created_at timestamptz default now(),
  completed_at timestamptz
);
alter table public.processing_history enable row level security;

-- chatbot_conversations table
create table if not exists public.chatbot_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  image_id uuid references public.images(id) on delete cascade,
  message text not null,
  role text not null,
  command_parsed jsonb,
  created_at timestamptz default now()
);
alter table public.chatbot_conversations enable row level security;

-- batch_jobs table
create table if not exists public.batch_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  operation_type text not null,
  parameters jsonb not null,
  image_ids uuid[] not null,
  status text not null default 'pending',
  progress integer default 0,
  total_images integer not null,
  created_at timestamptz default now(),
  completed_at timestamptz
);
alter table public.batch_jobs enable row level security;

-- indexes (idempotent)
create index if not exists idx_user_profiles_tenant on public.user_profiles using btree (tenant_id);
create index if not exists idx_projects_tenant on public.projects using btree (tenant_id);
create index if not exists idx_projects_user on public.projects using btree (user_id);
create index if not exists idx_images_tenant on public.images using btree (tenant_id);
create index if not exists idx_images_project on public.images using btree (project_id);
create index if not exists idx_images_user on public.images using btree (user_id);
create index if not exists idx_images_status on public.images using btree (status);
create index if not exists idx_processing_history_image on public.processing_history using btree (image_id);
create index if not exists idx_processing_history_user on public.processing_history using btree (user_id);
create index if not exists idx_chatbot_conversations_user on public.chatbot_conversations using btree (user_id);
create index if not exists idx_chatbot_conversations_image on public.chatbot_conversations using btree (image_id);
create index if not exists idx_batch_jobs_tenant on public.batch_jobs using btree (tenant_id);
create index if not exists idx_batch_jobs_user on public.batch_jobs using btree (user_id);
create index if not exists idx_batch_jobs_status on public.batch_jobs using btree (status);

-- trigger function for auto-updating updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- drop and recreate triggers to be idempotent
drop trigger if exists set_updated_at on public.user_profiles;
create trigger set_updated_at before update on public.user_profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.projects;
create trigger set_updated_at before update on public.projects
  for each row execute function public.handle_updated_at();

-- auto-create tenant and profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_tenant_id uuid;
begin
  insert into public.tenants (name, slug)
  values (
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.id::text
  )
  returning id into new_tenant_id;

  insert into public.user_profiles (id, tenant_id, display_name)
  values (
    new.id,
    new_tenant_id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
