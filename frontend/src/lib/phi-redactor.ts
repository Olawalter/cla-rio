const PHI_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN REDACTED]" },
  { pattern: /\b\d{9}\b/g, replacement: "[ID REDACTED]" },
  {
    pattern: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g,
    replacement: "[DOB REDACTED]",
  },
  {
    pattern: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    replacement: "[DOB REDACTED]",
  },
  {
    pattern: /\b(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g,
    replacement: "[PHONE REDACTED]",
  },
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: "[EMAIL REDACTED]",
  },
  {
    pattern: /\b(MRN|Medical Record Number|MR#|Chart#)[:\s]*[A-Z0-9-]+\b/gi,
    replacement: "[MRN REDACTED]",
  },
  {
    pattern: /\b(Insurance|Policy|Member)\s*(ID|Number|#)[:\s]*[A-Z0-9-]+\b/gi,
    replacement: "[INSURANCE ID REDACTED]",
  },
  {
    pattern: /\b(Patient Name|Name)[:\s]+[A-Z][a-z]+\s+[A-Z][a-z]+\b/gi,
    replacement: "[NAME REDACTED]",
  },
  {
    pattern: /\b\d{1,5}\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd|Lane|Ln|Court|Ct|Way|Place|Pl)\b/gi,
    replacement: "[ADDRESS REDACTED]",
  },
  {
    pattern: /\b(Hospital ID|Facility ID|HID)[:\s]*[A-Z0-9-]+\b/gi,
    replacement: "[HOSPITAL ID REDACTED]",
  },
];

export interface RedactionResult {
  sanitizedText: string;
  redactionsApplied: number;
  redactionTypes: string[];
}

export function redactPHI(text: string): RedactionResult {
  let sanitized = text;
  let count = 0;
  const types: string[] = [];

  for (const { pattern, replacement } of PHI_PATTERNS) {
    const matches = sanitized.match(pattern);
    if (matches && matches.length > 0) {
      count += matches.length;
      types.push(replacement.replace(/[\[\]]/g, "").trim());
      sanitized = sanitized.replace(pattern, replacement);
    }
  }

  return {
    sanitizedText: sanitized,
    redactionsApplied: count,
    redactionTypes: types,
  };
}
