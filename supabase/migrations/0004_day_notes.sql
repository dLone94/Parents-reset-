-- Milestone 4 – evening closes
--
-- One row per parent per local calendar day. Every field is nullable: a day
-- closed with only the weather is a closed day, and the app treats it as one.
-- The day is stored as the user's local date (YYYY-MM-DD), not a timestamp,
-- because "which day was that" is a human question, not a UTC one.

create table if not exists public.day_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  locale text not null,
  weather text check (weather in ('storm', 'rain', 'cloudy', 'sun')),
  hard text check (char_length(hard) <= 500),
  kept text check (char_length(kept) <= 500),
  tomorrow text check (char_length(tomorrow) <= 200)
);

-- Closing the same evening twice edits the row instead of stacking duplicates.
create unique index if not exists day_notes_user_day_idx on public.day_notes (user_id, day);
create index if not exists day_notes_user_created_idx on public.day_notes (user_id, day desc);

alter table public.day_notes enable row level security;

create policy "day_notes: select own" on public.day_notes
  for select using (auth.uid() = user_id);

create policy "day_notes: insert own" on public.day_notes
  for insert with check (auth.uid() = user_id);

create policy "day_notes: update own" on public.day_notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "day_notes: delete own" on public.day_notes
  for delete using (auth.uid() = user_id);
