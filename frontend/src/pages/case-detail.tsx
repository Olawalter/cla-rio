import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  CheckCircle,
  Scale,
  FileText,
  Clock,
  Shield,
} from "lucide-react";
import {
  useGetCase,
  useListChallengesByCase,
  useAuditHistoryByCase,
  type CaseData,
  type ChallengeData,
  type AuditEntry,
} from "@/hooks/use-contract";
import { useTransaction } from "@/hooks/use-transaction";
import { TransactionStatus } from "@/components/ui/transaction-status";
import { statusColor, statusLabel, categoryColor, formatTimestamp } from "@/lib/utils";

export function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { data: rawCase, isLoading } = useGetCase(caseId || "");
  const { data: rawChallenges } = useListChallengesByCase(caseId || "");
  const { data: rawAudit } = useAuditHistoryByCase(caseId || "");

  const [challengeReason, setChallengeReason] = useState("");
  const [reviewDecision, setReviewDecision] = useState("");
  const tx = useTransaction();

  const caseData: CaseData | null = rawCase
    ? typeof rawCase === "string"
      ? JSON.parse(rawCase)
      : (rawCase as CaseData)
    : null;

  const challenges: ChallengeData[] = rawChallenges
    ? (Array.isArray(rawChallenges) ? rawChallenges : []).map((c: any) =>
        typeof c === "string" ? JSON.parse(c) : c
      )
    : [];

  const auditEntries: AuditEntry[] = rawAudit
    ? (Array.isArray(rawAudit) ? rawAudit : []).map((a: any) =>
        typeof a === "string" ? JSON.parse(a) : a
      )
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Activity className="h-6 w-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="py-24 text-center">
        <p className="text-text-tertiary">Case not found.</p>
        <Link to="/cases" className="mt-4 text-sm text-primary-600 hover:text-primary-700">
          Back to cases
        </Link>
      </div>
    );
  }

  async function handleChallenge(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeReason.trim() || !caseId) return;
    await tx.execute("challenge_decision", [caseId, challengeReason]);
    setChallengeReason("");
  }

  async function handleRequestReview() {
    if (!caseId) return;
    await tx.execute("request_manual_review", [caseId]);
  }

  async function handleFinalize() {
    if (!caseId) return;
    await tx.execute("finalize_case", [caseId]);
  }

  async function handleArchive() {
    if (!caseId) return;
    await tx.execute("archive_case", [caseId]);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        to="/cases"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All Cases
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-mono">
            {caseData.case_id}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {caseData.department || "—"} · {caseData.note_type || "clinical_note"} ·
            Submitted {formatTimestamp(caseData.created_at)}
          </p>
        </div>
        <span className={`rounded-lg px-3 py-1.5 text-sm font-medium ${statusColor(caseData.status)}`}>
          {statusLabel(caseData.status)}
        </span>
      </div>

      <TransactionStatus step={tx.step} error={tx.error} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {caseData.category && (
            <div className="rounded-xl border border-border bg-white p-5 space-y-4">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-primary-500" />
                AI Assessment
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-text-tertiary">Category</p>
                  <span className={`inline-block mt-1 rounded-md px-2 py-0.5 text-xs font-medium ${categoryColor(caseData.category)}`}>
                    {caseData.category}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Priority</p>
                  <p className="mt-1 text-lg font-bold text-text-primary">
                    {caseData.priority ?? "—"}
                    <span className="text-xs font-normal text-text-tertiary">/100</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Confidence</p>
                  <p className="mt-1 text-lg font-bold text-text-primary">
                    {caseData.confidence ?? "—"}%
                  </p>
                </div>
              </div>
              {caseData.reasoning && (
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Reasoning</p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {caseData.reasoning}
                  </p>
                </div>
              )}
              {caseData.routing_recommendation && (
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Recommended Action</p>
                  <p className="text-sm text-text-secondary">{caseData.routing_recommendation}</p>
                </div>
              )}
              {caseData.critical_keywords_found && (
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Critical Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(typeof caseData.critical_keywords_found === "string"
                      ? caseData.critical_keywords_found.split(",")
                      : Array.isArray(caseData.critical_keywords_found)
                      ? caseData.critical_keywords_found
                      : []
                    ).map((kw: string) => (
                      <span
                        key={kw}
                        className="rounded-md bg-red-50 text-red-700 px-2 py-0.5 text-xs"
                      >
                        {kw.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="font-semibold text-text-primary flex items-center gap-2 mb-3">
              <FileText className="h-4.5 w-4.5 text-primary-500" />
              Redacted Note
            </h2>
            <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono bg-surface-secondary rounded-lg p-4 max-h-64 overflow-y-auto">
              {caseData.sanitized_text || "—"}
            </pre>
          </div>

          {challenges.length > 0 && (
            <div className="rounded-xl border border-border bg-white p-5 space-y-3">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <Scale className="h-4.5 w-4.5 text-primary-500" />
                Challenges ({challenges.length})
              </h2>
              {challenges.map((ch) => (
                <div key={ch.challenge_id} className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-text-tertiary">{ch.challenge_id}</span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      ch.status === "resolved" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {ch.status}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{ch.reason}</p>
                </div>
              ))}
            </div>
          )}

          {auditEntries.length > 0 && (
            <div className="rounded-xl border border-border bg-white p-5">
              <h2 className="font-semibold text-text-primary flex items-center gap-2 mb-3">
                <Clock className="h-4.5 w-4.5 text-primary-500" />
                Audit Trail
              </h2>
              <div className="space-y-2">
                {auditEntries.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-text-primary">{entry.event_type}</p>
                      <p className="text-xs text-text-tertiary">
                        {formatTimestamp(entry.timestamp)} · {entry.actor?.slice(0, 10)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-white p-5 space-y-3">
            <h3 className="font-semibold text-text-primary text-sm">Actions</h3>
            {(caseData.status === "consensus_complete") && (
              <>
                <button
                  onClick={handleRequestReview}
                  disabled={tx.isLoading}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
                >
                  Request Manual Review
                </button>
                <button
                  onClick={handleFinalize}
                  disabled={tx.isLoading}
                  className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Finalize Case
                </button>
              </>
            )}
            {(caseData.status === "consensus_complete" ||
              caseData.status === "finalized") && (
              <form onSubmit={handleChallenge} className="space-y-2">
                <textarea
                  value={challengeReason}
                  onChange={(e) => setChallengeReason(e.target.value)}
                  placeholder="Reason for challenge..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-text-tertiary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
                />
                <button
                  type="submit"
                  disabled={tx.isLoading || !challengeReason.trim()}
                  className="w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  Challenge Decision
                </button>
              </form>
            )}
            {caseData.status === "finalized" && (
              <button
                onClick={handleArchive}
                disabled={tx.isLoading}
                className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Archive Case
              </button>
            )}
            {caseData.status === "submitted" ||
            caseData.status === "pending_consensus" ? (
              <p className="text-xs text-text-tertiary text-center py-2">
                Awaiting consensus. Actions available after assessment.
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-border bg-white p-5 space-y-2">
            <h3 className="font-semibold text-text-primary text-sm">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-tertiary">Submitter</dt>
                <dd className="text-text-primary font-mono text-xs">
                  {caseData.submitter?.slice(0, 10)}...
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-tertiary">Hospital</dt>
                <dd className="text-text-primary text-xs">
                  {caseData.department || "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-tertiary">Note Hash</dt>
                <dd className="text-text-primary font-mono text-xs truncate max-w-[140px]">
                  {caseData.note_hash || "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-tertiary">Created</dt>
                <dd className="text-text-primary text-xs">
                  {formatTimestamp(caseData.created_at)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
