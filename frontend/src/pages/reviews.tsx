import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Shield, CheckCircle } from "lucide-react";
import { useListCasesByStatus, type CaseData } from "@/hooks/use-contract";
import { useTransaction } from "@/hooks/use-transaction";
import { TransactionStatus } from "@/components/ui/transaction-status";
import { categoryColor, formatTimestamp } from "@/lib/utils";

export function ReviewsPage() {
  const { data: rawCases, isLoading } = useListCasesByStatus("manual_review");
  const tx = useTransaction();
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [decision, setDecision] = useState("");

  const cases: CaseData[] = rawCases
    ? (Array.isArray(rawCases) ? rawCases : []).map((c: any) =>
        typeof c === "string" ? JSON.parse(c) : c
      )
    : [];

  async function handleSubmitReview(caseId: string) {
    if (!decision.trim()) return;
    await tx.execute("submit_manual_review", [caseId, decision]);
    setDecision("");
    setExpandedCase(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Manual Reviews</h1>
        <p className="text-sm text-text-secondary mt-1">
          Cases requiring human reviewer assessment.
        </p>
      </div>

      <TransactionStatus step={tx.step} error={tx.error} txHash={tx.txHash} />

      <div className="rounded-xl border border-border bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Activity className="h-5 w-5 animate-spin text-text-tertiary" />
          </div>
        ) : cases.length === 0 ? (
          <div className="py-16 text-center">
            <Shield className="h-8 w-8 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-tertiary">No cases pending review.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {cases.map((c) => (
              <div key={c.case_id}>
                <div
                  className="flex items-center justify-between px-5 py-4 hover:bg-surface-secondary transition-colors cursor-pointer"
                  onClick={() =>
                    setExpandedCase(expandedCase === c.case_id ? null : c.case_id)
                  }
                >
                  <div className="flex items-center gap-4">
                    <Shield className="h-4.5 w-4.5 text-primary-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {c.case_id}
                      </p>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {c.department || "—"} · Priority {c.priority ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.category && (
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${categoryColor(c.category)}`}>
                        {c.category}
                      </span>
                    )}
                    <Link
                      to={`/cases/${c.case_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Details
                    </Link>
                  </div>
                </div>

                {expandedCase === c.case_id && (
                  <div className="px-5 pb-4 space-y-3">
                    {c.reasoning && (
                      <div className="rounded-lg bg-surface-secondary p-3">
                        <p className="text-xs text-text-tertiary mb-1">AI Reasoning</p>
                        <p className="text-sm text-text-secondary">{c.reasoning}</p>
                      </div>
                    )}
                    <textarea
                      value={decision}
                      onChange={(e) => setDecision(e.target.value)}
                      placeholder="Enter your review decision..."
                      rows={3}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-text-tertiary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
                    />
                    <button
                      onClick={() => handleSubmitReview(c.case_id)}
                      disabled={tx.isLoading || !decision.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Submit Review
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
