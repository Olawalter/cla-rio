import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Search, Filter } from "lucide-react";
import { useListCases, type CaseData } from "@/hooks/use-contract";
import { statusColor, statusLabel, categoryColor, formatTimestamp } from "@/lib/utils";

const STATUS_FILTERS = [
  "all",
  "submitted",
  "pending_consensus",
  "consensus_complete",
  "manual_review",
  "challenged",
  "finalized",
  "archived",
] as const;

export function CasesPage() {
  const { data: cases, isLoading } = useListCases();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const parsedCases: CaseData[] = cases
    ? (Array.isArray(cases) ? cases : []).map((c: any) =>
        typeof c === "string" ? JSON.parse(c) : c
      )
    : [];

  const filtered = parsedCases.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.case_id.toLowerCase().includes(q) ||
        (c.department || "").toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">All Cases</h1>
        <p className="text-sm text-text-secondary mt-1">
          {parsedCases.length} total case{parsedCases.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, department, category..."
            className="w-full rounded-lg border border-border bg-white pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text-primary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Statuses" : statusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Activity className="h-5 w-5 animate-spin text-text-tertiary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-text-tertiary">
            No cases found.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((c) => (
              <Link
                key={c.case_id}
                to={`/cases/${c.case_id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-surface-secondary transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xs font-mono text-text-tertiary w-28 flex-shrink-0">
                    {c.case_id}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary">
                      {c.department || "—"} · {c.note_type || "clinical_note"}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Submitted {formatTimestamp(c.created_at)} · Priority{" "}
                      {c.priority ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {c.category && (
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${categoryColor(
                        c.category
                      )}`}
                    >
                      {c.category}
                    </span>
                  )}
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusColor(
                      c.status
                    )}`}
                  >
                    {statusLabel(c.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
