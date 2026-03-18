-- Development RLS policies for existing Worksy schema (profiles/jobs/proposals/messages/milestones)
-- This is intentionally permissive for local development.
-- Tighten these policies before production.

-- Ensure RLS is enabled on key tables
alter table if exists public.profiles enable row level security;
alter table if exists public.jobs enable row level security;
alter table if exists public.proposals enable row level security;
alter table if exists public.messages enable row level security;
alter table if exists public.milestones enable row level security;

-- Drop existing policies (safe re-run)
drop policy if exists profiles_select_all on public.profiles;
drop policy if exists profiles_insert_all on public.profiles;
drop policy if exists profiles_update_all on public.profiles;
drop policy if exists profiles_delete_all on public.profiles;

drop policy if exists jobs_select_all on public.jobs;
drop policy if exists jobs_insert_all on public.jobs;
drop policy if exists jobs_update_all on public.jobs;
drop policy if exists jobs_delete_all on public.jobs;

drop policy if exists proposals_select_all on public.proposals;
drop policy if exists proposals_insert_all on public.proposals;
drop policy if exists proposals_update_all on public.proposals;
drop policy if exists proposals_delete_all on public.proposals;

drop policy if exists messages_select_all on public.messages;
drop policy if exists messages_insert_all on public.messages;
drop policy if exists messages_update_all on public.messages;
drop policy if exists messages_delete_all on public.messages;

drop policy if exists milestones_select_all on public.milestones;
drop policy if exists milestones_insert_all on public.milestones;
drop policy if exists milestones_update_all on public.milestones;
drop policy if exists milestones_delete_all on public.milestones;

-- Profiles policies (this unblocks register profile creation)
create policy profiles_select_all on public.profiles for select using (true);
create policy profiles_insert_all on public.profiles for insert with check (true);
create policy profiles_update_all on public.profiles for update using (true) with check (true);
create policy profiles_delete_all on public.profiles for delete using (true);

-- Jobs policies
create policy jobs_select_all on public.jobs for select using (true);
create policy jobs_insert_all on public.jobs for insert with check (true);
create policy jobs_update_all on public.jobs for update using (true) with check (true);
create policy jobs_delete_all on public.jobs for delete using (true);

-- Proposals policies
create policy proposals_select_all on public.proposals for select using (true);
create policy proposals_insert_all on public.proposals for insert with check (true);
create policy proposals_update_all on public.proposals for update using (true) with check (true);
create policy proposals_delete_all on public.proposals for delete using (true);

-- Messages policies
create policy messages_select_all on public.messages for select using (true);
create policy messages_insert_all on public.messages for insert with check (true);
create policy messages_update_all on public.messages for update using (true) with check (true);
create policy messages_delete_all on public.messages for delete using (true);

-- Milestones policies
create policy milestones_select_all on public.milestones for select using (true);
create policy milestones_insert_all on public.milestones for insert with check (true);
create policy milestones_update_all on public.milestones for update using (true) with check (true);
create policy milestones_delete_all on public.milestones for delete using (true);

-- Refresh PostgREST schema cache
select pg_notify('pgrst', 'reload schema');
