-- ============================================================
-- Worker RLS fix — run this in the Supabase SQL editor
-- Safe to run multiple times (drops before creating)
-- ============================================================

-- ---- event_workers: workers can read their own rows ----------
drop policy if exists "workers can read own assignments" on public.event_workers;

create policy "workers can read own assignments" on public.event_workers
  for select using (worker_id = auth.uid());

-- ---- events: workers can read events they are assigned to ----
-- Uses a direct subquery — no role check needed, just checks the
-- event_workers join, which itself is protected by the policy above.
drop policy if exists "workers can read assigned events" on public.events;

create policy "workers can read assigned events" on public.events
  for select using (
    exists (
      select 1 from public.event_workers
      where event_id = public.events.id
        and worker_id = auth.uid()
    )
  );

-- ---- Verify the policies are in place -----------------------
select schemaname, tablename, policyname, cmd, qual
from pg_policies
where tablename in ('event_workers', 'events')
order by tablename, policyname;
