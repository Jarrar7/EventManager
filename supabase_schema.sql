-- ============================================================
-- Run this in: https://supabase.com/dashboard/project/inefvqnklgdtmddoglcf/sql/new
-- ============================================================

-- 1. Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  phone text,
  role text not null check (role in ('owner', 'worker')),
  language_preference text not null default 'en' check (language_preference in ('en', 'he', 'ar')),
  created_at timestamptz default now()
);

-- 2. Events table
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date timestamptz not null,
  venue text,
  status text not null default 'upcoming' check (status in ('upcoming', 'done')),
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);

-- 3. Event workers (assignment + pay)
create table public.event_workers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  worker_id uuid references public.users(id) on delete cascade not null,
  pay_amount numeric(10, 2) not null default 0,
  is_paid boolean not null default false,
  paid_at timestamptz,
  unique(event_id, worker_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.event_workers enable row level security;

-- Users: owners see everyone, workers see only themselves
create policy "owners can manage all users" on public.users
  for all using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'owner')
  );
create policy "workers can read own profile" on public.users
  for select using (id = auth.uid());

-- Events: owners do everything, workers see only their assigned events
create policy "owners can manage all events" on public.events
  for all using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'owner')
  );
create policy "workers can read assigned events" on public.events
  for select using (
    exists (select 1 from public.event_workers ew where ew.event_id = id and ew.worker_id = auth.uid())
  );

-- Event workers: owners do everything, workers see only their own rows
create policy "owners can manage all assignments" on public.event_workers
  for all using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'owner')
  );
create policy "workers can read own assignments" on public.event_workers
  for select using (worker_id = auth.uid());
