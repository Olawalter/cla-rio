import { Link } from "react-router-dom";
import { Activity, Clock } from "lucide-react";
import { useListCasesByStatus, type CaseData } from "@/hooks/use-contract";
import { categoryColor, formatTimestamp } from "@/lib/utils";

export function PendingPage() {
  const { data: rawPending, isLoading: loadingPending } = useListCasesByStatus("pending_consensus");
  const { data: rawSubmitted, isLoading: loadingSubmitted } = useListCasesByStatus("submitted");

  const parse = (raw: unknown): CaseData[] =>
    raw
      ? (Array.isArray(raw) ? raw : []).map((c: any) =>
          typeof c === "string" ? JSON.parse(c) : c
        )
      : [];

  const cases = [...parse(rawPending), ...parse(rawSubmitted)];
  const isLoading = loadingPending || loadingSubmitted;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Pending Consensus</h1>
        <p className="text-sm text-text-secondary mt-1">
          Cases awaiting validator consensus.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Activity className="h-5 w-5 animate-spin text-text-tertiary" />
          </div>
        ) : cases.length === 0 ? (
          <div className="py-16 text-center">
            <Clock className="h-8 w-8 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-tertiary">No pending cases.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {cases.map((c) => (
              <Link
                key={c.case_id}
                to={`/cases/${c.case_id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-surface-secondary transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Clock className="h-4.5 w-4.5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {c.case_id}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {c.department || "—"} · Submitted {formatTimestamp(c.created_at)}
                    </p>
                  </div>
                </div>
                {c.category && (
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${categoryColor(c.category)}`}>
                    {c.category}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
