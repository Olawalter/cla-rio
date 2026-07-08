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
import { useAllNotes, useAllAuditLogs, useAllChallenges } from "@/hooks/use-contract";
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
  const { data: notesData, isLoading: notesLoading } = useAllNotes();
  const { data: auditLogs, isLoading: auditLoading } = useAllAuditLogs();
  const { data: challenges } = useAllChallenges();

  const notes = notesData ?? [];

  const pendingCount = notes.filter((n) => ["submitted"].includes(n.note.status)).length;
  const reviewCount = notes.filter((n) => n.note.status === "human_review").length;
  const consensusCount = notes.filter((n) => n.note.status === "consensus_reached").length;
  const challengeCount = challenges?.filter((c) => c.status === "open").length ?? 0;

  const categoryDistribution = {
    emergency: notes.filter((n) => n.assessment?.category === "emergency").length,
    urgent: notes.filter((n) => n.assessment?.category === "urgent").length,
    same_day: notes.filter((n) => n.assessment?.category === "same_day").length,
    routine: notes.filter((n) => n.assessment?.category === "routine").length,
    administrative: notes.filter((n) => n.assessment?.category === "administrative").length,
  };

  const stats = [
    { label: "Total Notes", value: notes.length, icon: FileText, color: "text-primary" },
    { label: "Human Review", value: reviewCount, icon: AlertTriangle, color: "text-warning" },
    { label: "Consensus Reached", value: consensusCount, icon: Users, color: "text-success" },
    { label: "Open Challenges", value: challengeCount, icon: Scale, color: "text-destructive" },
  ];

  const recentLogs = auditLogs ? [...auditLogs].reverse().slice(0, 8) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All data read directly from GenLayer intelligent contract on StudioNet.
        </p>
      </div>

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
            ) : notes.length > 0 ? (
              [...notes].reverse().slice(0, 5).map((entry) => (
                <Link
                  key={entry.note_hash}
                  href={`/notes/${entry.note_hash}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {entry.note.de_identified_text?.slice(0, 60) || "Untitled"}...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(entry.note.timestamp)}
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${STATUS_COLORS[entry.note.status] || "text-muted-foreground"}`}>
                    {entry.note.status?.replace("_", " ")}
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
            <h3 className="font-semibold text-foreground">On-Chain Audit Trail</h3>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {auditLoading ? (
              <div className="p-5 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : recentLogs.length > 0 ? (
              recentLogs.map((log, i) => (
                <div key={i} className="px-5 py-3">
                  <p className="text-sm text-foreground capitalize">
                    {log.event_type?.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(log.timestamp)}
                    {log.actor && log.actor !== "system" && (
                      <> &middot; {log.actor.slice(0, 6)}...{log.actor.slice(-4)}</>
                    )}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-5">
                <p className="text-sm text-muted-foreground text-center py-8">
                  No audit events yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

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
