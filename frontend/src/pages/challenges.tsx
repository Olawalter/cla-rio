import { Link } from "react-router-dom";
import { Activity, Scale } from "lucide-react";
import { useListChallenges, type ChallengeData } from "@/hooks/use-contract";
import { formatTimestamp } from "@/lib/utils";

export function ChallengesPage() {
  const { data: rawChallenges, isLoading } = useListChallenges();

  const challenges: ChallengeData[] = rawChallenges
    ? (Array.isArray(rawChallenges) ? rawChallenges : []).map((c: any) =>
        typeof c === "string" ? JSON.parse(c) : c
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Challenges</h1>
        <p className="text-sm text-text-secondary mt-1">
          Disputed triage decisions awaiting resolution.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Activity className="h-5 w-5 animate-spin text-text-tertiary" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="py-16 text-center">
            <Scale className="h-8 w-8 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-tertiary">No challenges filed.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {challenges.map((ch) => (
              <Link
                key={ch.challenge_id}
                to={`/cases/${ch.case_id}`}
                className="block px-5 py-4 hover:bg-surface-secondary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Scale className="h-4.5 w-4.5 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {ch.challenge_id}
                      </p>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        Case: {ch.case_id} · Filed {formatTimestamp(ch.created_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      ch.status === "resolved"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {ch.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-text-secondary pl-8">
                  {ch.reason}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
