import Link from "next/link";
import {
  Shield,
  FileText,
  Users,
  Activity,
  Lock,
  Scale,
  ArrowRight,
  CheckCircle2,
  Workflow,
  Eye,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-xl font-semibold text-foreground tracking-tight">
              Clario
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#problem" className="hover:text-foreground transition-colors">Problem</a>
            <a href="#solution" className="hover:text-foreground transition-colors">Solution</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
            <a href="#security" className="hover:text-foreground transition-colors">Security</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 text-sm text-muted-foreground mb-8">
              <Lock className="h-3.5 w-3.5" />
              Privacy-Preserving Clinical Workflow
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
              Decentralized Administrative Triage for Clinical Notes
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              AI-assisted prioritization, consensus-based validation, and immutable audit trails.
              Built on GenLayer for transparent, explainable healthcare workflow decisions.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Start Triaging
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#architecture"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-medium text-foreground hover:bg-secondary transition-colors"
              >
                View Architecture
              </a>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section id="problem" className="py-20 bg-white border-y border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground">The Problem</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Healthcare organizations struggle with clinical note triage — manual processes
                are slow, opaque, and lack accountability.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Slow Manual Triage",
                  desc: "Clinical notes sit in queues for hours or days without prioritization, delaying critical administrative actions.",
                },
                {
                  title: "No Audit Trail",
                  desc: "Decisions about note routing and priority lack transparency, making disputes and compliance reviews difficult.",
                },
                {
                  title: "Inconsistent Decisions",
                  desc: "Different reviewers apply different criteria, leading to inconsistent prioritization across the organization.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution */}
        <section id="solution" className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground">The Solution</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Clario combines AI-powered analysis with decentralized validator consensus
                to deliver fast, explainable, and auditable triage decisions.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                {
                  icon: Activity,
                  title: "AI-Assisted Triage",
                  desc: "GenLayer validators analyze de-identified clinical notes and assign priority categories with explainable reasoning.",
                },
                {
                  icon: Users,
                  title: "Consensus Validation",
                  desc: "Multiple independent validators reach consensus on triage decisions, ensuring consistency and reducing bias.",
                },
                {
                  icon: Eye,
                  title: "Full Transparency",
                  desc: "Every decision, vote, and challenge is recorded on an immutable audit trail for complete accountability.",
                },
                {
                  icon: Scale,
                  title: "Dispute Resolution",
                  desc: "Stakeholders can challenge decisions with evidence, triggering AI-assisted re-evaluation through consensus.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 bg-white border-y border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground">Features</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: FileText, title: "Note Submission", desc: "Submit clinical notes with attachments and structured previews." },
                { icon: Shield, title: "PII Protection", desc: "Automatic de-identification before any AI processing." },
                { icon: Activity, title: "Priority Scoring", desc: "AI-powered scoring from 1-100 with confidence levels." },
                { icon: Users, title: "Validator Consensus", desc: "5-validator consensus with strong/moderate/weak thresholds." },
                { icon: Eye, title: "Human Review Queue", desc: "Mandatory human review for low-confidence or critical cases." },
                { icon: Scale, title: "Challenge System", desc: "Dispute and re-evaluate decisions with evidence." },
                { icon: Lock, title: "Immutable Audit", desc: "Every action recorded on-chain for compliance." },
                { icon: Workflow, title: "Smart Routing", desc: "Automatic routing based on category and urgency." },
                { icon: CheckCircle2, title: "Explainable AI", desc: "Every decision includes clear reasoning." },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-5"
                >
                  <item.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section id="architecture" className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground">Architecture</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                GenLayer-first architecture with Firebase as a managed support layer.
              </p>
            </div>
            <div className="max-w-lg mx-auto">
              <div className="flex flex-col items-center gap-3">
                {[
                  { label: "Frontend", sub: "Next.js 15 + TypeScript" },
                  { label: "Firebase", sub: "Auth, Storage, Cache" },
                  { label: "GenLayer Contract", sub: "AI Processing + Consensus" },
                  { label: "Validator Consensus", sub: "5 Independent Validators" },
                  { label: "Human Review Queue", sub: "Mandatory for Critical Cases" },
                  { label: "Immutable Audit Trail", sub: "On-Chain Records" },
                ].map((step, i) => (
                  <div key={step.label} className="w-full">
                    <div className="rounded-lg border border-border bg-card p-4 text-center">
                      <div className="font-semibold text-foreground">{step.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{step.sub}</div>
                    </div>
                    {i < 5 && (
                      <div className="flex justify-center py-1">
                        <div className="w-px h-4 bg-border" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="py-20 bg-white border-y border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground">Security & Privacy</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                { title: "No PHI On-Chain", desc: "Patient identifiers never leave your Firebase instance. Only hashes and classifications go on-chain." },
                { title: "Firestore Security Rules", desc: "Firebase security rules enforce data access by role — validators only see de-identified text." },
                { title: "Wallet-Based Identity", desc: "On-chain actions tied to wallet addresses with role-based permissions in the smart contract." },
                { title: "Immutable Records", desc: "All decisions, votes, and challenges are permanently recorded for compliance audits." },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">FAQ</h2>
            <div className="space-y-6">
              {[
                {
                  q: "Does Clario diagnose patients?",
                  a: "No. Clario is an administrative triage tool. It prioritizes clinical notes for routing and review — it never diagnoses, prescribes, or recommends treatment.",
                },
                {
                  q: "How is patient data protected?",
                  a: "Raw clinical notes are stored encrypted in Firebase. Notes are de-identified before AI processing. Only hashes and classifications are stored on-chain — never PHI.",
                },
                {
                  q: "What is validator consensus?",
                  a: "Five independent GenLayer validators independently analyze each note and vote on the triage category. Decisions require 80%+ agreement for strong consensus.",
                },
                {
                  q: "Can decisions be challenged?",
                  a: "Yes. Any stakeholder can challenge a triage decision with evidence. Challenges trigger AI-assisted re-evaluation through a new consensus round.",
                },
                {
                  q: "What blockchain does Clario use?",
                  a: "Clario is built on GenLayer, an AI-native Layer-1 blockchain that enables Intelligent Contracts with built-in LLM capabilities and Optimistic Democracy consensus.",
                },
              ].map((item) => (
                <div key={item.q} className="border-b border-border pb-6">
                  <h3 className="font-semibold text-foreground">{item.q}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Clario</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Administrative clinical workflow infrastructure. Never diagnoses. Never prescribes.
          </p>
          <p className="text-sm text-muted-foreground">
            Built on{" "}
            <span className="font-medium text-foreground">GenLayer</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
