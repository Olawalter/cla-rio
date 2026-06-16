# Clario

Privacy-preserving, explainable, decentralized clinical workflow infrastructure for administrative note triage and audit.

**Live Demo:** [cla-rio.vercel.app](https://cla-rio.vercel.app)

## Overview

Clario is a production-grade clinical note triage system built on [GenLayer](https://genlayer.com). It uses AI-powered consensus validation to classify and prioritize clinical notes — without ever storing patient health information (PHI) on-chain.

### Key Features

- **AI-Powered Triage** — GenLayer Intelligent Contract classifies notes into Emergency, Urgent, Same-Day, Routine, or Administrative categories
- **Validator Consensus** — Multiple independent validators analyze each note; decisions require strong agreement
- **Challenge System** — Any stakeholder can challenge a triage decision with evidence, triggering AI-assisted re-evaluation
- **Privacy-First** — Only hashes and classifications go on-chain. Raw notes stay in Firebase, never exposed to the blockchain
- **MetaMask Integration** — Connect external wallets for on-chain interactions
- **Full Audit Trail** — Every decision, vote, and challenge is permanently recorded

## Architecture

```
Frontend (Next.js 16) → Firebase → GenLayer Intelligent Contract → Validator Consensus → Human Review → Audit Trail
```

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **State Management:** Zustand + TanStack Query
- **Forms:** React Hook Form + Zod
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Blockchain:** GenLayer Intelligent Contract on StudioNet
- **AI:** GenLayer LLMs only (no external AI services) via `gl.exec_prompt()`

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase project with Auth, Firestore, and Storage enabled
- GenLayer contract deployed to StudioNet

### Installation

```bash
git clone https://github.com/Olawalter/cla-rio.git
cd cla-rio/apps/web
npm install
```

### Environment Variables

Copy the example env file and fill in your Firebase credentials:

```bash
cp ../../configs/.env.example .env.local
```

Required variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=your-contract-address
NEXT_PUBLIC_GENLAYER_CHAIN=studionet
```

### Development

```bash
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
│   │   │   ├── (dashboard)/  # Dashboard, Submit, Validator, Admin, Notes
│   │   │   └── page.tsx      # Landing page
│   │   ├── components/       # Shared React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and config
│   │   └── services/         # Firebase and GenLayer clients
│   └── package.json
├── contracts/                # GenLayer Intelligent Contract (Python)
│   └── clario.py
├── configs/                  # Environment templates
└── README.md
```

## GenLayer Contract

The Intelligent Contract (`contracts/clario.py`) handles:

- **Note Submission** — De-identification + AI classification via `gl.exec_prompt()`
- **Consensus Validation** — `gl.eq_principle.strict_eq()` ensures validators agree
- **Challenge Resolution** — AI re-evaluates disputed decisions with new evidence
- **Role Management** — Admin, reviewer, validator, submitter roles
- **Audit Logging** — Immutable on-chain event trail

Contract Address (StudioNet): `0x002F14937C57B7C7173fB490cF577b88184704eC`

## Security

- **No PHI On-Chain** — Patient identifiers never leave Firebase. Only hashes and classifications are stored on-chain
- **Firestore Security Rules** — Role-based access control at the database level
- **Wallet-Based Identity** — On-chain actions tied to wallet addresses with contract-level permissions
- **Administrative Only** — Clario does NOT diagnose patients or recommend treatment

## Deployment

Deployed on Vercel with Firebase backend:

```bash
vercel --prod
```

## License

MIT
