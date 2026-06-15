import { describe, it, expect } from "vitest";
import {
  CRITICAL_KEYWORDS,
  TRIAGE_CATEGORY_CONFIG,
  CONSENSUS_THRESHOLDS,
} from "@/types/clinical";

describe("Clinical constants", () => {
  it("has all required critical keywords", () => {
    expect(CRITICAL_KEYWORDS).toContain("chest pain");
    expect(CRITICAL_KEYWORDS).toContain("suicidal thoughts");
    expect(CRITICAL_KEYWORDS).toContain("breathing difficulties");
    expect(CRITICAL_KEYWORDS.length).toBeGreaterThanOrEqual(6);
  });

  it("has all five triage categories", () => {
    const keys = Object.keys(TRIAGE_CATEGORY_CONFIG);
    expect(keys).toContain("emergency");
    expect(keys).toContain("urgent");
    expect(keys).toContain("same_day");
    expect(keys).toContain("routine");
    expect(keys).toContain("administrative");
  });

  it("triage categories have required fields", () => {
    for (const [, config] of Object.entries(TRIAGE_CATEGORY_CONFIG)) {
      expect(config).toHaveProperty("label");
      expect(config).toHaveProperty("color");
      expect(config).toHaveProperty("bgColor");
      expect(config).toHaveProperty("response");
    }
  });

  it("consensus thresholds are valid", () => {
    expect(CONSENSUS_THRESHOLDS.strong).toBeGreaterThanOrEqual(80);
    expect(CONSENSUS_THRESHOLDS.moderate).toBeGreaterThanOrEqual(60);
    expect(CONSENSUS_THRESHOLDS.moderate).toBeLessThan(CONSENSUS_THRESHOLDS.strong);
  });
});
