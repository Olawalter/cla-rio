# Clario — Decentralized Clinical Note Triage

**Privacy-preserving, AI-powered administrative triage for clinical notes — built entirely on a GenLayer Intelligent Contract.**

[Live Demo](https://clarionote.vercel.app) | [GenLayer StudioNet](https://studio.genlayer.com) | Contract: `0x90B1f0BcFc1c2e92680427f154F52Df6D93e7f88`

---

## The Problem

Clinical notes arrive at hospitals in high volume. Routing them — deciding which ones are emergencies, which are routine, which need immediate human attention — is a manual, error-prone, and often delayed process. There is no tamper-proof audit trail. There is no consistent reasoning. And every system that tries to solve this either centralizes sensitive patient data on a private server, or sends it to an external AI API with no accountability.

**The trust problem:** when an AI system makes a triage decision, who validated it? Who can be held accountable? If a patient is harmed because a note was misrouted, is there an immutable record of the decision and its reasoning?

## What Clario Does

Clario solves clinical note triage as a **genuine consensus problem on GenLayer**. When a clinician submits a note:

1. All PHI (names, DOB, SSN, MRN, phone, insurance IDs) is stripped in the browser before anything leaves the device
2. A SHA-256 hash of the original is computed for integrity verification
3. The sanitized note is submitted to the GenLayer Intelligent Contract
4. Multiple independent AI validators each run `gl.exec_prompt()` to classify the note
5. `gl.eq_principle.prompt_comparative()` forces consensus — validators must agree on category and priority within 15 points
6. The resulting assessment (category, priority, routing recommendation, reasoning) is written to immutable on-chain state
7. Anyone with the right role can challenge the decision — triggering a fresh round of AI consensus
8. Every action — submission, review, challenge, finalization — is recorded in a permanent, queryable audit log

The contract is the single source of truth. There is no backend server, no database, no external AI API. The frontend talks directly to the contract via an injected wallet.

> Clario **never** diagnoses patients or recommends treatment. It is an administrative routing system only.

## Why This Requires GenLayer

This is not a problem that can be solved with a regular smart contract or a centralized AI service:

- A regular smart contract cannot run AI inference — there is no way to classify free-text clinical notes on-chain without GenLayer's `gl.exec_prompt()`
- A centralized AI API (OpenAI, etc.) gives you one response with no accountability and no on-chain record
- GenLayer's Optimistic Democracy means multiple validators independently assess the same note — disagreements are resolved by the consensus mechanism, not by one party's server

The consensus layer is what makes this auditable. A single AI call is just a black box. Multiple independent validators reaching agreement through `prompt_comparative()` is verifiable reasoning.

## How It Works

```
Clinician submits note
    → Browser strips PHI, computes SHA-256 hash
    → sanitized_text + hash sent to contract
    → Contract runs gl.exec_prompt() across multiple validators
    → prompt_comparative() enforces consensus (category match, priority ±15)
    → Assessment (category, priority, routing, reasoning) stored on-chain
    → Optional: clinician or admin requests manual human review
    → Optional: anyone with access challenges the decision
        → New consensus round via gl.exec_prompt() + prompt_comparative()
    → Admin finalizes → case archived
    → Full audit trail queryable by auditors
```

## Architecture

```
┌──────────────────────────────┐         ┌──────────────────────────────────────┐
│   Vite 5 + React 18          │         │   GenLayer Intelligent Contract       │
│   (clarionote.vercel.app)    │ ──────▶ │   0xF0694dDD...fBFD4A on StudioNet   │
│                              │ ◀────── │                                      │
│  • Browser-side PHI redact   │         │  • gl.exec_prompt() — AI triage      │
│  • SHA-256 hash integrity    │         │  • gl.eq_principle.prompt_comp()     │
│  • Wallet-based auth (RBAC)  │         │  • TreeMap[str,str] — cases/roles    │
│  • TanStack Query (15s sync) │         │  • gl.message.sender_address — RBAC  │
│  • Full tx lifecycle UI      │         │  • Immutable audit log               │
│  • genlayer-js v1.2.0 SDK    │         │  • Challenge/dispute with re-triage  │
└──────────────────────────────┘         └──────────────────────────────────────┘
```

No database. No Firebase. No Supabase. No external AI APIs.

## GenLayer Primitives Used

| Primitive | Where Used | What It Does |
|---|---|---|
| `glm.nondet.exec_prompt()` | `submit_case`, `challenge_decision` | Each validator independently classifies the note or re-evaluates a challenge |
| `glm.eq_principle.prompt_comparative()` | `submit_case`, `challenge_decision` | Forces multi-validator consensus — category must match, priority within 15 pts |
| `gl.TreeMap[str, str]` | Storage | Stores cases, roles, hospitals, staff, challenges, manual reviews |
| `gl.TreeMap[gl.u64, str]` | Storage | Ordered index lists for case/challenge/audit iteration |
| `gl.u64` | Storage | Counters for cases, challenges, staff, audit entries |
| `glm.message.sender_address` | All write methods | Wallet-based identity and role enforcement |
| `glm.Contract` | Contract class | Base class for the Intelligent Contract |

## Contract: `contracts/clario.py`

### Write Methods

| Method | Role Required | What Happens |
|---|---|---|
| `register_hospital(name)` | owner | Registers a hospital, owner becomes its admin |
| `register_staff(address, role)` | hospital_admin | Registers a staff member with a role |
| `grant_role(address, role, hospital)` | hospital_admin | Grants any role to any address |
| `revoke_role(address)` | hospital_admin | Removes a role from an address |
| `submit_case(text, hash, type, dept)` | clinician / hospital_admin | AI triage via validator consensus |
| `request_manual_review(case_id)` | submitter / hospital_admin | Flags case for human review |
| `submit_manual_review(case_id, decision)` | reviewer / hospital_admin | Records a human review decision |
| `challenge_decision(case_id, reason)` | submitter / hospital_admin | Triggers fresh AI consensus round |
| `finalize_case(case_id)` | hospital_admin | Marks case complete |
| `archive_case(case_id)` | hospital_admin | Archives a finalized case |

### View Methods

| Method | Returns |
|---|---|
| `get_role(address)` | Role string for a wallet address |
| `get_case(case_id)` | Full case JSON including assessment |
| `list_cases()` | All cases |
| `list_cases_by_status(status)` | Filtered by status |
| `get_hospital(address)` | Hospital record |
| `get_staff(address)` | Staff record |
| `list_challenges()` | All challenges |
| `list_challenges_by_case(case_id)` | Challenges for a case |
| `audit_history()` | Full audit log |
| `audit_history_by_case(case_id)` | Audit entries for a case |

### Case Lifecycle

```
submitted → consensus_complete → manual_review_requested → reviewed
                              → challenge_upheld / challenge_overturned
                                                         → finalized → archived
```

## Roles

| Role | What They Can Do |
|---|---|
| `hospital_admin` (owner) | Everything — register hospitals, manage staff, finalize/archive cases |
| `clinician` | Submit cases, request manual review, challenge decisions |
| `reviewer` | Submit manual reviews |
| `auditor` | Read-only — query audit history |

## Privacy Design

- **PHI never leaves the browser unredacted** — the redaction library strips names, DOB, SSN, MRN, phone numbers, email addresses, and insurance IDs using pattern matching before the note is sent anywhere
- **On-chain: hashes and sanitized text only** — the SHA-256 hash allows integrity verification against the original without storing the original
- **No external AI API** — all inference runs inside the GenLayer contract via `gl.exec_prompt()`; no third party sees the note
- **Gasless** — StudioNet requires no tokens or wallet funding for end users

## Running Locally

```bash
git clone https://github.com/Olawalter/cla-rio.git
cd cla-rio/frontend
npm install
```

Create `frontend/.env`:

```env
VITE_CONTRACT_ADDRESS=0x90B1f0BcFc1c2e92680427f154F52Df6D93e7f88
VITE_GENLAYER_CHAIN=studionet
```

```bash
npm run dev        # http://localhost:5173
npm run build      # Production build
npm run lint       # Lint
```

**Wallet:** MetaMask, Rabby, OKX, Brave Wallet, Coinbase Wallet, or any injected EVM wallet. StudioNet is gasless — no funding needed.

## Project Structure

```
├── contracts/
│   └── clario.py              # GenLayer Intelligent Contract — the entire backend
├── frontend/
│   ├── src/
│   │   ├── main.tsx           # App entry, router, providers, error boundary
│   │   ├── pages/             # dashboard, submit-case, cases, admin, audit, etc.
│   │   ├── components/        # Layout, sidebar, transaction status UI
│   │   ├── hooks/
│   │   │   ├── use-wallet.ts  # Wallet connection + loading state
│   │   │   ├── use-contract.ts# Typed hooks for all contract reads/writes
│   │   │   └── use-transaction.ts # Full tx lifecycle (idle→wallet→submitted→finalized)
│   │   ├── config/            # GenLayer client, contract address
│   │   └── lib/               # PHI redaction, SHA-256 hashing, utils
│   ├── index.html
│   └── package.json
├── vercel.json                # SPA routing rewrite for Vercel
└── configs/.env.example       # Environment variable reference
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite 5, React 18, TypeScript, Tailwind CSS, shadcn/ui |
| State & Data | TanStack Query v5 — auto-refreshes from contract every 15s |
| Blockchain | GenLayer Intelligent Contract on StudioNet (gasless) |
| AI Inference | GenLayer `gl.exec_prompt()` only — no external AI APIs |
| Wallet | Any injected EVM wallet via genlayer-js v1.2.0 SDK |
| Deployment | Vercel (SPA routing configured) |

## Roadmap

- **Multi-hospital support** — each hospital_admin manages their own staff and case namespace
- **HIPAA-aligned audit export** — auditors can export the on-chain audit log as a signed PDF
- **Batch triage** — submit multiple notes in a single transaction with prioritized consensus
- **Reviewer dashboard** — dedicated workflow for human reviewers with SLA tracking
- **Mobile wallet support** — WalletConnect integration for mobile-first clinical workflows
- **Mainnet deployment** — migrate to GenLayer mainnet when available, with token-gated access for hospitals

## Live On-Chain Proof

Full end-to-end flow executed on StudioNet — all transactions verifiable on [GenLayer Studio Explorer](https://explorer-studio.genlayer.com):

| Step | Method | Transaction Hash |
|---|---|---|
| Register hospital | `register_hospital` | [`0xc98472bc...`](https://explorer-studio.genlayer.com/tx/0xc98472bc84923dd0a0e0cea25be34460cf4644695a0a19a3f67d65e67c6a012d) |
| Register clinician | `register_staff` | [`0xfab0cc75...`](https://explorer-studio.genlayer.com/tx/0xfab0cc751d0a6f2532a7ffdcc73e1fff37a0805accdc4b784567ab4318aec982) |
| Submit case (AI triage) | `submit_case` | [`0x07318c28...`](https://explorer-studio.genlayer.com/tx/0x07318c28e34ab22c312300da42968f0c5b18516cbbc2c1304bf32dc276cbfa7a) |
| Request manual review | `request_manual_review` | [`0x6973c96a...`](https://explorer-studio.genlayer.com/tx/0x6973c96a3152660a9a51c6f22a4d0a5a81c00b5db9a4236f7a8e7d28736fcb80) |
| Submit review decision | `submit_manual_review` | [`0xc7670272...`](https://explorer-studio.genlayer.com/tx/0xc7670272ea42eb963223c964cfeada131a282e14e3745ae91639896c1ac1fc45) |
| Challenge + re-triage | `challenge_decision` | [`0x6824f5c6...`](https://explorer-studio.genlayer.com/tx/0x6824f5c6cce9eafa63fadfdda5079fe3fa3450461bf170ec167b7a83366ab290) |
| Finalize case | `finalize_case` | [`0xf690ccb6...`](https://explorer-studio.genlayer.com/tx/0xf690ccb60f061dd478b65aa24a02f2920379e9f819ac10f11bb0c47debcd582a) |

**Challenge/dispute system in action:** the initial triage hit an edge case in AI response parsing and defaulted to Routine. The `challenge_decision` call triggered a fresh validator consensus round that reclassified to **Emergency / Priority 85**, status `challenge_overturned` — exactly the dispute resolution mechanism working as designed. 8 immutable audit entries written across the full lifecycle.

Contract: `0x90B1f0BcFc1c2e92680427f154F52Df6D93e7f88` on StudioNet

## Submission Notes

Clario addresses a real trust gap in healthcare administration: AI-assisted triage systems today either run on centralized servers (no accountability, no audit trail) or require PHI to leave the organization's control. Neither is acceptable in clinical settings.

GenLayer is the right infrastructure for this because the trust problem is inherently a consensus problem — one AI response cannot be trusted, but multiple independent validators converging on the same assessment can. The `prompt_comparative()` mechanism directly maps to the kind of peer review that medical decision-making already requires.

The contract is the sole backend. Every case, role, challenge, review, and audit event is stored on-chain. The frontend is a thin client that calls the contract directly from the browser. There is no server to hack, no database to breach, and no third-party AI that sees patient-adjacent data.

## License

MIT
