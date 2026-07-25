# Clario

**Privacy-preserving, decentralized clinical note triage — 100% on-chain.**

[Live Demo](https://cla-rio.vercel.app) | [GenLayer](https://genlayer.com) | Contract: `0x593c0D78350F86637190162bf981920D81bd3FD9`

---

## What is Clario?

Clario is an administrative triage system for clinical notes, built entirely on a GenLayer Intelligent Contract. There is no backend server or database — the contract is the single source of truth. GenLayer's AI validators independently classify each note through Optimistic Democracy consensus, producing explainable, auditable decisions.

> Clario **never** diagnoses patients or recommends treatment. It only prioritizes notes for administrative routing.

## How It Works

```
Clinician submits note → PHI redacted in-browser → SHA-256 hash computed
    → Contract receives sanitized note → gl.exec_prompt() classifies it
    → Multiple validators reach consensus via prompt_comparative()
    → Assessment stored on-chain (category, priority, confidence, reasoning)
    → Optional manual review or challenge with AI re-evaluation
    → Full immutable audit trail for every action
```

## Architecture

```
┌─────────────────┐         ┌──────────────────────────────────┐
│   Vite + React  │ ──────▶ │   GenLayer Intelligent Contract  │
│   Frontend      │ ◀────── │   (StudioNet - Gasless)          │
│                 │         │                                  │
│ • Wallet auth   │         │ • AI triage via gl.exec_prompt() │
│ • PHI redaction │         │ • Validator consensus            │
│ • TanStack Query│         │ • Role-based access control      │
│ • genlayer-js   │         │ • Challenge/dispute system       │
└─────────────────┘         │ • Immutable audit trail          │
                            └──────────────────────────────────┘
```

No database, no Firebase, no Supabase, no external AI APIs. The frontend talks directly to the contract via injected wallet providers.

## GenLayer Capabilities

| Feature | GenLayer Primitive | What It Does |
|---|---|---|
| AI Classification | `gl.nondet.exec_prompt()` | Classifies notes into Emergency / Urgent / Same-Day / Routine / Administrative |
| Validator Consensus | `gl.eq_principle.prompt_comparative()` | Compares assessments across validators — category must match, priority within 15 pts |
| On-Chain State | `TreeMap[str, str]`, `DynArray[str]` | Stores cases, challenges, roles, hospitals, staff, and audit log |
| Identity & Access | `gl.message.sender_address` | Wallet-based RBAC — hospital_admin, clinician, reviewer, auditor |
| Timestamps | `gl.message_raw["datetime"]` | Immutable on-chain timestamps for every event |

## Contract Methods

**Write Methods:**

| Method | Description |
|---|---|
| `submit_case(text, hash, type, dept)` | Submit case for AI triage + validator consensus |
| `request_manual_review(case_id)` | Request human review of a case |
| `submit_manual_review(case_id, decision)` | Submit reviewer decision |
| `challenge_decision(case_id, reason)` | Dispute assessment — AI re-evaluates via new consensus |
| `resolve_challenge(challenge_id)` | Resolve challenge through consensus |
| `finalize_case(case_id)` | Finalize a completed case |
| `archive_case(case_id)` | Archive a finalized case |
| `register_hospital(name)` | Register a hospital (owner only) |
| `register_staff(address, role)` | Register staff member |
| `grant_role(address, role, hospital)` / `revoke_role(address)` | Role management |

**View Methods:**

| Method | Description |
|---|---|
| `list_cases()` / `list_cases_by_status(status)` | List all or filtered cases |
| `get_case(case_id)` | Single case lookup with full assessment |
| `list_challenges()` / `list_challenges_by_case(case_id)` | Challenge queries |
| `audit_history()` / `audit_history_by_case(case_id)` | Complete audit trail |
| `get_role(address)` | Check on-chain role |

## Case Lifecycle

```
Draft → Submitted → Pending Consensus → Consensus Complete
    → Manual Review (optional) → Challenge (optional) → Finalized → Archived
```

## Privacy & Security

- **Browser-side PHI redaction** — SSN, DOB, phone, email, MRN, insurance IDs, names, and addresses are stripped before any data leaves the browser
- **No PHI on-chain** — Only sanitized text, hashes, classifications, and audit events are stored
- **No external AI** — All AI processing runs inside the GenLayer contract via `gl.exec_prompt()`
- **Role-based access** — On-chain RBAC: hospital_admin, clinician, reviewer, auditor
- **Wallet authentication** — MetaMask, Rabby, OKX, Brave, Coinbase, or any injected EVM wallet
- **Gasless** — StudioNet requires no tokens or funding

## Quick Start

```bash
git clone https://github.com/Olawalter/cla-rio.git
cd cla-rio/frontend
npm install
```

Create `.env`:

```env
VITE_CONTRACT_ADDRESS=<your-deployed-contract-address>
VITE_GENLAYER_CHAIN=studionet
```

```bash
npm run dev        # http://localhost:5173
npm run build      # Production build
```

## Project Structure

```
├── contracts/clario.py          # GenLayer Intelligent Contract (entire backend)
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # App entry with router and providers
│   │   ├── pages/               # All page components
│   │   ├── components/          # Layout and UI components
│   │   ├── hooks/               # Wallet, contract, and transaction hooks
│   │   ├── config/              # GenLayer client and contract config
│   │   └── lib/                 # Utils and PHI redaction
│   ├── index.html
│   └── package.json
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite 5, React 18, TypeScript, Tailwind CSS |
| State | TanStack Query (15s auto-refresh from contract) |
| Blockchain | GenLayer Intelligent Contract on StudioNet |
| AI | GenLayer LLMs only (via `gl.exec_prompt()`) |
| Wallet | Injected EVM wallets via genlayer-js SDK |
| Animations | Framer Motion |
| Deployment | Vercel |

## License

MIT
