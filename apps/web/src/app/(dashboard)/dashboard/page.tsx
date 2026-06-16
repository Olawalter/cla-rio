"use client";

import {
  FileText,
  AlertTriangle,
  Users,
  Scale,
  Activity,
  Clock,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useNotes } from "@/hooks/use-notes";
import { useAuditLogs } from "@/hooks/use-audit";
import { useChallenges, useAllTriageResults } from "@/hooks/use-triage";
import { useProcessPendingNotes } from "@/hooks/use-process-pending";
import { formatTimestamp } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  emergency: "bg-red-500",
  urgent: "bg-amber-500",
  same_day: "bg-blue-500",
  routine: "bg-green-500",
  administrative: "bg-slate-400",
};

const STATUS_COLORS: Record<string, string> = {
  submitted: "text-primary",
  consensus_reached: "text-success",
  human_review: "text-warning",
  challenged: "text-destructive",
  finalized: "text-success",
};

export default function DashboardPage() {
  useProcessPendingNotes();
  const { data: notes, isLoading: notesLoading } = useNotes();
  const { data: auditLogs, isLoading: auditLoading } = useAuditLogs({ limit: 10 });
  const { data: challenges } = useChallenges();
  const { data: triageResults } = useAllTriageResults();

  const pendingCount = notes?.filter((n: any) => ["submitted", "pending_triage"].includes(n.status)).length ?? 0;
  const reviewCount = notes?.filter((n: any) => n.status === "human_review").length ?? 0;
  const consensusCount = notes?.filter((n: any) => n.status === "consensus_reached").length ?? 0;
  const challengeCount = challenges?.filter((c: any) => c.status === "open").length ?? 0;

  const categoryDistribution = {
    emergency: triageResults?.filter((t: any) => t.category === "emergency").length ?? 0,
    urgent: triageResults?.filter((t: any) => t.category === "urgent").length ?? 0,
    same_day: triageResults?.filter((t: any) => t.category === "same_day").length ?? 0,
    routine: triageResults?.filter((t: any) => t.category === "routine").length ?? 0,
    administrative: triageResults?.filter((t: any) => t.category === "administrative").length ?? 0,
  };

  const stats = [
    { label: "Pending Notes", value: pendingCount, icon: FileText, color: "text-primary" },
    { label: "Human Review", value: reviewCount, icon: AlertTriangle, color: "text-warning" },
    { label: "Consensus Queue", value: consensusCount, icon: Users, color: "text-muted-foreground" },
    { label: "Open Challenges", value: challengeCount, icon: Scale, color: "text-destructive" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of clinical note triage activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">
              {notesLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Recent Notes</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {notesLoading ? (
              <div className="p-5 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : notes && notes.length > 0 ? (
              notes.slice(0, 5).map((note: any) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {note.title || "Untitled Note"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(note.created_at)}
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${STATUS_COLORS[note.status] || "text-muted-foreground"}`}>
                    {note.status?.replace("_", " ")}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-5">
                <p className="text-sm text-muted-foreground text-center py-8">
                  No notes submitted yet. Submit your first note to get started.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Audit Trail</h3>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {auditLoading ? (
              <div className="p-5 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : auditLogs && auditLogs.length > 0 ? (
              auditLogs.slice(0, 5).map((log: any) => (
                <div key={log.id} className="px-5 py-3">
                  <p className="text-sm text-foreground">
                    {log.event_type?.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(log.created_at)}
                    {log.actor_address && (
                      <> &middot; {log.actor_address.slice(0, 6)}...{log.actor_address.slice(-4)}</>
                    )}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-5">
                <p className="text-sm text-muted-foreground text-center py-8">
                  No audit events yet. Activity will appear here as notes are processed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Triage Distribution */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Triage Distribution</h3>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-center gap-6 py-8">
            {[
              { label: "Emergency", key: "emergency" },
              { label: "Urgent", key: "urgent" },
              { label: "Same-Day", key: "same_day" },
              { label: "Routine", key: "routine" },
              { label: "Administrative", key: "administrative" },
            ].map((item) => (
              <div key={item.key} className="text-center">
                <div className={`mx-auto h-3 w-3 rounded-full ${CATEGORY_COLORS[item.key]}`} />
                <div className="mt-2 text-xs text-muted-foreground">{item.label}</div>
                <div className="text-lg font-semibold text-foreground">
                  {categoryDistribution[item.key as keyof typeof categoryDistribution]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
