"use client";

import { useState } from "react";
import { Wallet, Copy, Check, Shield, Clock, FileText } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useAllNotes, useAllAuditLogs, useContractRead } from "@/hooks/use-contract";

export default function ProfilePage() {
  const { address } = useWallet();
  const { data: notesData } = useAllNotes();
  const { data: auditLogs } = useAllAuditLogs();
  const { data: role } = useContractRead("get_role", [address || ""]);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const myNotes = notesData?.filter((n) => n.note.submitter === address) ?? [];
  const totalAuditEvents = auditLogs?.length ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your wallet and on-chain activity.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">GenLayer Wallet</h3>
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
                <p className="text-sm font-medium text-foreground">Auto-Generated Wallet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This GenLayer wallet was automatically generated and stored in your browser.
                  It is used for all on-chain interactions — no MetaMask or external wallet needed.
                  StudioNet is gasless, so all transactions are free.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Network</p>
              <p className="text-sm font-medium text-foreground">StudioNet</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Chain ID</p>
              <p className="text-sm font-medium text-foreground">61999</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">On-Chain Role</p>
              <p className="text-sm font-medium text-foreground capitalize">{(role as string) || "submitter"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">On-Chain Activity</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-muted/50 border border-border p-4 text-center">
              <FileText className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{myNotes.length}</p>
              <p className="text-xs text-muted-foreground">Notes Submitted</p>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-4 text-center">
              <Shield className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{totalAuditEvents}</p>
              <p className="text-xs text-muted-foreground">Audit Events</p>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-4 text-center">
              <Wallet className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{notesData?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Notes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
