-- Run in Supabase SQL Editor once.
create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('member','admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.member_status as enum ('active','blocked');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  role public.app_role not null default 'member',
  status public.member_status not null default 'active',
  headline text,
  company text,
  location text,
  bio text,
  building text,
  skills text[] not null default '{}',
  can_help text,
  looking_for text,
  linkedin_url text,
  website_url text,
  contact_email text,
  avatar_url text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_sender_created_idx on public.messages(sender_id,created_at desc);
create index if not exists messages_recipient_created_idx on public.messages(recipient_id,created_at desc);

create table if not exists public.admin_actions (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles(id),
  action text not null,
  target_user_id uuid references public.profiles(id),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin(uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=uid and role='admin' and status='active');
$$;
create or replace function public.is_active(uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=uid and status='active');
$$;

alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.admin_actions enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using ((status='active' and public.is_active()) or public.is_admin());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated using (id=auth.uid() and public.is_active()) with check (id=auth.uid() and public.is_active());

drop policy if exists messages_read_own on public.messages;
create policy messages_read_own on public.messages for select to authenticated using (public.is_active() and (sender_id=auth.uid() or recipient_id=auth.uid()));
drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages for insert to authenticated with check (public.is_active() and sender_id=auth.uid() and recipient_id<>auth.uid() and exists(select 1 from public.profiles p where p.id=recipient_id and p.status='active'));
drop policy if exists messages_mark_read on public.messages;
create policy messages_mark_read on public.messages for update to authenticated using (recipient_id=auth.uid() and public.is_active()) with check (recipient_id=auth.uid() and public.is_active());

drop policy if exists admin_actions_admin_read on public.admin_actions;
create policy admin_actions_admin_read on public.admin_actions for select to authenticated using (public.is_admin());

revoke all on public.profiles from anon;
revoke all on public.messages from anon;
grant select on public.profiles to authenticated;
grant update (headline,company,location,bio,building,skills,can_help,looking_for,linkedin_url,website_url,contact_email,avatar_url,updated_at,last_seen_at) on public.profiles to authenticated;
grant select,insert on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;
grant select on public.admin_actions to authenticated;
