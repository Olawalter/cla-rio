import { Activity, Clock } from "lucide-react";
import { useAuditHistory, type AuditEntry } from "@/hooks/use-contract";
import { formatTimestamp, truncateAddress } from "@/lib/utils";

export function AuditPage() {
  const { data: rawAudit, isLoading } = useAuditHistory();

  const entries: AuditEntry[] = rawAudit
    ? (Array.isArray(rawAudit) ? rawAudit : []).map((a: any) =>
        typeof a === "string" ? JSON.parse(a) : a
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Audit History</h1>
        <p className="text-sm text-text-secondary mt-1">
          Immutable on-chain record of all system events.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Activity className="h-5 w-5 animate-spin text-text-tertiary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center">
            <Clock className="h-8 w-8 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-tertiary">No audit entries yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry, i) => (
              <div key={i} className="px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-text-primary">
                      {entry.event_type}
                    </span>
                  </div>
                  <span className="text-xs text-text-tertiary">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
                <div className="ml-5 mt-1 flex items-center gap-4 text-xs text-text-tertiary">
                  <span>Actor: {truncateAddress(entry.actor)}</span>
                  {entry.case_id && <span>Case: {entry.case_id}</span>}
                  {entry.details && <span>{entry.details}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
