-- Fixes silent no-op deletes.
--
-- `donations` and `needs` have no DELETE policy at all, so PostgREST answers
-- every delete with HTTP 200 and zero rows removed. The dashboard read that as
-- success, dropped the row from local state and showed a confirmation, so the
-- row reappeared on the next refresh. Verified against the live database:
-- neither a donor deleting their own donation nor an admin deleting any need
-- removed anything.
--
-- Run this in the Supabase SQL editor after 0001_smart_matching.sql.

-- ---------------------------------------------------------------------------
-- 1. Admin check
-- ---------------------------------------------------------------------------
-- Reading `profiles` from inside a policy ON `profiles` would recurse, so the
-- lookup goes through a SECURITY DEFINER function, which runs as the owner and
-- is therefore not itself subject to row-level security. `search_path` is
-- pinned so the function cannot be redirected at a shadowed table.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Donations
-- ---------------------------------------------------------------------------
-- A donor may remove their own item, except while it is 'reserved': at that
-- point a beneficiary is waiting on the delivery, and deleting it would strand
-- them. Admins are not restricted.

drop policy if exists "donors delete own donations" on public.donations;
create policy "donors delete own donations"
  on public.donations
  for delete
  to authenticated
  using (donor_id = auth.uid() and status <> 'reserved');

drop policy if exists "admins delete any donation" on public.donations;
create policy "admins delete any donation"
  on public.donations
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Needs
-- ---------------------------------------------------------------------------
-- Same shape: a beneficiary may withdraw their own request unless a donor is
-- already delivering against it.

drop policy if exists "beneficiaries delete own needs" on public.needs;
create policy "beneficiaries delete own needs"
  on public.needs
  for delete
  to authenticated
  using (beneficiary_id = auth.uid() and status <> 'pending_delivery');

drop policy if exists "admins delete any need" on public.needs;
create policy "admins delete any need"
  on public.needs
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Profiles
-- ---------------------------------------------------------------------------
-- NOTE: this removes the profile row only. The matching account in auth.users
-- survives, and can still sign in — landing in an app with no profile. Fully
-- deleting a user needs the Admin API and a service-role key, which is also
-- why handleAdminCreateUser in the dashboard is still a stub. Treat the admin
-- "delete user" action as "revoke access to the app", not "erase the account",
-- until a service-role endpoint exists.
--
-- The self-exclusion stops an admin from deleting their own profile and
-- locking every admin action, including this one, out of the project.

drop policy if exists "admins delete other profiles" on public.profiles;
create policy "admins delete other profiles"
  on public.profiles
  for delete
  to authenticated
  using (public.is_admin() and id <> auth.uid());

-- ---------------------------------------------------------------------------
-- 5. Verify
-- ---------------------------------------------------------------------------
--   select tablename, policyname, cmd
--   from pg_policies
--   where schemaname = 'public'
--     and tablename in ('donations', 'needs', 'profiles')
--     and cmd = 'DELETE'
--   order by tablename;
--
-- Then remove the two rows left behind while testing this:
--   delete from public.needs     where id = '001be1fd-6af6-4001-bf7d-c8c9d34eff1b';
--   delete from public.donations where id = '3d07fb8c-4034-4e9e-9465-c4858d3c7518';
