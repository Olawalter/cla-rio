import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Shield, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useTransaction, TX_STEP_LABELS } from "@/hooks/use-transaction";
import { TransactionStatus } from "@/components/ui/transaction-status";
import { redactPHI } from "@/lib/phi-redactor";
import { hashText } from "@/lib/utils";

const NOTE_TYPES = [
  { value: "clinical_note", label: "Clinical Note" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "consultation", label: "Consultation" },
  { value: "progress_note", label: "Progress Note" },
  { value: "referral", label: "Referral" },
];

export function SubmitCasePage() {
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("clinical_note");
  const [department, setDepartment] = useState("");
  const [showRedacted, setShowRedacted] = useState(false);
  const { step, error, txHash, execute, reset, isLoading } = useTransaction();

  const redaction = noteText.trim() ? redactPHI(noteText) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;

    const { sanitizedText } = redactPHI(noteText);
    const noteHash = await hashText(noteText);

    await execute("submit_case", [
      sanitizedText,
      noteHash,
      noteType,
      department || "general",
    ]);

    setNoteText("");
    setDepartment("");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Submit Case</h1>
        <p className="text-sm text-text-secondary mt-1">
          Submit a clinical note for AI-assisted triage. PHI is automatically
          redacted before on-chain submission.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Privacy Protection Active
            </p>
            <p className="text-xs text-amber-700 mt-1">
              SSN, DOB, phone numbers, emails, MRN, insurance IDs, names, and
              addresses are automatically redacted before any data leaves your
              browser.
            </p>
          </div>
        </div>
      </div>

      <TransactionStatus step={step} error={error} txHash={txHash} />

      {step === "finalized" ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-green-200 bg-green-50 p-6 text-center"
        >
          <p className="font-medium text-green-800">Case submitted — validators reached consensus.</p>
          {txHash && (
            <div className="mt-2">
              <p className="text-xs text-green-700 font-mono break-all">{txHash}</p>
              <a
                href={`https://studio.genlayer.com/transactions/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-1 text-xs text-primary-600 underline hover:text-primary-700"
              >
                View on GenLayer Studio →
              </a>
            </div>
          )}
          <button
            onClick={reset}
            className="mt-4 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
          >
            Submit Another
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Note Type
              </label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text-primary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              >
                {NOTE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Emergency, Cardiology"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-text-primary">
                Clinical Note
              </label>
              {redaction && redaction.redactionsApplied > 0 && (
                <button
                  type="button"
                  onClick={() => setShowRedacted(!showRedacted)}
                  className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700"
                >
                  {showRedacted ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  {showRedacted ? "Hide" : "Preview"} redacted version
                </button>
              )}
            </div>

            {showRedacted && redaction ? (
              <div className="rounded-lg border border-border bg-surface-secondary p-4 text-sm text-text-primary font-mono whitespace-pre-wrap min-h-[200px]">
                {redaction.sanitizedText}
              </div>
            ) : (
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={10}
                placeholder="Paste or type the clinical note here. Patient identifiers will be automatically redacted."
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-y min-h-[200px] font-mono"
              />
            )}

            {redaction && redaction.redactionsApplied > 0 && (
              <p className="mt-1.5 text-xs text-amber-600">
                {redaction.redactionsApplied} redaction
                {redaction.redactionsApplied > 1 ? "s" : ""} applied:{" "}
                {redaction.redactionTypes.join(", ")}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !noteText.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="h-4 w-4" />
            {isLoading ? "Submitting..." : "Submit for Triage"}
          </button>
        </form>
      )}
    </div>
  );
}
