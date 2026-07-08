"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Activity,
  Scale,
  Loader2,
  Send,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useNoteDetail, useAllChallenges, useAllAuditLogs } from "@/hooks/use-contract";
import { useChallengeDecision } from "@/hooks/use-challenge-decision";
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
  const noteHash = id as string;

  const { data, isLoading } = useNoteDetail(noteHash);
  const { data: allChallenges } = useAllChallenges();
  const { data: allAuditLogs } = useAllAuditLogs();

  const note = data?.note;
  const assessment = data?.assessment;
  const challenges = allChallenges?.filter((c) => c.note_hash === noteHash) ?? [];
  const auditLogs = allAuditLogs?.filter((l) => l.note_hash === noteHash) ?? [];

  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeReason, setChallengeReason] = useState("");
  const [challengeEvidence, setChallengeEvidence] = useState("");
  const challengeDecision = useChallengeDecision();

  const handleChallenge = async () => {
    await challengeDecision.challenge({
      noteHash,
      reason: challengeReason,
      evidence: challengeEvidence,
    });
    setShowChallengeForm(false);
    setChallengeReason("");
    setChallengeEvidence("");
  };

  const missingInfo = assessment?.missing_info
    ? (typeof assessment.missing_info === "string" ? JSON.parse(assessment.missing_info) : assessment.missing_info)
    : [];
  const criticalKeywords = assessment?.critical_keywords_found
    ? (typeof assessment.critical_keywords_found === "string" ? JSON.parse(assessment.critical_keywords_found) : assessment.critical_keywords_found)
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-muted-foreground">Note not found on-chain.</p>
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
          <h1 className="text-2xl font-bold text-foreground">Note Detail</h1>
          <p className="text-sm text-muted-foreground font-mono">{noteHash.slice(0, 16)}...</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Clinical Note (On-Chain)</h3>
            </div>
            <div className="p-5">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {note.de_identified_text}
              </pre>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">AI Assessment (On-Chain)</h3>
            </div>
            <div className="p-5">
              {assessment ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Category</span>
                      <div className="mt-1">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${CATEGORY_BADGE[assessment.category] || ""}`}>
                          {assessment.category?.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Priority Score</span>
                      <p className="mt-1 text-lg font-bold text-foreground">{assessment.priority_score}/100</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Confidence</span>
                      <p className="mt-1 text-lg font-bold text-foreground">{assessment.confidence}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Routing</span>
                      <p className="mt-1 text-sm text-foreground">{assessment.routing_recommendation}</p>
                    </div>
                  </div>
                  {assessment.reasoning && (
                    <div>
                      <span className="text-xs text-muted-foreground">Reasoning</span>
                      <p className="mt-1 text-sm text-foreground leading-relaxed">{assessment.reasoning}</p>
                    </div>
                  )}
                  {missingInfo.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Missing Information</span>
                      <ul className="mt-1 list-disc list-inside text-sm text-foreground">
                        {missingInfo.map((info: string, i: number) => (
                          <li key={i}>{info}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {criticalKeywords.length > 0 && (
                    <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3">
                      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Critical Keywords Detected</p>
                        <p className="text-xs text-destructive/80 mt-1">
                          {criticalKeywords.join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Assessment pending consensus...
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-foreground capitalize">{note.status?.replace("_", " ")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium text-foreground capitalize">{assessment?.category?.replace("_", " ") || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Priority</span>
                <span className="font-medium text-foreground">{assessment?.priority_score ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-medium text-foreground">{assessment?.confidence ? `${assessment.confidence}%` : "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium text-xs text-success">On-Chain (GenLayer)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Submitter</span>
                <span className="font-mono text-xs text-foreground">{note.submitter?.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Timestamp</span>
                <span className="text-xs text-foreground">{formatTimestamp(note.timestamp)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Challenge</h3>
            {challenges.length > 0 && (
              <div className="space-y-2 mb-4">
                {challenges.map((c) => (
                  <div key={c.challenge_id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${c.status === "open" ? "text-warning" : c.status === "resolved" ? "text-success" : "text-muted-foreground"}`}>
                        {c.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatTimestamp(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-foreground mt-1">{c.reason}</p>
                    {c.resolution && (
                      <p className="text-xs text-muted-foreground mt-1">{c.resolution}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

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
                    Submit On-Chain
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

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4">On-Chain Timeline</h3>
            {auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.map((log, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      <div className="w-px flex-1 bg-border" />
                    </div>
                    <div className="pb-3">
                      <p className="text-sm text-foreground capitalize">{log.event_type?.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">{formatTimestamp(log.timestamp)}</p>
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
