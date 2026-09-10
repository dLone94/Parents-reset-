-- Parent Reset – initial schema
-- Run with: supabase db push   (or paste into the Supabase SQL editor)
--
-- Principles
-- * Store the minimum. Free text is kept verbatim, never rewritten.
-- * Every private table has Row Level Security: users only see their own rows.
-- * Community tables are public to read, but only owners can edit or delete.
-- * Deleting a user cascades everywhere, which is what "delete my account" needs.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 40),
  -- BCP-47 language code: en, de, fr, ..., zh, ja (zh-CN / zh-TW allowed later)
  locale text not null default 'en' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  -- ISO 4217, chosen by the user; never inferred from the UI language
  currency text check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner can read" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: owner can insert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles: owner can update" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles: owner can delete" on public.profiles
  for delete using (auth.uid() = id);

-- Create a profile row automatically on sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, locale)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'locale', 'en'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- resets (one Parent Reset check-in)
-- ---------------------------------------------------------------------------
create table if not exists public.resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  locale text not null default 'en',
  overwhelm smallint not null check (overwhelm between 1 and 10),
  areas text[] not null default '{}'
    check (areas <@ array['kids','money','work','home','relationship','health','other']::text[]),
  time_available text not null check (time_available in ('under30','30to60','1to2h','over2h')),
  money_pressure boolean not null default false,
  must_happen text not null check (char_length(must_happen) <= 500),
  on_mind text check (char_length(on_mind) <= 1000),
  summary_key text not null,
  time_key text not null,
  safety_flag boolean not null default false
);

create index if not exists resets_user_created_idx on public.resets (user_id, created_at desc);

alter table public.resets enable row level security;

create policy "resets: owner can read" on public.resets
  for select using (auth.uid() = user_id);
create policy "resets: owner can insert" on public.resets
  for insert with check (auth.uid() = user_id);
create policy "resets: owner can update" on public.resets
  for update using (auth.uid() = user_id);
create policy "resets: owner can delete" on public.resets
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- reset_items (plan lines for a reset)
-- ---------------------------------------------------------------------------
create table if not exists public.reset_items (
  id text primary key,
  reset_id uuid not null references public.resets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  bucket text not null check (bucket in ('today','thisWeek','letGo')),
  position smallint not null default 0,
  source text not null check (source in ('user','planner')),
  text text check (char_length(text) <= 500),
  message_key text,
  area text check (area in ('kids','money','work','home','relationship','health','other')),
  note_key text
);

create index if not exists reset_items_reset_idx on public.reset_items (reset_id, position);

alter table public.reset_items enable row level security;

create policy "reset_items: owner can read" on public.reset_items
  for select using (auth.uid() = user_id);
create policy "reset_items: owner can insert" on public.reset_items
  for insert with check (auth.uid() = user_id);
create policy "reset_items: owner can update" on public.reset_items
  for update using (auth.uid() = user_id);
create policy "reset_items: owner can delete" on public.reset_items
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- load_items (Family Load – Milestone 2)
-- ---------------------------------------------------------------------------
create table if not exists public.load_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('kids','money','home','work','relationship','me')),
  title text not null check (char_length(title) between 1 and 120),
  weight smallint not null default 1 check (weight between 1 and 5),
  status text not null default 'open' check (status in ('open','done','postponed')),
  due_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists load_items_user_idx on public.load_items (user_id, status, category);

alter table public.load_items enable row level security;

create policy "load_items: owner can read" on public.load_items
  for select using (auth.uid() = user_id);
create policy "load_items: owner can insert" on public.load_items
  for insert with check (auth.uid() = user_id);
create policy "load_items: owner can update" on public.load_items
  for update using (auth.uid() = user_id);
create policy "load_items: owner can delete" on public.load_items
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- community (Milestone 3) – public read, owner write, anonymous-first
-- ---------------------------------------------------------------------------
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  -- Display name captured at posting time so posts stay anonymous even if the
  -- profile changes later.
  display_name text not null check (char_length(display_name) between 1 and 40),
  category text not null check (category in (
    'toddlers','school_age','money_stress','no_time','relationships',
    'dads','mums','single_parents','moving','general')),
  -- Original language of the post (for a future "translate" feature). Text is
  -- stored exactly as submitted and never rewritten.
  locale text not null default 'en',
  title text not null check (char_length(title) between 3 and 140),
  body text not null check (char_length(body) between 1 and 4000),
  status text not null default 'visible' check (status in ('visible','hidden','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_category_idx on public.community_posts (category, created_at desc);

alter table public.community_posts enable row level security;

create policy "posts: anyone can read visible" on public.community_posts
  for select using (status = 'visible' or auth.uid() = author_id);
create policy "posts: authenticated can insert own" on public.community_posts
  for insert with check (auth.uid() = author_id);
create policy "posts: owner can update" on public.community_posts
  for update using (auth.uid() = author_id);
create policy "posts: owner can delete" on public.community_posts
  for delete using (auth.uid() = author_id);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  locale text not null default 'en',
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'visible' check (status in ('visible','hidden','removed')),
  created_at timestamptz not null default now()
);

create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at);

alter table public.community_comments enable row level security;

create policy "comments: anyone can read visible" on public.community_comments
  for select using (status = 'visible' or auth.uid() = author_id);
create policy "comments: authenticated can insert own" on public.community_comments
  for insert with check (auth.uid() = author_id);
create policy "comments: owner can update" on public.community_comments
  for update using (auth.uid() = author_id);
create policy "comments: owner can delete" on public.community_comments
  for delete using (auth.uid() = author_id);

create table if not exists public.community_supports (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.community_supports enable row level security;

create policy "supports: anyone can read" on public.community_supports
  for select using (true);
create policy "supports: owner can insert" on public.community_supports
  for insert with check (auth.uid() = user_id);
create policy "supports: owner can delete" on public.community_supports
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
drop trigger if exists load_items_set_updated_at on public.load_items;
create trigger load_items_set_updated_at before update on public.load_items
  for each row execute procedure public.set_updated_at();
drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at before update on public.community_posts
  for each row execute procedure public.set_updated_at();
