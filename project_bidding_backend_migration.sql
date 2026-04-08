-- Worksy project posting + bidding integration migration
-- Run this in Supabase SQL Editor.

begin;

-- 1) Keep proposal schema aligned with app workflow
alter table if exists public.proposals
  add column if not exists timeline text,
  add column if not exists work_status text check (work_status in ('not_started', 'in_progress', 'submitted', 'completed')) default 'not_started';

-- 2) Optional helper: avoid duplicate bids from same freelancer for same job
create unique index if not exists proposals_unique_job_freelancer_idx
  on public.proposals (job_id, freelancer_id);

-- 3) RLS policies for proposal updates
alter table if exists public.proposals enable row level security;

-- Allow freelancers to revise their own proposal content/status while pending/rejected.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'proposals'
      and policyname = 'Freelancers can update own proposals'
  ) then
    create policy "Freelancers can update own proposals" on public.proposals
      for update
      using (auth.uid() = freelancer_id)
      with check (auth.uid() = freelancer_id);
  end if;
end $$;

-- Allow job owners (clients) to accept/reject bids on their jobs.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'proposals'
      and policyname = 'Clients can update proposals on own jobs'
  ) then
    create policy "Clients can update proposals on own jobs" on public.proposals
      for update
      using (
        exists (
          select 1
          from public.jobs
          where jobs.id = proposals.job_id
            and jobs.client_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.jobs
          where jobs.id = proposals.job_id
            and jobs.client_id = auth.uid()
        )
      );
  end if;
end $$;

-- 4) Optional: ensure jobs updates are allowed for owners (already present in base schema)
-- Left here as no-op check for environments that drifted.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'jobs'
      and policyname = 'Clients can update own jobs.'
  ) then
    create policy "Clients can update own jobs." on public.jobs
      for update
      using (auth.uid() = client_id);
  end if;
end $$;

commit;
