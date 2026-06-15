-- 002: Clinical notes and attachments
-- PHI boundary: encrypted_content holds original, de_identified_text is safe for display

create type public.note_status as enum (
  'draft', 'submitted', 'processing', 'awaiting_consensus',
  'consensus_reached', 'human_review', 'finalized', 'challenged', 'resolved'
);

create type public.triage_category as enum (
  'emergency', 'urgent', 'same_day', 'routine', 'administrative'
);

create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  note_hash text not null unique,
  encrypted_content text not null,
  de_identified_text text,
  title text not null default 'Untitled Note',
  status public.note_status not null default 'draft',
  priority public.triage_category,
  submitted_by uuid not null references public.users(id),
  assigned_to uuid references public.users(id),
  tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notes_hash on public.clinical_notes(note_hash);
create index idx_notes_status on public.clinical_notes(status);
create index idx_notes_priority on public.clinical_notes(priority);
create index idx_notes_submitted_by on public.clinical_notes(submitted_by);
create index idx_notes_created_at on public.clinical_notes(created_at desc);

alter table public.clinical_notes enable row level security;

create policy "Users can read own notes"
  on public.clinical_notes for select
  using (auth.uid() = submitted_by);

create policy "Users can insert own notes"
  on public.clinical_notes for insert
  with check (auth.uid() = submitted_by);

create policy "Users can update own draft notes"
  on public.clinical_notes for update
  using (auth.uid() = submitted_by and status = 'draft')
  with check (auth.uid() = submitted_by);

create policy "Reviewers can read all notes (de-identified only)"
  on public.clinical_notes for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('reviewer', 'validator', 'admin')
    )
  );

create policy "Reviewers can update note status"
  on public.clinical_notes for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('reviewer', 'admin')
    )
  );

create trigger notes_updated_at
  before update on public.clinical_notes
  for each row execute function public.update_updated_at();

-- Attachments
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.clinical_notes(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint not null,
  mime_type text not null,
  uploaded_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create index idx_attachments_note_id on public.attachments(note_id);

alter table public.attachments enable row level security;

create policy "Users can read own attachments"
  on public.attachments for select
  using (
    exists (
      select 1 from public.clinical_notes n
      where n.id = note_id and n.submitted_by = auth.uid()
    )
  );

create policy "Users can upload attachments to own notes"
  on public.attachments for insert
  with check (auth.uid() = uploaded_by);

create policy "Reviewers can read all attachments"
  on public.attachments for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('reviewer', 'validator', 'admin')
    )
  );
