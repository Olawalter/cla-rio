"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Activity,
  Users,
  Scale,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useNote } from "@/hooks/use-notes";
import { useTriageResult, useValidatorDecisions, useChallenges } from "@/hooks/use-triage";
import { useAuditLogs } from "@/hooks/use-audit";
import { useAuth } from "@/hooks/use-auth";
import { useChallengeDecision } from "@/hooks/use-challenge-decision";
import { useEnsureTriage } from "@/hooks/use-ensure-triage";
import { formatTimestamp, getConsensusStrength } from "@/lib/utils";

const CATEGORY_BADGE: Record<string, string> = {
  emergency: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  urgent: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  same_day: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  routine: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  administrative: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
};

export default function NoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const noteId = id as string;

  const { user } = useAuth();
  useEnsureTriage(noteId);
  const { data: note, isLoading: noteLoading } = useNote(noteId);
  const { data: triage, isLoading: triageLoading } = useTriageResult(noteId);
  const { data: validatorDecisions } = useValidatorDecisions(noteId);
  const { data: challenges } = useChallenges(noteId);
  const { data: auditLogs } = useAuditLogs({ noteId });

  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeReason, setChallengeReason] = useState("");
  const [challengeEvidence, setChallengeEvidence] = useState("");
  const challengeDecision = useChallengeDecision();

  const handleChallenge = async () => {
    if (!user || !note) return;
    await challengeDecision.challenge({
      noteId: note.id,
      noteHash: note.note_hash,
      challengerId: user.uid,
      reason: challengeReason,
      evidence: challengeEvidence,
      originalCategory: triage?.category || "unknown",
    });
    setShowChallengeForm(false);
    setChallengeReason("");
    setChallengeEvidence("");
  };

  if (noteLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-muted-foreground">Note not found.</p>
        <Link href="/dashboard" className="text-primary text-sm mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{note.title || "Untitled Note"}</h1>
          <p className="text-sm text-muted-foreground font-mono">{noteId}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* De-identified Note */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">De-identified Note</h3>
            </div>
            <div className="p-5">
              {(note.de_identified_text || note.encrypted_content || note.content) ? (
                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                  {note.de_identified_text || note.encrypted_content || note.content}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  De-identified text will appear after processing.
                </p>
              )}
            </div>
          </div>

          {/* AI Assessment */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">AI Assessment</h3>
            </div>
            <div className="p-5">
              {triageLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : triage ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Category</span>
                      <div className="mt-1">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${CATEGORY_BADGE[triage.category] || ""}`}>
                          {triage.category?.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Priority Score</span>
                      <p className="mt-1 text-lg font-bold text-foreground">{triage.priority_score}/100</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Confidence</span>
                      <p className="mt-1 text-lg font-bold text-foreground">{triage.confidence}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Routing</span>
                      <p className="mt-1 text-sm text-foreground">{triage.routing_recommendation}</p>
                    </div>
                  </div>
                  {triage.reasoning && (
                    <div>
                      <span className="text-xs text-muted-foreground">Reasoning</span>
                      <p className="mt-1 text-sm text-foreground leading-relaxed">{triage.reasoning}</p>
                    </div>
                  )}
                  {triage.missing_info && triage.missing_info.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Missing Information</span>
                      <ul className="mt-1 list-disc list-inside text-sm text-foreground">
                        {triage.missing_info.map((info: string, i: number) => (
                          <li key={i}>{info}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {triage.critical_keywords_found && triage.critical_keywords_found.length > 0 && (
                    <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3">
                      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Critical Keywords Detected</p>
                        <p className="text-xs text-destructive/80 mt-1">
                          {triage.critical_keywords_found.join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Assessment details will appear after consensus.
                </p>
              )}
            </div>
          </div>

          {/* Validator Decisions */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Validator Decisions</h3>
            </div>
            <div className="p-5">
              {validatorDecisions && validatorDecisions.length > 0 ? (
                <div className="space-y-3">
                  {validatorDecisions.map((v: any, i: number) => (
                    <div key={v.id || i} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                      <div>
                        <p className="text-sm font-mono text-foreground">
                          {v.validator_address?.slice(0, 8)}...{v.validator_address?.slice(-6)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatTimestamp(v.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_BADGE[v.category] || ""}`}>
                          {v.category}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {v.vote === "agree" ? (
                            <span className="text-success">Agreed</span>
                          ) : (
                            <span className="text-destructive">Disagreed</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Individual validator votes will appear here.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-foreground capitalize">{note.status?.replace("_", " ") || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium text-foreground">{triage?.category?.replace("_", " ") || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Priority</span>
                <span className="font-medium text-foreground">{triage?.priority_score ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-medium text-foreground">{triage?.confidence ? `${triage.confidence}%` : "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Consensus</span>
                <span className="font-medium text-foreground">
                  {triage?.consensus_percentage ? `${triage.consensus_percentage}% (${getConsensusStrength(triage.consensus_percentage)})` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Source</span>
                <span className={`font-medium text-xs ${triage?.source === "genlayer_contract" ? "text-success" : "text-muted-foreground"}`}>
                  {triage?.source === "genlayer_contract" ? "On-Chain (GenLayer)" : triage?.source === "local_triage" ? "Local Triage" : "—"}
                </span>
              </div>
              {note.tx_hash && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">TX Hash</span>
                  <span className="font-mono text-xs text-foreground">{note.tx_hash.slice(0, 10)}...</span>
                </div>
              )}
            </div>
          </div>

          {/* Challenge */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Challenge</h3>
            {challenges && challenges.length > 0 ? (
              <div className="space-y-2 mb-4">
                {challenges.map((c: any) => (
                  <div key={c.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${c.status === "open" ? "text-warning" : c.status === "resolved" ? "text-success" : "text-muted-foreground"}`}>
                        {c.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatTimestamp(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-foreground mt-1">{c.reason}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {showChallengeForm ? (
              <div className="space-y-3">
                <textarea
                  value={challengeReason}
                  onChange={(e) => setChallengeReason(e.target.value)}
                  placeholder="Reason for challenge..."
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <textarea
                  value={challengeEvidence}
                  onChange={(e) => setChallengeEvidence(e.target.value)}
                  placeholder="Supporting evidence..."
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {challengeDecision.error && (
                  <p className="text-xs text-destructive">{challengeDecision.error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleChallenge}
                    disabled={!challengeReason.trim() || challengeDecision.step !== "idle"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                  >
                    {challengeDecision.step !== "idle" && challengeDecision.step !== "error" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    Submit Challenge
                  </button>
                  <button
                    onClick={() => setShowChallengeForm(false)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowChallengeForm(true)}
                className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Challenge This Decision
              </button>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Timeline</h3>
            {auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      <div className="w-px flex-1 bg-border" />
                    </div>
                    <div className="pb-3">
                      <p className="text-sm text-foreground">{log.event_type?.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">{formatTimestamp(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No events yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
