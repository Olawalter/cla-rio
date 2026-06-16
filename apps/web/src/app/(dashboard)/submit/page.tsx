"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Send, Loader2, AlertCircle, CheckCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { useSubmitNote } from "@/hooks/use-submit-note";
import { useUploadAttachment } from "@/hooks/use-attachments";

const STEP_LABELS: Record<string, string> = {
  hashing: "Computing note hash...",
  storing: "Storing encrypted note in database...",
  submitting: "Submitting to GenLayer contract...",
  awaiting_consensus: "Awaiting validator consensus (this may take a moment)...",
  syncing: "Syncing assessment results...",
  complete: "Note submitted and assessed successfully!",
};

export default function SubmitNotePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { user } = useAuth();
  const { connected } = useWallet();
  const { step, message, error, noteId, submit, reset } = useSubmitNote();
  const uploadAttachment = useUploadAttachment();

  const isSubmitting = step !== "idle" && step !== "complete" && step !== "error";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    await submit(title, content, user.uid);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  if (step === "complete" && noteId) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-xl border border-success/30 bg-success/5 p-8 text-center">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground">Note Submitted Successfully</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your clinical note has been submitted and processed through GenLayer consensus.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => router.push(`/notes/${noteId}`)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              View Note Details
            </button>
            <button
              onClick={() => {
                reset();
                setTitle("");
                setContent("");
                setFiles([]);
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
          Submit a clinical note for AI-assisted triage and consensus validation.
        </p>
      </div>

      {!connected && (
        <div className="flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/30 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
          <span className="text-sm text-warning">
            Connect your wallet to submit notes on-chain.
          </span>
        </div>
      )}

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
              The note will be de-identified before AI processing. No PHI is stored on-chain.
            </p>
          </div>

          {/* Attachments */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Drag and drop attachments, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, images, documents up to 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{file.name}</span>
                    <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Status indicator */}
          {isSubmitting && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
                <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                <span className="text-sm text-primary">{STEP_LABELS[step] || message}</span>
              </div>
              <div className="flex gap-1">
                {["hashing", "storing", "submitting", "awaiting_consensus", "syncing"].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      ["hashing", "storing", "submitting", "awaiting_consensus", "syncing"].indexOf(step) >=
                      ["hashing", "storing", "submitting", "awaiting_consensus", "syncing"].indexOf(s)
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

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
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
              Submit for Triage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
