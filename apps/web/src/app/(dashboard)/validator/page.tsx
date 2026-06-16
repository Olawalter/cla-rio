"use client";

import { Users, FileText, CheckCircle, Clock, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useNotes } from "@/hooks/use-notes";
import { useChallenges } from "@/hooks/use-triage";
import { formatTimestamp } from "@/lib/utils";

const CATEGORY_BADGE: Record<string, string> = {
  emergency: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  urgent: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  same_day: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  routine: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  administrative: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
};

export default function ValidatorWorkspacePage() {
  const { data: notes, isLoading: notesLoading } = useNotes();
  const { data: challenges, isLoading: challengesLoading } = useChallenges();

  const pendingNotes = notes?.filter((n: any) =>
    ["submitted", "human_review"].includes(n.status),
  ) ?? [];
  const completedToday = notes?.filter((n: any) => {
    if (!n.updated_at) return false;
    const today = new Date().toISOString().split("T")[0];
    let dateStr: string;
    if (typeof n.updated_at === "string") {
      dateStr = n.updated_at;
    } else if (n.updated_at?.toDate) {
      dateStr = n.updated_at.toDate().toISOString();
    } else if (n.updated_at?.seconds) {
      dateStr = new Date(n.updated_at.seconds * 1000).toISOString();
    } else {
      return false;
    }
    return dateStr.startsWith(today) && ["consensus_reached", "finalized"].includes(n.status);
  }) ?? [];
  const activeChallenges = challenges?.filter((c: any) => c.status === "open") ?? [];

  const stats = [
    { label: "Pending Review", value: pendingNotes.length, icon: Clock, color: "text-warning" },
    { label: "Completed Today", value: completedToday.length, icon: CheckCircle, color: "text-success" },
    { label: "Active Challenges", value: activeChallenges.length, icon: Users, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Validator Workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review evidence and participate in consensus validation.
        </p>
      </div>

      {/* Stats */}
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

      {/* Pending Notes Queue */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Notes Awaiting Validation</h3>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="divide-y divide-border">
          {notesLoading ? (
            <div className="p-5 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : pendingNotes.length > 0 ? (
            pendingNotes.map((note: any) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {note.title || "Untitled Note"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTimestamp(note.created_at)}
                    {note.note_hash && (
                      <span className="font-mono ml-2">{note.note_hash.slice(0, 12)}...</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    note.status === "human_review"
                      ? "bg-warning/10 text-warning"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {note.status?.replace("_", " ")}
                  </span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))
          ) : (
            <div className="p-5">
              <p className="text-sm text-muted-foreground text-center py-12">
                No notes pending validation. New submissions will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Challenge Participation */}
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
            activeChallenges.map((c: any) => (
              <Link
                key={c.id}
                href={`/notes/${c.note_id}`}
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
                No active challenges to review.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
