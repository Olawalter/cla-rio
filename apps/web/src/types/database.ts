import type {
  TriageCategory,
  NoteStatus,
  UserRole,
  ChallengeStatus,
} from "./clinical";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      clinical_notes: {
        Row: ClinicalNoteRow;
        Insert: ClinicalNoteInsert;
        Update: ClinicalNoteUpdate;
      };
      attachments: {
        Row: AttachmentRow;
        Insert: AttachmentInsert;
        Update: AttachmentUpdate;
      };
      triage_results: {
        Row: TriageResultRow;
        Insert: TriageResultInsert;
        Update: TriageResultUpdate;
      };
      validator_decisions: {
        Row: ValidatorDecisionRow;
        Insert: ValidatorDecisionInsert;
        Update: ValidatorDecisionUpdate;
      };
      challenges: {
        Row: ChallengeRow;
        Insert: ChallengeInsert;
        Update: ChallengeUpdate;
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: AuditLogInsert;
        Update: never;
      };
      notifications: {
        Row: NotificationRow;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
      };
    };
  };
}

export interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  wallet_address: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type UserInsert = Omit<UserRow, "id" | "created_at" | "updated_at">;
export type UserUpdate = Partial<UserInsert>;

export interface ClinicalNoteRow {
  id: string;
  note_hash: string;
  encrypted_content: string;
  de_identified_text: string | null;
  title: string;
  status: NoteStatus;
  priority: TriageCategory | null;
  submitted_by: string;
  assigned_to: string | null;
  tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

export type ClinicalNoteInsert = Omit<
  ClinicalNoteRow,
  "id" | "created_at" | "updated_at"
>;
export type ClinicalNoteUpdate = Partial<ClinicalNoteInsert>;

export interface AttachmentRow {
  id: string;
  note_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

export type AttachmentInsert = Omit<AttachmentRow, "id" | "created_at">;
export type AttachmentUpdate = Partial<Pick<AttachmentRow, "file_name">>;

export interface TriageResultRow {
  id: string;
  note_id: string;
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
  consensus_strength: string | null;
  consensus_percentage: number | null;
  protocol_version: string;
  tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

export type TriageResultInsert = Omit<
  TriageResultRow,
  "id" | "created_at" | "updated_at"
>;
export type TriageResultUpdate = Partial<TriageResultInsert>;

export interface ValidatorDecisionRow {
  id: string;
  note_id: string;
  note_hash: string;
  validator_address: string;
  category: TriageCategory;
  priority_score: number;
  confidence: number;
  human_review_required: boolean;
  tx_hash: string | null;
  created_at: string;
}

export type ValidatorDecisionInsert = Omit<
  ValidatorDecisionRow,
  "id" | "created_at"
>;
export type ValidatorDecisionUpdate = never;

export interface ChallengeRow {
  id: string;
  note_id: string;
  note_hash: string;
  challenger_id: string;
  challenger_address: string;
  reason: string;
  evidence: string | null;
  status: ChallengeStatus;
  original_category: TriageCategory;
  proposed_category: TriageCategory | null;
  resolution: string | null;
  tx_hash: string | null;
  created_at: string;
  resolved_at: string | null;
}

export type ChallengeInsert = Omit<
  ChallengeRow,
  "id" | "created_at" | "resolved_at"
>;
export type ChallengeUpdate = Partial<
  Pick<ChallengeRow, "status" | "resolution" | "resolved_at" | "tx_hash">
>;

export interface AuditLogRow {
  id: string;
  event_type: string;
  note_id: string | null;
  note_hash: string | null;
  actor_id: string;
  actor_address: string | null;
  details: Record<string, unknown>;
  tx_hash: string | null;
  created_at: string;
}

export type AuditLogInsert = Omit<AuditLogRow, "id" | "created_at">;

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type NotificationInsert = Omit<NotificationRow, "id" | "created_at">;
export type NotificationUpdate = Partial<Pick<NotificationRow, "read">>;
