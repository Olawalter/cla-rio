# Clario

**Privacy-preserving, decentralized clinical note triage — 100% on-chain.**

[Live Demo](https://cla-rio.vercel.app) | [GenLayer](https://genlayer.com) | Contract: `0xd8B3e7a0f8A3FFDA097bF3BB759b7a2e2f6A50FF`

---

## What is Clario?

Clario is an administrative triage system for clinical notes, built entirely on a GenLayer Intelligent Contract. There is no backend server or database — the contract is the single source of truth. GenLayer's AI validators independently classify each note through Optimistic Democracy consensus, producing explainable, auditable decisions.

> Clario **never** diagnoses patients or recommends treatment. It only prioritizes notes for administrative routing.

## How It Works

```
Clinician submits note → SHA-256 hash computed client-side
    → Contract receives note → gl.exec_prompt() classifies it
    → Multiple validators reach consensus via prompt_comparative()
    → Assessment stored on-chain (category, priority, confidence, reasoning)
    → Human review auto-triggered for critical/low-confidence cases
    → Any stakeholder can challenge → AI re-evaluates through new consensus
```

## GenLayer Capabilities

| Feature | GenLayer Primitive | What It Does |
|---|---|---|
| AI Classification | `gl.nondet.exec_prompt()` | Classifies notes into Emergency / Urgent / Same-Day / Routine / Administrative |
| Validator Consensus | `gl.eq_principle.prompt_comparative()` | Compares assessments across validators — category must match, priority within 15 pts |
| On-Chain State | `TreeMap[str, str]`, `DynArray[str]` | Stores notes, assessments, challenges, roles, and full audit log |
| Identity & Access | `gl.message.sender_address` | Wallet-based RBAC — submitter, reviewer, validator, admin |
| Timestamps | `gl.message_raw["datetime"]` | Immutable on-chain timestamps for every event |
| Non-Determinism | Nondet blocks | AI execution with built-in consensus validation |

## Architecture

```
┌─────────────────┐         ┌──────────────────────────────────┐
│   Next.js 15    │ ──────▶ │   GenLayer Intelligent Contract  │
│   Frontend      │ ◀────── │   (StudioNet - Gasless)          │
│                 │         │                                  │
│ • Auto wallet   │         │ • AI triage via gl.exec_prompt() │
│ • TanStack Query│         │ • Consensus validation           │
│ • Tailwind/shad │         │ • Role-based access control      │
└─────────────────┘         │ • Immutable audit trail          │
                            │ • Challenge/dispute system       │
                            └──────────────────────────────────┘
```

No database, no Firebase, no Supabase, no external AI APIs. The frontend talks directly to the contract.

## Contract Methods

**Write Methods:**

| Method | Description |
|---|---|
| `submit_note(note_hash, text)` | Submit note for AI classification + validator consensus |
| `challenge_decision(note_hash, reason, evidence)` | Dispute an assessment — opens on-chain challenge |
| `resolve_challenge(challenge_id, resolution)` | AI re-evaluates via new consensus round |
| `finalize_review(note_hash, category)` | Human reviewer finalizes flagged notes |
| `grant_role(address, role)` / `revoke_role(address)` | Admin role management |
| `update_protocol(version, description)` | Protocol versioning |

**View Methods:**

| Method | Description |
|---|---|
| `get_all_notes()` | All notes + assessments (single call) |
| `get_all_challenges()` | All disputes |
| `get_all_audit_logs()` | Complete audit trail |
| `get_note(hash)` / `get_assessment(hash)` | Single lookups |
| `get_role(address)` | Check on-chain role |

## Key Design Decisions

- **`prompt_comparative` over `strict_eq`** — Different validators produce different JSON formatting. The comparative prompt checks semantic equivalence (same category + priority within 15 points) rather than string equality.
- **Critical keyword detection** — Notes containing terms like "chest pain", "severe bleeding", "stroke symptoms", "suicidal thoughts", "breathing difficulties", or "loss of consciousness" are auto-flagged for human review regardless of AI confidence.
- **Auto-generated wallets** — No MetaMask or external wallet needed. A wallet is created in-browser on first visit and stored in localStorage. StudioNet is gasless, so all interactions are free.
- **Batch view methods** — `get_all_notes()` returns every note + assessment in a single `readContract` call, keeping the dashboard fast with minimal RPC overhead.

## Privacy & Security

- **No PHI on-chain** — Only hashes, classifications, and audit events are stored. Raw notes exist only in the browser during submission.
- **No external AI** — All AI processing runs inside the GenLayer contract. No OpenAI, no third-party APIs.
- **Role-based access** — The contract enforces submitter / reviewer / validator / admin permissions.
- **Gasless** — StudioNet requires no tokens or funding.

## Quick Start

```bash
git clone https://github.com/Olawalter/cla-rio.git
cd cla-rio/apps/web
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0xd8B3e7a0f8A3FFDA097bF3BB759b7a2e2f6A50FF
NEXT_PUBLIC_GENLAYER_CHAIN=studionet
```

```bash
npm run dev        # http://localhost:3000
npm run build      # Production build
```

## Project Structure

```
├── contracts/clario.py              # GenLayer Intelligent Contract (entire backend)
├── apps/web/src/
│   ├── app/
│   │   ├── page.tsx                 # Landing page
│   │   └── (dashboard)/             # Dashboard, Submit, Notes, Profile, Validator, Admin
│   ├── hooks/
│   │   ├── use-contract.ts          # Contract read/write hooks
│   │   ├── use-submit-note.ts       # Submission flow orchestration
│   │   ├── use-wallet.ts            # Auto-generated wallet
│   │   └── use-challenge-decision.ts
│   ├── services/genlayer/client.ts  # GenLayer SDK client
│   └── lib/utils.ts                 # Hashing, formatting utilities
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| State | TanStack Query (15s auto-refresh from contract) |
| Blockchain | GenLayer Intelligent Contract on StudioNet |
| AI | GenLayer LLMs only (via `gl.exec_prompt()`) |
| Wallet | genlayer-js SDK (auto-generated, localStorage) |
| Deployment | Vercel |

## License

MIT
