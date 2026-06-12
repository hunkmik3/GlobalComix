-- Shared workspace access for GlobalComix.
-- Goal: any signed-in (authenticated) user can read/write comics, chapters and panels,
-- and read all profiles + panel_assets. Run this once in the Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).
--
-- Edge functions keep using the service-role key, which bypasses RLS, so they are
-- unaffected by these policies.

-- ===== Table-level privileges for the authenticated role =====
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.comics   to authenticated;
grant select, insert, update, delete on public.chapters to authenticated;
grant select, insert, update, delete on public.panels   to authenticated;
grant select on public.panel_assets to authenticated;
grant select on public.profiles     to authenticated;

-- ===== Enable Row Level Security =====
alter table public.comics       enable row level security;
alter table public.chapters     enable row level security;
alter table public.panels       enable row level security;
alter table public.panel_assets enable row level security;
alter table public.profiles     enable row level security;

-- ===== Policies: full access to the workspace for any authenticated user =====
drop policy if exists "authenticated_all_comics" on public.comics;
create policy "authenticated_all_comics" on public.comics
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_all_chapters" on public.chapters;
create policy "authenticated_all_chapters" on public.chapters
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated_all_panels" on public.panels;
create policy "authenticated_all_panels" on public.panels
  for all to authenticated using (true) with check (true);

-- ===== Policies: read-only for assets + profiles =====
drop policy if exists "authenticated_read_panel_assets" on public.panel_assets;
create policy "authenticated_read_panel_assets" on public.panel_assets
  for select to authenticated using (true);

drop policy if exists "authenticated_read_profiles" on public.profiles;
create policy "authenticated_read_profiles" on public.profiles
  for select to authenticated using (true);
