-- Milestone 3 – accounts, history, community

-- Track which "today" items were ticked off on the result page.
alter table public.resets add column if not exists completed_item_ids text[] not null default '{}';

-- Anonymous display names live on the profile; posts copy the name at posting time.
alter table public.profiles alter column display_name set default null;

-- Reports on community content. Anyone signed in can file one; only the
-- service role reads them (moderation tooling comes later).
create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.community_posts (id) on delete cascade,
  comment_id uuid references public.community_comments (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in ('spam','harmful','personal_info','other')),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  check (post_id is not null or comment_id is not null)
);

alter table public.community_reports enable row level security;

create policy "reports: signed-in can insert own" on public.community_reports
  for insert with check (auth.uid() = reporter_id);

-- Convenience view with counts for the community list. Security invoker so
-- the underlying RLS still applies.
create or replace view public.community_posts_with_counts
with (security_invoker = true) as
select
  p.*,
  (select count(*) from public.community_comments c where c.post_id = p.id and c.status = 'visible') as comment_count,
  (select count(*) from public.community_supports s where s.post_id = p.id) as support_count
from public.community_posts p;

grant select on public.community_posts_with_counts to anon, authenticated;
