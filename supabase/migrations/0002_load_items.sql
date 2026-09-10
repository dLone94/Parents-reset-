-- Milestone 2A – Family Load
-- Simplifies load_items to what the feature actually needs: a title, a
-- category, a status, and when it was completed or postponed until.

alter table public.load_items add column if not exists postponed_until timestamptz;
alter table public.load_items drop column if exists weight;
alter table public.load_items drop column if exists due_on;
