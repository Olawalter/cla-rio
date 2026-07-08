"use client";

import { Users, FileText, CheckCircle, Clock, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useAllNotes, useAllChallenges } from "@/hooks/use-contract";
import { formatTimestamp } from "@/lib/utils";

const CATEGORY_BADGE: Record<string, string> = {
  emergency: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  urgent: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  same_day: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  routine: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  administrative: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
};

export default function ValidatorWorkspacePage() {
  const { data: notesData, isLoading: notesLoading } = useAllNotes();
  const { data: challenges, isLoading: challengesLoading } = useAllChallenges();

  const notes = notesData ?? [];
  const pendingNotes = notes.filter((n) => ["submitted", "human_review"].includes(n.note.status));
  const completedNotes = notes.filter((n) => ["consensus_reached", "finalized"].includes(n.note.status));
  const activeChallenges = challenges?.filter((c) => c.status === "open") ?? [];

  const stats = [
    { label: "Pending Review", value: pendingNotes.length, icon: Clock, color: "text-warning" },
    { label: "Completed", value: completedNotes.length, icon: CheckCircle, color: "text-success" },
    { label: "Active Challenges", value: activeChallenges.length, icon: Users, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Validator Workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View on-chain consensus validation status and challenges.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Notes Pending Review</h3>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="divide-y divide-border">
          {notesLoading ? (
            <div className="p-5 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : pendingNotes.length > 0 ? (
            pendingNotes.map((entry) => (
              <Link
                key={entry.note_hash}
                href={`/notes/${entry.note_hash}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {entry.note.de_identified_text?.slice(0, 60) || "Untitled"}...
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTimestamp(entry.note.timestamp)}
                    <span className="font-mono ml-2">{entry.note_hash.slice(0, 12)}...</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    entry.note.status === "human_review"
                      ? "bg-warning/10 text-warning"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {entry.note.status?.replace("_", " ")}
                  </span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))
          ) : (
            <div className="p-5">
              <p className="text-sm text-muted-foreground text-center py-12">
                No notes pending validation.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Active Challenges</h3>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="divide-y divide-border">
          {challengesLoading ? (
            <div className="p-5 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : activeChallenges.length > 0 ? (
            activeChallenges.map((c) => (
              <Link
                key={c.challenge_id}
                href={`/notes/${c.note_hash}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{c.reason}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTimestamp(c.created_at)}
                    {c.original_category && (
                      <span className="ml-2">Originally: {c.original_category}</span>
                    )}
                  </p>
                </div>
                <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-warning/10 text-warning">
                  {c.status}
                </span>
              </Link>
            ))
          ) : (
            <div className="p-5">
              <p className="text-sm text-muted-foreground text-center py-8">
                No active challenges.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
