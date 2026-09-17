-- Alerts a beneficiary when a donation matching their open need is published.
--
-- Run after 0002_delete_policies.sql.
--
-- The awkward part is who writes the row. The matching runs in the *donor's*
-- session, but the notification belongs to a *beneficiary* — so a plain INSERT
-- policy would have to let any authenticated user write a row addressed to
-- anyone else, which is an open spam channel.
--
-- Instead the only way in is a SECURITY DEFINER function that decides the
-- recipient itself. The caller passes need ids and a donation id; the function
-- verifies the donation is theirs, derives each recipient from the need's own
-- beneficiary_id, and refuses to write anything else. A caller cannot choose
-- who hears from them, cannot invent a donation, and cannot repeat itself.

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------

create table if not exists public.match_notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  need_id      uuid not null references public.needs (id) on delete cascade,
  donation_id  uuid not null references public.donations (id) on delete cascade,
  score        integer not null check (score between 0 and 100),
  read_at      timestamptz,
  created_at   timestamptz not null default now(),

  -- One alert per donation per need, ever. This is what makes the write
  -- idempotent, so re-running matching cannot flood an inbox.
  unique (need_id, donation_id)
);

create index if not exists match_notifications_unread_idx
  on public.match_notifications (user_id, read_at, created_at desc);

alter table public.match_notifications enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Read / update own notifications
-- ---------------------------------------------------------------------------
-- No INSERT policy on purpose: every write goes through the function below.

drop policy if exists "read own notifications" on public.match_notifications;
create policy "read own notifications"
  on public.match_notifications
  for select
  to authenticated
  using (user_id = auth.uid());

-- Marking as read is the only field a recipient may change; the WITH CHECK
-- clause stops a row being re-addressed to someone else on the way through.
drop policy if exists "mark own notifications read" on public.match_notifications;
create policy "mark own notifications read"
  on public.match_notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "delete own notifications" on public.match_notifications;
create policy "delete own notifications"
  on public.match_notifications
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. The only writer
-- ---------------------------------------------------------------------------

create or replace function public.notify_matching_needs(
  p_donation_id uuid,
  p_need_ids    uuid[],
  p_scores      integer[]
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
begin
  -- Refuse anything not obviously the caller's own freshly published item.
  if not exists (
    select 1
    from public.donations d
    where d.id = p_donation_id
      and d.donor_id = auth.uid()
  ) then
    raise exception 'donation % does not belong to the caller', p_donation_id
      using errcode = '42501';
  end if;

  if array_length(p_need_ids, 1) is distinct from array_length(p_scores, 1) then
    raise exception 'need ids and scores must be the same length'
      using errcode = '22023';
  end if;

  -- A hard ceiling regardless of what the caller asked for: one published item
  -- can never fan out into more than a handful of inboxes.
  if coalesce(array_length(p_need_ids, 1), 0) > 10 then
    raise exception 'too many needs in one call' using errcode = '22023';
  end if;

  with candidates as (
    select
      unnest(p_need_ids) as need_id,
      unnest(p_scores)   as score
  )
  insert into public.match_notifications (user_id, need_id, donation_id, score)
  select n.beneficiary_id, n.id, p_donation_id, c.score
  from candidates c
  join public.needs n on n.id = c.need_id
  where n.status = 'pending'
    and n.beneficiary_id is not null
    -- Never tell donors about their own donation.
    and n.beneficiary_id <> auth.uid()
    and c.score between 0 and 100
  on conflict (need_id, donation_id) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke execute on function public.notify_matching_needs(uuid, uuid[], integer[]) from public;
grant execute on function public.notify_matching_needs(uuid, uuid[], integer[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Verify
-- ---------------------------------------------------------------------------
--   select policyname, cmd from pg_policies
--   where schemaname = 'public' and tablename = 'match_notifications';
--
--   select proname, prosecdef from pg_proc
--   where proname in ('notify_matching_needs', 'is_admin');
