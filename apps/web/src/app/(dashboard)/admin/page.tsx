"use client";

import { useState } from "react";
import {
  Settings,
  Users,
  Activity,
  FileText,
  Shield,
  RefreshCw,
  Loader2,
  Send,
} from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { useAuditLogs } from "@/hooks/use-audit";
import { useContractRead, useContractWrite } from "@/hooks/use-contract";
import { useWallet } from "@/hooks/use-wallet";
import { formatTimestamp } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [grantAddress, setGrantAddress] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantMessage, setGrantMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [protocolVersion, setProtocolVersion] = useState("");
  const [protocolDescription, setProtocolDescription] = useState("");
  const [protocolLoading, setProtocolLoading] = useState(false);

  const { connected } = useWallet();
  const { data: notes, isLoading: notesLoading } = useNotes();
  const { data: auditLogs, isLoading: auditLoading } = useAuditLogs({ limit: 20 });
  const { data: currentVersion } = useContractRead("get_protocol_version");
  const contractWrite = useContractWrite();

  const totalNotes = notes?.length ?? 0;
  const auditCount = auditLogs?.length ?? 0;

  const handleGrantRole = async () => {
    if (!grantAddress.trim()) return;
    setGrantLoading(true);
    setGrantMessage(null);
    try {
      await contractWrite.mutateAsync({
        functionName: "grant_role",
        args: [grantAddress.trim(), "reviewer"],
      });
      setGrantMessage({ type: "success", text: `Granted reviewer role to ${grantAddress.slice(0, 10)}...` });
      setGrantAddress("");
    } catch (err: any) {
      setGrantMessage({ type: "error", text: err.message || "Failed to grant role" });
    } finally {
      setGrantLoading(false);
    }
  };

  const handleUpdateProtocol = async () => {
    if (!protocolVersion.trim()) return;
    setProtocolLoading(true);
    try {
      await contractWrite.mutateAsync({
        functionName: "update_protocol",
        args: [protocolVersion.trim(), protocolDescription.trim()],
      });
      setProtocolVersion("");
      setProtocolDescription("");
    } catch {
      // error handled by mutation
    } finally {
      setProtocolLoading(false);
    }
  };

  const stats = [
    { label: "Total Notes", value: totalNotes, icon: FileText },
    { label: "Active Validators", value: "—", icon: Users },
    { label: "Protocol Version", value: (currentVersion as string) || "1.0.0", icon: Shield },
    { label: "Audit Events", value: auditCount, icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          System configuration, validator management, and audit explorer.
        </p>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">
              {notesLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Validator Management */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Validator Management</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Grant or revoke validator roles for wallet addresses.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={grantAddress}
                onChange={(e) => setGrantAddress(e.target.value)}
                placeholder="Wallet address (0x...)"
                disabled={grantLoading || !connected}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono disabled:opacity-50"
              />
              <button
                onClick={handleGrantRole}
                disabled={grantLoading || !grantAddress.trim() || !connected}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {grantLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Grant
              </button>
            </div>
            {grantMessage && (
              <p className={`text-xs ${grantMessage.type === "success" ? "text-success" : "text-destructive"}`}>
                {grantMessage.text}
              </p>
            )}
          </div>
        </div>

        {/* Protocol Management */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Protocol Management</h3>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Version</span>
              <span className="font-mono font-medium text-foreground">
                {(currentVersion as string) || "1.0.0"}
              </span>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={protocolVersion}
                onChange={(e) => setProtocolVersion(e.target.value)}
                placeholder="New version (e.g. 1.1.0)"
                disabled={protocolLoading || !connected}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono disabled:opacity-50"
              />
              <input
                type="text"
                value={protocolDescription}
                onChange={(e) => setProtocolDescription(e.target.value)}
                placeholder="Description of changes"
                disabled={protocolLoading || !connected}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>
            <button
              onClick={handleUpdateProtocol}
              disabled={protocolLoading || !protocolVersion.trim() || !connected}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {protocolLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Update Protocol
            </button>
          </div>
        </div>
      </div>

      {/* Audit Explorer */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Audit Explorer</h3>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="divide-y divide-border">
          {auditLoading ? (
            <div className="p-5 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : auditLogs && auditLogs.length > 0 ? (
            auditLogs.map((log: any) => (
              <div key={log.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {log.event_type?.replace(/_/g, " ")}
                  </p>
                  <span className="text-xs text-muted-foreground">{formatTimestamp(log.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {log.actor_address && (
                    <span className="font-mono">{log.actor_address.slice(0, 8)}...{log.actor_address.slice(-4)}</span>
                  )}
                  {log.tx_hash && (
                    <span className="font-mono">TX: {log.tx_hash.slice(0, 10)}...</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-5">
              <p className="text-sm text-muted-foreground text-center py-8">
                Audit events will appear here as the system processes notes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
