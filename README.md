# Clario

Privacy-preserving, explainable, decentralized clinical workflow infrastructure for administrative note triage and audit.

**Live Demo:** [cla-rio.vercel.app](https://cla-rio.vercel.app)

## Overview

Clario is a clinical note triage system built entirely on [GenLayer](https://genlayer.com). Every submission goes on-chain — GenLayer's AI validators independently classify and prioritize clinical notes through Optimistic Democracy consensus. No external backend, no database — the GenLayer Intelligent Contract is the only backend.

### How It Works

1. **Submit** — A clinician submits a clinical note through the web interface
2. **Hash** — The note content is hashed (SHA-256) client-side for integrity verification
3. **AI Classification** — The GenLayer Intelligent Contract runs `gl.exec_prompt()` to classify the note (Emergency / Urgent / Same-Day / Routine / Administrative)
4. **Validator Consensus** — Multiple independent validators run the same classification. Results are compared using `gl.eq_principle.prompt_comparative()` — category must match and priority scores must be within 15 points
5. **Assessment Stored** — The consensus assessment (category, priority score, confidence, reasoning) is stored on-chain
6. **Human Review** — Notes with low confidence or critical keywords are flagged for human review
7. **Challenge** — Any stakeholder can challenge a decision with evidence, triggering AI-assisted re-evaluation through a new consensus round

### Key Features

- **100% On-Chain** — No external backend. The GenLayer Intelligent Contract stores all state and runs all logic
- **On-Chain AI Triage** — All classification happens inside the contract via `gl.exec_prompt()`, not through external AI APIs
- **Validator Consensus** — Multiple independent LLM validators analyze each note; decisions require agreement on category and similar priority scores
- **Challenge System** — Challenge any triage decision with evidence, triggering on-chain AI re-evaluation
- **Privacy-First** — Only hashes, classifications, votes, and audit events go on-chain. No PHI is ever stored on-chain
- **Auto-Generated Wallet** — No MetaMask needed. Wallets are auto-generated in the browser. StudioNet is gasless
- **Full Audit Trail** — Every submission, assessment, vote, and challenge is permanently recorded on-chain

## Architecture

```
User → Next.js Frontend → GenLayer Intelligent Contract (StudioNet)
                                    ↓
                           Validator Consensus (LLM × N)
                                    ↓
                           On-Chain Assessment + Audit Trail
                                    ↓
                           Frontend reads contract state
```

The GenLayer Intelligent Contract is the **single source of truth**. There is no database — the frontend reads directly from the contract.

### Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **State Management:** TanStack Query (contract reads with auto-refresh)
- **Blockchain:** GenLayer Intelligent Contract on StudioNet (gasless)
- **AI:** GenLayer LLMs only — no OpenAI, no external AI services
- **Wallet:** Auto-generated via genlayer-js SDK, stored in localStorage

## Getting Started

### Prerequisites

- Node.js 20+
- GenLayer contract deployed to StudioNet

### Installation

```bash
git clone https://github.com/Olawalter/cla-rio.git
cd cla-rio/apps/web
npm install
```

### Environment Variables

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0xd8B3e7a0f8A3FFDA097bF3BB759b7a2e2f6A50FF
NEXT_PUBLIC_GENLAYER_CHAIN=studionet
```

### Development

```bash
cd apps/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
```

## Project Structure

```
cla-rio/
├── apps/web/                 # Next.js application
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   │   ├── (dashboard)/  # Dashboard, Submit, Notes, Profile, Validator, Admin
│   │   │   └── page.tsx      # Landing page
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── use-submit-note.ts      # On-chain submission flow
│   │   │   ├── use-wallet.ts           # Auto-generated wallet management
│   │   │   ├── use-contract.ts         # Contract read/write hooks
│   │   │   └── use-challenge-decision.ts
│   │   ├── lib/              # Utilities (hashing, formatting)
│   │   └── services/         # GenLayer client
│   └── package.json
├── contracts/                # GenLayer Intelligent Contract (Python)
│   └── clario.py
└── README.md
```

## GenLayer Intelligent Contract

The contract (`contracts/clario.py`) is the entire backend. All AI processing, state storage, and access control happen inside it.

### GenLayer Capabilities Used

| Capability | Usage |
|-----------|-------|
| `gl.exec_prompt()` | AI-powered clinical note classification inside nondet blocks |
| `gl.eq_principle.prompt_comparative()` | Consensus validation — compares assessments across validators |
| `TreeMap[str, str]` | Key-value storage for notes, assessments, challenges, roles |
| `DynArray[str]` | Ordered lists for note hashes, challenge IDs, audit log |
| `gl.message.sender_address` | Wallet-based identity and role-based access control |
| `gl.message_raw["datetime"]` | On-chain timestamps for audit trail |
| Nondet blocks | Non-deterministic AI execution with validator consensus |

### Contract Methods

| Method | Type | Description |
|--------|------|-------------|
| `submit_note(note_hash, de_identified_text)` | Write | Submits a note for AI classification through validator consensus |
| `challenge_decision(note_hash, reason, evidence)` | Write | Opens a dispute against an existing assessment |
| `resolve_challenge(challenge_id, resolution)` | Write | AI re-evaluates the challenged decision through consensus |
| `finalize_review(note_hash, final_category)` | Write | Human reviewer finalizes a flagged note |
| `grant_role(address, role)` / `revoke_role(address)` | Write | Admin role management |
| `update_protocol(version, description)` | Write | Update protocol version |
| `get_all_notes()` | View | Returns all notes with assessments (JSON) |
| `get_all_challenges()` | View | Returns all challenges (JSON) |
| `get_all_audit_logs()` | View | Returns full audit trail (JSON) |
| `get_assessment(note_hash)` / `get_note(note_hash)` | View | Single item lookups |
| `get_role(address)` | View | Check on-chain role |

### Consensus Model

The contract uses `gl.eq_principle.prompt_comparative()` for consensus — not `strict_eq`, because different validator LLMs produce different JSON formatting. The comparative prompt checks:
- Same category (exact match)
- Priority scores within 15 points of each other
- Minor wording differences in reasoning are acceptable

### Critical Keywords

Notes containing critical keywords (chest pain, severe bleeding, stroke symptoms, suicidal thoughts, breathing difficulties, loss of consciousness) are automatically flagged for human review regardless of AI confidence.

**Contract Address (StudioNet):** `0xd8B3e7a0f8A3FFDA097bF3BB759b7a2e2f6A50FF`

## On-Chain Submission Flow

```
hashNote(content)  →  writeContract("submit_note")
                              ↓
                    Validators run gl.exec_prompt()
                    Consensus via prompt_comparative()
                              ↓
                    waitForTransactionReceipt()
                    (1-3 minutes for consensus)
                              ↓
                    readContract("get_assessment")
                              ↓
                    Display results in UI
```

The frontend (`use-submit-note.ts`) orchestrates this flow with real-time step indicators:
- Computing note hash...
- Submitting to GenLayer intelligent contract...
- Awaiting GenLayer validator consensus (1-3 minutes)...
- Reading on-chain assessment...

## Security

- **No PHI On-Chain** — Only hashes, classifications, and audit events are stored on-chain. Raw clinical notes exist only in the browser during submission
- **No External AI** — All AI processing runs inside the GenLayer contract. No OpenAI, no third-party APIs
- **Administrative Only** — Clario classifies notes for routing. It does NOT diagnose patients or recommend treatment
- **Auto-Generated Wallets** — Created in-browser via genlayer-js SDK. Private keys stored in localStorage, never transmitted
- **Role-Based Access** — Contract enforces submitter/reviewer/validator/admin permissions on-chain
- **Gasless** — StudioNet is gasless, so all interactions are free

## Deployment

Deployed on Vercel with GenLayer StudioNet:

```bash
cd apps/web
vercel --prod
```

Set `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS` and `NEXT_PUBLIC_GENLAYER_CHAIN=studionet` in Vercel project settings.

## License

MIT
