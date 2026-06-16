# Clario

Privacy-preserving, explainable, decentralized clinical workflow infrastructure for administrative note triage and audit.

**Live Demo:** [cla-rio.vercel.app](https://cla-rio.vercel.app)

## Overview

Clario is a clinical note triage system built on [GenLayer](https://genlayer.com). Every submission goes on-chain — GenLayer's AI validators independently classify and prioritize clinical notes through Optimistic Democracy consensus. No patient health information (PHI) is ever stored on-chain.

### How It Works

1. **Submit** — A clinician submits a clinical note through the web interface
2. **Hash & Store** — The note content is hashed (SHA-256). The hash goes on-chain; the raw note stays in Firebase
3. **AI Classification** — The GenLayer Intelligent Contract runs `gl.exec_prompt()` to classify the note (Emergency / Urgent / Same-Day / Routine / Administrative)
4. **Validator Consensus** — Multiple independent validators run the same classification. Results are compared using `gl.eq_principle.prompt_comparative()` — category must match and priority scores must be within 15 points
5. **Assessment Stored** — The consensus assessment (category, priority score, confidence, reasoning) is stored on-chain and synced to Firebase for fast reads
6. **Human Review** — Notes with low confidence or critical keywords are flagged for human review
7. **Challenge** — Any stakeholder can challenge a decision with evidence, triggering AI-assisted re-evaluation through a new consensus round

### Key Features

- **On-Chain AI Triage** — All classification happens inside the GenLayer Intelligent Contract via `gl.exec_prompt()`, not through external AI APIs
- **Validator Consensus** — Multiple independent LLM validators analyze each note; decisions require agreement on category and similar priority scores
- **Challenge System** — Challenge any triage decision with evidence, triggering on-chain AI re-evaluation
- **Privacy-First** — Only hashes, classifications, votes, and audit events go on-chain. Raw notes never touch the blockchain
- **Embedded Wallet** — Auto-generated GenLayer wallet tied to each user account (no manual wallet connection needed)
- **Full Audit Trail** — Every submission, assessment, vote, and challenge is permanently recorded on-chain
- **Real-Time Sync** — On-chain assessment data is synced to Firebase for instant UI rendering

## Architecture

```
User → Next.js Frontend → Firebase (Auth + Storage) → GenLayer Intelligent Contract
                                                            ↓
                                                   Validator Consensus (LLM)
                                                            ↓
                                                   On-Chain Assessment
                                                            ↓
                                                   Firebase Cache (Sync)
                                                            ↓
                                                   Dashboard + Detail View
```

GenLayer contract is the **source of truth**. Firebase is a convenience cache for fast reads.

### Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **State Management:** Zustand + TanStack Query
- **Forms:** React Hook Form + Zod
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Blockchain:** GenLayer Intelligent Contract on StudioNet (gasless)
- **AI:** GenLayer LLMs only — no OpenAI, no external AI services

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase project with Auth and Firestore enabled
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
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# GenLayer
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=your-contract-address
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
│   │   │   ├── (auth)/       # Login, Signup
│   │   │   ├── (dashboard)/  # Dashboard, Submit, Notes, Profile, Validator, Admin
│   │   │   └── page.tsx      # Landing page
│   │   ├── components/       # Shared React components
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── use-submit-note.ts   # On-chain submission flow
│   │   │   ├── use-wallet.ts        # Embedded wallet management
│   │   │   ├── use-ensure-triage.ts # On-chain assessment sync
│   │   │   └── ...
│   │   ├── lib/              # Utilities (hashing, local triage fallback)
│   │   └── services/         # Firebase and GenLayer clients
│   └── package.json
├── contracts/                # GenLayer Intelligent Contract (Python)
│   └── clario.py
├── configs/                  # Environment templates
└── README.md
```

## GenLayer Intelligent Contract

The contract (`contracts/clario.py`) is the core of Clario. All AI processing happens inside it.

### Contract Methods

| Method | Type | Description |
|--------|------|-------------|
| `submit_note(note_hash, de_identified_text)` | Write | Submits a note for AI classification through validator consensus |
| `challenge_decision(note_hash, reason, evidence)` | Write | Opens a dispute against an existing assessment |
| `resolve_challenge(challenge_id, resolution)` | Write | AI re-evaluates the challenged decision |
| `finalize_review(note_hash, final_category)` | Write | Human reviewer finalizes a flagged note |
| `grant_role(address, role)` | Write | Admin grants a role to an address |
| `get_assessment(note_hash)` | View | Reads the on-chain assessment for a note |
| `get_note(note_hash)` | View | Reads note metadata |
| `get_audit_log_length()` | View | Returns the number of audit events |

### Consensus Model

The contract uses `gl.eq_principle.prompt_comparative()` for consensus — not `strict_eq`, because different validator LLMs produce different JSON formatting. The comparative prompt checks:
- Same category (exact match)
- Priority scores within 15 points of each other
- Minor wording differences in reasoning are acceptable

### Critical Keywords

Notes containing critical keywords (chest pain, severe bleeding, stroke symptoms, suicidal thoughts, breathing difficulties, loss of consciousness) are automatically flagged for human review regardless of AI confidence.

**Contract Address (StudioNet):** `0x3aCEAEd2E91311ca8B69c4142c46685513F92689`

## On-Chain Submission Flow

```
hashNote(content)  →  Firebase (store note)  →  writeContract("submit_note")
                                                        ↓
                                              waitForTransactionReceipt()
                                              (validators reach consensus)
                                                        ↓
                                              readContract("get_assessment")
                                                        ↓
                                              Sync assessment + validator votes to Firebase
```

The frontend (`use-submit-note.ts`) orchestrates this entire flow with real-time step indicators:
- Computing note hash...
- Storing encrypted note...
- Submitting to GenLayer intelligent contract...
- Awaiting GenLayer validator consensus (1-3 minutes)...
- Reading on-chain assessment...
- Syncing results to database...

## Security

- **No PHI On-Chain** — Only hashes, classifications, and audit events are stored on-chain. Raw clinical notes never leave Firebase
- **No External AI** — All AI processing runs inside the GenLayer contract. No OpenAI, no third-party APIs
- **Administrative Only** — Clario classifies notes for routing. It does NOT diagnose patients or recommend treatment
- **Embedded Wallets** — Auto-generated per user from Firebase UID. Private keys stored in localStorage, never transmitted
- **Role-Based Access** — Contract enforces submitter/reviewer/admin permissions on-chain

## Deployment

Deployed on Vercel with Firebase backend and GenLayer StudioNet:

```bash
cd apps/web
vercel --prod
```

Ensure all `NEXT_PUBLIC_*` environment variables are set in Vercel project settings.

## License

MIT
