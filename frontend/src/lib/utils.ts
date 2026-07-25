import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function truncateAddress(address: string, chars = 6): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTimestamp(ts: string): string {
  if (!ts) return "—";
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return ts;
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

export function categoryColor(category: string): string {
  const colors: Record<string, string> = {
    emergency: "bg-critical/10 text-critical border-critical/30",
    urgent: "bg-warning/10 text-warning border-warning/30",
    same_day: "bg-blue-100 text-blue-700 border-blue-300",
    routine: "bg-success/10 text-success border-success/30",
    administrative: "bg-gray-100 text-gray-600 border-gray-300",
  };
  return colors[category] || "bg-gray-100 text-gray-600 border-gray-300";
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    pending_consensus: "Pending Consensus",
    consensus_complete: "Consensus Complete",
    manual_review: "Manual Review",
    challenged: "Challenged",
    finalized: "Finalized",
    archived: "Archived",
  };
  return labels[status] || status;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    submitted: "bg-blue-100 text-blue-700",
    pending_consensus: "bg-amber-100 text-amber-700",
    consensus_complete: "bg-success/10 text-success",
    manual_review: "bg-warning/10 text-warning",
    challenged: "bg-critical/10 text-critical",
    finalized: "bg-primary-100 text-primary-700",
    archived: "bg-gray-200 text-gray-500",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
}
