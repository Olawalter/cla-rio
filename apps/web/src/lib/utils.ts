import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function hashNote(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTimestamp(timestamp: unknown): string {
  if (!timestamp) return "";
  let date: Date;
  if (typeof timestamp === "string") {
    date = new Date(timestamp);
  } else if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
    date = (timestamp as { toDate: () => Date }).toDate();
  } else if (timestamp && typeof timestamp === "object" && "seconds" in timestamp) {
    date = new Date((timestamp as { seconds: number }).seconds * 1000);
  } else {
    date = new Date(String(timestamp));
  }
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getConsensusStrength(percentage: number): "strong" | "moderate" | "weak" {
  if (percentage >= 80) return "strong";
  if (percentage >= 60) return "moderate";
  return "weak";
}
