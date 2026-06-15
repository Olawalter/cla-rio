-- 004: Audit logs and notifications
-- Audit logs are append-only, no updates allowed

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  note_id uuid references public.clinical_notes(id),
  note_hash text,
  actor_id uuid not null references public.users(id),
  actor_address text,
  details jsonb not null default '{}',
  tx_hash text,
  created_at timestamptz not null default now()
);

create index idx_audit_event_type on public.audit_logs(event_type);
create index idx_audit_note_id on public.audit_logs(note_id);
create index idx_audit_actor_id on public.audit_logs(actor_id);
create index idx_audit_created_at on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

create policy "Users can read own audit logs"
  on public.audit_logs for select
  using (actor_id = auth.uid());

create policy "Admins can read all audit logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

create policy "System can insert audit logs"
  on public.audit_logs for insert
  with check (true);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_read on public.notifications(user_id, read) where read = false;
create index idx_notifications_created_at on public.notifications(created_at desc);

alter table public.notifications enable row level security;

create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

-- Enable realtime for key tables
alter publication supabase_realtime add table public.clinical_notes;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.triage_results;
