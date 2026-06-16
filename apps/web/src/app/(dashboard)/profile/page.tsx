"use client";

import { useState } from "react";
import { User, Wallet, Copy, Check, Shield, Clock, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { useNotes } from "@/hooks/use-notes";
import { useAuditLogs } from "@/hooks/use-audit";
import { formatTimestamp } from "@/lib/utils";

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const { address } = useWallet();
  const { data: notes } = useNotes();
  const { data: auditLogs } = useAuditLogs({ limit: 50 });
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const totalNotes = notes?.length ?? 0;
  const totalAuditEvents = auditLogs?.length ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account details and embedded wallet information.
        </p>
      </div>

      {/* Account Info */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <User className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Account</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="text-sm font-medium text-foreground">{profile?.full_name || "—"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{user?.email || "—"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-medium text-foreground capitalize">{profile?.role || "submitter"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">User ID</p>
              <p className="text-sm font-mono text-foreground">{user?.uid || "—"}</p>
            </div>
            {user?.uid && (
              <button
                onClick={() => copyToClipboard(user.uid, "uid")}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
              >
                {copied === "uid" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Wallet */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Embedded Wallet</h3>
          <span className="ml-auto inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            Active
          </span>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-4 py-3">
              <p className="text-sm font-mono text-foreground flex-1 break-all">{address || "Generating..."}</p>
              {address && (
                <button
                  onClick={() => copyToClipboard(address, "address")}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors flex-shrink-0"
                >
                  {copied === "address" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
          <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Permanent Embedded Wallet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This GenLayer wallet was automatically generated for your account and is permanently linked to your profile.
                  It is used for all on-chain interactions including note submissions, consensus voting, and audit trail entries.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Network</p>
              <p className="text-sm font-medium text-foreground">GenLayer StudioNet</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Chain ID</p>
              <p className="text-sm font-medium text-foreground">61999</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Activity</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-muted/50 border border-border p-4 text-center">
              <FileText className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{totalNotes}</p>
              <p className="text-xs text-muted-foreground">Notes Submitted</p>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-4 text-center">
              <Shield className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{totalAuditEvents}</p>
              <p className="text-xs text-muted-foreground">Audit Events</p>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-4 text-center">
              <Wallet className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{address ? "1" : "0"}</p>
              <p className="text-xs text-muted-foreground">Wallets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Audit Trail */}
      {auditLogs && auditLogs.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="p-5 space-y-3">
            {auditLogs.slice(0, 10).map((log: any) => (
              <div key={log.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                <div>
                  <p className="text-sm text-foreground capitalize">{log.event_type?.replace(/_/g, " ")}</p>
                  {log.note_id && (
                    <p className="text-xs font-mono text-muted-foreground">{log.note_id}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{formatTimestamp(log.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
