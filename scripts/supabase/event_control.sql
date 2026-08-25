-- Run once in Supabase SQL editor (same project as participant_snapshots).
-- Allows anon clients to read reset_at and organizer backend to bump it.

create table if not exists public.event_control (
  id integer primary key default 1,
  reset_at timestamptz not null default now(),
  constraint event_control_single_row check (id = 1)
);

insert into public.event_control (id, reset_at)
values (1, now())
on conflict (id) do nothing;

alter table public.event_control enable row level security;

create policy "anon read event_control"
  on public.event_control for select
  to anon
  using (true);

create policy "anon upsert event_control"
  on public.event_control for insert
  to anon
  with check (true);

create policy "anon update event_control"
  on public.event_control for update
  to anon
  using (true)
  with check (true);
