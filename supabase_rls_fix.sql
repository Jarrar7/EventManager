-- Drop the old circular policies
drop policy if exists "owners can manage all users" on public.users;
drop policy if exists "workers can read own profile" on public.users;
drop policy if exists "owners can manage all events" on public.events;
drop policy if exists "workers can read assigned events" on public.events;
drop policy if exists "owners can manage all assignments" on public.event_workers;
drop policy if exists "workers can read own assignments" on public.event_workers;

-- ============================================================
-- USERS table
-- ============================================================

-- Everyone can read their own profile (used by AuthContext on login)
create policy "users can read own profile" on public.users
  for select using (auth.uid() = id);

-- Only owners can read ALL users (for staff list etc.)
-- Uses jwt metadata instead of querying the users table (no recursion)
create policy "owners can read all users" on public.users
  for select using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
  );

-- Only owners can insert / update / delete users
create policy "owners can insert users" on public.users
  for insert with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
  );

create policy "owners can update users" on public.users
  for update using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
  );

create policy "owners can delete users" on public.users
  for delete using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
  );

-- ============================================================
-- EVENTS table
-- ============================================================

create policy "owners can manage events" on public.events
  for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
  );

create policy "workers can read assigned events" on public.events
  for select using (
    exists (
      select 1 from public.event_workers ew
      where ew.event_id = id and ew.worker_id = auth.uid()
    )
  );

-- ============================================================
-- EVENT_WORKERS table
-- ============================================================

create policy "owners can manage assignments" on public.event_workers
  for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
  );

create policy "workers can read own assignments" on public.event_workers
  for select using (worker_id = auth.uid());
