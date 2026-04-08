-- Proposal decision backend patch
-- Run this in Supabase SQL Editor.

begin;

-- Remove ambiguous overload if it exists from previous migrations.
drop function if exists public.set_proposal_decision(text, uuid);

alter table if exists public.proposals
  add column if not exists work_status text check (work_status in ('not_started', 'in_progress', 'submitted', 'completed')) default 'not_started',
  add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

create or replace function public.set_proposal_decision(
  p_proposal_id uuid,
  p_decision text
)
returns table(
  updated_proposal_id uuid,
  related_job_id uuid,
  proposal_status text,
  related_job_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid := auth.uid();
  v_job_id uuid;
begin
  if p_decision not in ('accepted', 'rejected') then
    raise exception 'Invalid decision. Use accepted or rejected.';
  end if;

  select p.job_id
  into v_job_id
  from public.proposals p
  join public.jobs j on j.id = p.job_id
  where p.id = p_proposal_id
    and j.client_id = v_client_id
  for update;

  if v_job_id is null then
    raise exception 'Proposal not found for this client.';
  end if;

  if p_decision = 'accepted' then
    update public.proposals
    set
      status = 'accepted',
      work_status = coalesce(work_status, 'not_started'),
      updated_at = timezone('utc'::text, now())
    where id = p_proposal_id;

    update public.proposals
    set
      status = 'rejected',
      updated_at = timezone('utc'::text, now())
    where job_id = v_job_id
      and id <> p_proposal_id
      and status = 'pending';

    update public.jobs
    set status = 'in_progress'
    where id = v_job_id;
  else
    update public.proposals
    set
      status = 'rejected',
      updated_at = timezone('utc'::text, now())
    where id = p_proposal_id
      and status = 'pending';

    if not exists (
      select 1
      from public.proposals
      where job_id = v_job_id
        and status = 'accepted'
    ) then
      update public.jobs
      set status = 'open'
      where id = v_job_id
        and status = 'in_progress';
    end if;
  end if;

  return query
  select
    p.id,
    p.job_id,
    p.status,
    j.status
  from public.proposals p
  join public.jobs j on j.id = p.job_id
  where p.id = p_proposal_id;
end;
$$;

grant execute on function public.set_proposal_decision(uuid, text) to authenticated;

commit;
