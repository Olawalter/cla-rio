import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Scale,
  Activity,
  ArrowRight,
} from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useGetRole, useListCases, useListChallenges } from "@/hooks/use-contract";
import { statusColor, statusLabel, categoryColor, formatTimestamp } from "@/lib/utils";
import type { CaseData } from "@/hooks/use-contract";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { address } = useWallet();
  const { data: role } = useGetRole(address || "");
  const { data: cases, isLoading } = useListCases();
  const { data: challenges } = useListChallenges();

  const parsedCases: CaseData[] = cases
    ? (Array.isArray(cases) ? cases : []).map((c: any) =>
        typeof c === "string" ? JSON.parse(c) : c
      )
    : [];

  const totalCases = parsedCases.length;
  const pendingCases = parsedCases.filter(
    (c) => c.status === "pending_consensus" || c.status === "submitted"
  ).length;
  const completedCases = parsedCases.filter(
    (c) => c.status === "finalized" || c.status === "archived"
  ).length;
  const criticalCases = parsedCases.filter(
    (c) => c.priority && Number(c.priority) >= 80
  ).length;
  const totalChallenges = Array.isArray(challenges) ? challenges.length : 0;

  const recentCases = parsedCases.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">
          Welcome back.{" "}
          <span className="capitalize font-medium">{(role as string) || "unregistered"}</span> view.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Cases" value={totalCases} icon={FileText} color="bg-primary-50 text-primary-600" />
        <StatCard label="Pending" value={pendingCases} icon={Clock} color="bg-amber-50 text-amber-600" />
        <StatCard label="Completed" value={completedCases} icon={CheckCircle} color="bg-green-50 text-green-600" />
        <StatCard label="Critical" value={criticalCases} icon={AlertTriangle} color="bg-red-50 text-red-600" />
        <StatCard label="Challenges" value={totalChallenges} icon={Scale} color="bg-purple-50 text-purple-600" />
      </div>

      <div className="rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold text-text-primary">Recent Cases</h2>
          <Link
            to="/cases"
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Activity className="h-5 w-5 animate-spin text-text-tertiary" />
          </div>
        ) : recentCases.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-tertiary">
            No cases submitted yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentCases.map((c) => (
              <Link
                key={c.case_id}
                to={`/cases/${c.case_id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-secondary transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xs font-mono text-text-tertiary w-24 flex-shrink-0">
                    {c.case_id}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary truncate">
                      {c.department || "—"} · {c.note_type || "clinical_note"}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {formatTimestamp(c.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {c.category && (
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${categoryColor(c.category)}`}>
                      {c.category}
                    </span>
                  )}
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusColor(c.status)}`}>
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
