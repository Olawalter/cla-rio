import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Activity,
  Users,
  Lock,
  Scale,
  ArrowRight,
  Eye,
  FileText,
  CheckCircle,
  Workflow,
} from "lucide-react";

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
              <Shield className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-xl font-semibold text-text-primary">Clario</span>
          </div>
          <Link
            to="/connect"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
          >
            Connect Wallet
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-text-secondary mb-8">
                <Lock className="h-3.5 w-3.5" />
                100% On-Chain · GenLayer Intelligent Contract
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-text-primary max-w-4xl mx-auto leading-[1.1]">
                Decentralized Clinical Note Triage
              </h1>
              <p className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
                AI-assisted prioritization through validator consensus.
                Immutable audit trails. No external backend.
                Built entirely on GenLayer.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/connect"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-base font-medium text-white hover:bg-primary-600 transition-colors"
                >
                  Launch App
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-surface-secondary border-y border-border">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-text-primary text-center mb-16">
              How It Works
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: FileText, title: "Submit", desc: "Clinician submits a clinical note. PHI is redacted in-browser before on-chain submission." },
                { icon: Activity, title: "AI Triage", desc: "GenLayer validators independently classify the note using on-chain AI via gl.exec_prompt()." },
                { icon: Users, title: "Consensus", desc: "Multiple validators reach agreement through Optimistic Democracy. Category and priority must align." },
                { icon: CheckCircle, title: "Finalize", desc: "Assessment is stored on-chain. Cases can be reviewed, challenged, or finalized with full audit trail." },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="rounded-xl border border-border bg-white p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                    <item.icon className="h-6 w-6 text-primary-500" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-text-primary text-center mb-16">
              Key Features
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: Lock, title: "Privacy-First", desc: "No PHI stored on-chain. Browser-side redaction strips patient identifiers before submission." },
                { icon: Scale, title: "Challenge System", desc: "Dispute any triage decision with evidence. AI re-evaluates through a new consensus round." },
                { icon: Eye, title: "Full Transparency", desc: "Every action creates an immutable audit entry. Complete accountability for compliance." },
                { icon: Workflow, title: "Role-Based Access", desc: "Hospital Admin, Clinician, Reviewer, Auditor. Permissions enforced on-chain." },
                { icon: Shield, title: "No Backend", desc: "The Intelligent Contract is the only backend. No database, no server, no external AI." },
                { icon: Activity, title: "Explainable AI", desc: "Every assessment includes category, priority score, confidence, and detailed reasoning." },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-border bg-white p-5"
                >
                  <item.icon className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-text-primary">{item.title}</h3>
                    <p className="mt-1 text-sm text-text-secondary">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-500" />
            <span className="font-semibold text-text-primary">Clario</span>
          </div>
          <p className="text-sm text-text-tertiary">
            Administrative triage only. Never diagnoses. Built on GenLayer.
          </p>
        </div>
      </footer>
    </div>
  );
}
