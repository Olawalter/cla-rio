# Clario

Privacy-preserving, explainable, decentralized clinical workflow infrastructure for administrative note triage and audit.

## Architecture

```
Frontend (Next.js 15) → Supabase → GenLayer Intelligent Contract → Validator Consensus → Human Review → Audit Trail
```

GenLayer contract is the source of truth. Supabase is a convenience cache.

## Tech Stack

- **Frontend:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui
- **State:** Zustand + TanStack Query
- **Forms:** React Hook Form + Zod
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Realtime, RLS)
- **Blockchain:** GenLayer Intelligent Contract on StudioNet
- **AI:** GenLayer LLMs only (no external AI services)

## Critical Rules

- NEVER store PHI on-chain — only hashes, classifications, votes, audit events
- NEVER diagnose patients — administrative triage only
- NEVER recommend treatment
- ALL AI processing happens inside GenLayer contract via `gl.exec_prompt()`
- No OpenAI, no external AI APIs

## Project Structure

- `apps/web/` — Next.js application
- `contracts/` — GenLayer Intelligent Contract (Python)
- `components/` — Shared React components
- `hooks/` — Custom React hooks
- `lib/` — Utilities and config
- `services/` — Supabase and GenLayer clients
- `supabase/` — Migrations, seed data, types
- `types/` — Shared TypeScript type definitions

## Commands

```bash
cd apps/web && npm run dev    # Start dev server
npm run build                  # Production build
npm run lint                   # Lint
```

## Design System

- Primary: #0F4C81
- Success: #16A34A
- Warning: #D97706
- Critical: #DC2626
- Font: Inter (primary), JetBrains Mono (mono)
