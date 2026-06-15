import { describe, it, expect } from "vitest";
import {
  cn,
  hashNote,
  truncateAddress,
  formatTimestamp,
  getConsensusStrength,
} from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts", () => {
    const result = cn("px-4", "px-2");
    expect(result).toBe("px-2");
  });
});

describe("hashNote", () => {
  it("returns a hex string", async () => {
    const hash = await hashNote("test content");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces consistent hashes", async () => {
    const h1 = await hashNote("same input");
    const h2 = await hashNote("same input");
    expect(h1).toBe(h2);
  });

  it("produces different hashes for different input", async () => {
    const h1 = await hashNote("input A");
    const h2 = await hashNote("input B");
    expect(h1).not.toBe(h2);
  });
});

describe("truncateAddress", () => {
  it("truncates a full address", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    expect(truncateAddress(addr)).toBe("0x1234...5678");
  });

  it("handles short strings gracefully", () => {
    expect(truncateAddress("0x12")).toBe("0x12");
  });
});

describe("formatTimestamp", () => {
  it("formats an ISO date string", () => {
    const result = formatTimestamp("2025-01-15T10:30:00Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles invalid dates", () => {
    const result = formatTimestamp("invalid");
    expect(result).toBe("Invalid Date");
  });
});

describe("getConsensusStrength", () => {
  it("returns strong for >= 80", () => {
    expect(getConsensusStrength(80)).toBe("strong");
    expect(getConsensusStrength(95)).toBe("strong");
  });

  it("returns moderate for 60-79", () => {
    expect(getConsensusStrength(60)).toBe("moderate");
    expect(getConsensusStrength(79)).toBe("moderate");
  });

  it("returns weak for < 60", () => {
    expect(getConsensusStrength(59)).toBe("weak");
    expect(getConsensusStrength(0)).toBe("weak");
  });
});
