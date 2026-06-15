export type TriageCategory =
  | "emergency"
  | "urgent"
  | "same_day"
  | "routine"
  | "administrative";

export type NoteStatus =
  | "draft"
  | "submitted"
  | "processing"
  | "awaiting_consensus"
  | "consensus_reached"
  | "human_review"
  | "finalized"
  | "challenged"
  | "resolved";

export type ConsensusStrength = "strong" | "moderate" | "weak";

export type UserRole = "submitter" | "reviewer" | "validator" | "admin";

export type ChallengeStatus = "open" | "under_review" | "resolved" | "rejected";

export interface NoteAssessment {
  note_hash: string;
  category: TriageCategory;
  priority_score: number;
  confidence: number;
  reasoning: string;
  missing_info: string[];
  routing_recommendation: string;
  human_review_required: boolean;
  human_review_reasons: string[];
  critical_keywords_found: string[];
  protocol_version: string;
  timestamp: string;
}

export interface ValidatorVote {
  validator_address: string;
  category: TriageCategory;
  priority_score: number;
  confidence: number;
  human_review_required: boolean;
  timestamp: string;
}

export interface ConsensusResult {
  note_hash: string;
  final_category: TriageCategory;
  final_priority: number;
  consensus_strength: ConsensusStrength;
  consensus_percentage: number;
  validator_votes: ValidatorVote[];
  human_review_required: boolean;
  finalized_at: string;
}

export interface Challenge {
  challenge_id: string;
  note_hash: string;
  challenger_address: string;
  reason: string;
  evidence: string;
  status: ChallengeStatus;
  original_category: TriageCategory;
  proposed_category: TriageCategory | null;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AuditEntry {
  event_type: string;
  note_hash: string;
  actor_address: string;
  details: string;
  timestamp: string;
}

export const CRITICAL_KEYWORDS = [
  "chest pain",
  "severe bleeding",
  "stroke symptoms",
  "suicidal thoughts",
  "breathing difficulties",
  "loss of consciousness",
] as const;

export const TRIAGE_CATEGORY_CONFIG: Record<
  TriageCategory,
  { label: string; color: string; bgColor: string; response: string }
> = {
  emergency: {
    label: "Emergency",
    color: "#DC2626",
    bgColor: "#FEF2F2",
    response: "Immediate review",
  },
  urgent: {
    label: "Urgent",
    color: "#D97706",
    bgColor: "#FFFBEB",
    response: "Within hours",
  },
  same_day: {
    label: "Same-Day",
    color: "#2563EB",
    bgColor: "#EFF6FF",
    response: "Same business day",
  },
  routine: {
    label: "Routine",
    color: "#16A34A",
    bgColor: "#F0FDF4",
    response: "Within several days",
  },
  administrative: {
    label: "Administrative",
    color: "#64748B",
    bgColor: "#F8FAFC",
    response: "Standard processing",
  },
};

export const CONSENSUS_THRESHOLDS = {
  strong: 80,
  moderate: 60,
  weak: 0,
} as const;

export const HUMAN_REVIEW_CONFIDENCE_THRESHOLD = 90;
export const VALIDATOR_COUNT = 5;
export const PRIORITY_TOLERANCE = 10;
