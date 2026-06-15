-- 003: Triage results, validator decisions, and challenges
-- These mirror on-chain data for fast reads; contract is source of truth

create table public.triage_results (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.clinical_notes(id) on delete cascade,
  note_hash text not null,
  category public.triage_category not null,
  priority_score integer not null check (priority_score between 1 and 100),
  confidence integer not null check (confidence between 1 and 100),
  reasoning text not null,
  missing_info jsonb not null default '[]',
  routing_recommendation text not null default '',
  human_review_required boolean not null default false,
  human_review_reasons jsonb not null default '[]',
  critical_keywords_found jsonb not null default '[]',
  consensus_strength text check (consensus_strength in ('strong', 'moderate', 'weak')),
  consensus_percentage integer check (consensus_percentage between 0 and 100),
  protocol_version text not null,
  tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_triage_note_id on public.triage_results(note_id);
create index idx_triage_note_hash on public.triage_results(note_hash);
create index idx_triage_category on public.triage_results(category);
create unique index idx_triage_one_per_note on public.triage_results(note_id);

alter table public.triage_results enable row level security;

create policy "Users can read own triage results"
  on public.triage_results for select
  using (
    exists (
      select 1 from public.clinical_notes n
      where n.id = note_id and n.submitted_by = auth.uid()
    )
  );

create policy "Reviewers can read all triage results"
  on public.triage_results for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('reviewer', 'validator', 'admin')
    )
  );

create policy "System can insert triage results"
  on public.triage_results for insert
  with check (true);

create policy "System can update triage results"
  on public.triage_results for update
  using (true);

create trigger triage_updated_at
  before update on public.triage_results
  for each row execute function public.update_updated_at();

-- Validator decisions
create table public.validator_decisions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.clinical_notes(id) on delete cascade,
  note_hash text not null,
  validator_address text not null,
  category public.triage_category not null,
  priority_score integer not null check (priority_score between 1 and 100),
  confidence integer not null check (confidence between 1 and 100),
  human_review_required boolean not null default false,
  tx_hash text,
  created_at timestamptz not null default now()
);

create index idx_valdec_note_id on public.validator_decisions(note_id);
create index idx_valdec_note_hash on public.validator_decisions(note_hash);

alter table public.validator_decisions enable row level security;

create policy "Users can read validator decisions for own notes"
  on public.validator_decisions for select
  using (
    exists (
      select 1 from public.clinical_notes n
      where n.id = note_id and n.submitted_by = auth.uid()
    )
  );

create policy "Reviewers can read all validator decisions"
  on public.validator_decisions for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('reviewer', 'validator', 'admin')
    )
  );

create policy "System can insert validator decisions"
  on public.validator_decisions for insert
  with check (true);

-- Challenges
create type public.challenge_status as enum ('open', 'under_review', 'resolved', 'rejected');

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.clinical_notes(id),
  note_hash text not null,
  challenger_id uuid not null references public.users(id),
  challenger_address text not null,
  reason text not null,
  evidence text,
  status public.challenge_status not null default 'open',
  original_category public.triage_category not null,
  proposed_category public.triage_category,
  resolution text,
  tx_hash text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index idx_challenges_note_id on public.challenges(note_id);
create index idx_challenges_status on public.challenges(status);

alter table public.challenges enable row level security;

create policy "Users can read challenges for own notes"
  on public.challenges for select
  using (
    exists (
      select 1 from public.clinical_notes n
      where n.id = note_id and n.submitted_by = auth.uid()
    )
    or challenger_id = auth.uid()
  );

create policy "Users can create challenges"
  on public.challenges for insert
  with check (auth.uid() = challenger_id);

create policy "Reviewers can read all challenges"
  on public.challenges for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('reviewer', 'admin')
    )
  );

create policy "Reviewers can update challenges"
  on public.challenges for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('reviewer', 'admin')
    )
  );
