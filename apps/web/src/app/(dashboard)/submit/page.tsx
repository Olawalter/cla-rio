"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useSubmitNote } from "@/hooks/use-submit-note";

const STEP_LABELS: Record<string, string> = {
  hashing: "Computing note hash...",
  submitting: "Submitting to GenLayer intelligent contract...",
  awaiting_consensus: "Awaiting GenLayer validator consensus (1-3 min)...",
  reading: "Reading on-chain assessment...",
  complete: "Note submitted and assessed on-chain!",
};

export default function SubmitNotePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const router = useRouter();

  const { step, message, error, noteHash, submit, reset } = useSubmitNote();

  const isSubmitting = step !== "idle" && step !== "complete" && step !== "error";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await submit(title, content);
  };

  if (step === "complete" && noteHash) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-xl border border-success/30 bg-success/5 p-8 text-center">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground">Note Submitted On-Chain</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your clinical note has been submitted, classified by GenLayer AI validators, and the assessment is stored on-chain.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => router.push(`/notes/${noteHash}`)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              View Note Details
            </button>
            <button
              onClick={() => {
                reset();
                setTitle("");
                setContent("");
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Submit Clinical Note</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit a clinical note for on-chain AI triage via GenLayer consensus.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1.5">
              Note Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              placeholder="Brief description of the note"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-foreground mb-1.5">
              Clinical Note Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={isSubmitting}
              rows={12}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono disabled:opacity-50"
              placeholder="Enter the clinical note content here..."
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              The note is sent directly to the GenLayer intelligent contract for AI-powered triage.
            </p>
          </div>

          {isSubmitting && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
                <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                <span className="text-sm text-primary">{STEP_LABELS[step] || message}</span>
              </div>
              <div className="flex gap-1">
                {["hashing", "submitting", "awaiting_consensus", "reading"].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      ["hashing", "submitting", "awaiting_consensus", "reading"].indexOf(step) >=
                      ["hashing", "submitting", "awaiting_consensus", "reading"].indexOf(s)
                        ? "bg-primary"
                        : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit On-Chain
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
