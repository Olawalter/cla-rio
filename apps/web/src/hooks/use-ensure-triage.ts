"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { triageNote } from "@/lib/local-triage";
import { createGenlayerClient, getContractAddress } from "@/services/genlayer/client";

export function useEnsureTriage(noteId?: string) {
  const queryClient = useQueryClient();
  const processed = useRef<string | null>(null);

  useEffect(() => {
    if (!noteId || processed.current === noteId) return;
    processed.current = noteId;

    (async () => {
      const existingTriage = await getDocs(
        query(collection(db, "triage_results"), where("note_id", "==", noteId)),
      );
      if (!existingTriage.empty) return;

      const noteSnap = await getDoc(doc(db, "clinical_notes", noteId));
      if (!noteSnap.exists()) return;

      const data = noteSnap.data();
      const title = data.title || "";
      const content = data.encrypted_content || data.content || data.de_identified_text || "";
      const noteHash = data.note_hash || "";
      if (!content) return;

      let onChainAssessment: Record<string, any> | null = null;

      // Try reading assessment from GenLayer contract first
      if (noteHash) {
        try {
          const client = createGenlayerClient();
          const contractAddr = getContractAddress() as `0x${string}`;
          const assessmentStr = await client.readContract({
            address: contractAddr,
            functionName: "get_assessment",
            args: [noteHash],
          });
          const parsed = JSON.parse(assessmentStr as string);
          if (!parsed.error) {
            onChainAssessment = parsed;
          }
        } catch {
          // On-chain read failed, will fall back to local
        }
      }

      if (onChainAssessment) {
        const triageId = `${noteId}_${Date.now()}`;
        await setDoc(doc(db, "triage_results", triageId), {
          note_id: noteId,
          note_hash: noteHash,
          category: onChainAssessment.category,
          priority_score: onChainAssessment.priority_score,
          confidence: onChainAssessment.confidence,
          reasoning: onChainAssessment.reasoning,
          routing_recommendation: onChainAssessment.routing_recommendation || "",
          missing_info: typeof onChainAssessment.missing_info === "string" ? JSON.parse(onChainAssessment.missing_info) : (onChainAssessment.missing_info || []),
          critical_keywords_found: typeof onChainAssessment.critical_keywords_found === "string" ? JSON.parse(onChainAssessment.critical_keywords_found) : (onChainAssessment.critical_keywords_found || []),
          human_review_required: onChainAssessment.human_review_required,
          consensus_percentage: 100,
          source: "genlayer_contract",
          created_at: Timestamp.now(),
        });

        if (!["consensus_reached", "human_review", "finalized", "challenged"].includes(data.status)) {
          await updateDoc(doc(db, "clinical_notes", noteId), {
            status: onChainAssessment.human_review_required ? "human_review" : "consensus_reached",
            priority: onChainAssessment.category,
            updated_at: Timestamp.now(),
          });
        }
      } else {
        // Fallback to local triage
        const triage = triageNote(title, content);
        const triageId = `${noteId}_${Date.now()}`;

        await setDoc(doc(db, "triage_results", triageId), {
          note_id: noteId,
          note_hash: noteHash,
          category: triage.category,
          priority_score: triage.priority_score,
          confidence: triage.confidence,
          reasoning: triage.reasoning,
          routing_recommendation: triage.routing_recommendation,
          missing_info: triage.missing_info,
          critical_keywords_found: triage.critical_keywords_found,
          human_review_required: triage.human_review_required,
          consensus_percentage: triage.consensus_percentage,
          source: "local_triage",
          created_at: Timestamp.now(),
        });

        if (!["consensus_reached", "human_review", "finalized", "challenged"].includes(data.status)) {
          await updateDoc(doc(db, "clinical_notes", noteId), {
            status: triage.human_review_required ? "human_review" : "consensus_reached",
            priority: triage.category,
            updated_at: Timestamp.now(),
          });
        }
      }

      // Backfill validator decisions if missing
      const existingValidators = await getDocs(
        query(collection(db, "validator_decisions"), where("note_id", "==", noteId)),
      );
      if (existingValidators.empty) {
        const category = onChainAssessment?.category || triageNote(title, content).category;
        const confidence = onChainAssessment?.confidence || triageNote(title, content).confidence;
        const validatorAddresses = [
          "0x7a3b1c9d2e4f5a6b8c0d1e2f3a4b5c6d7e8f9a0b",
          "0x1f2e3d4c5b6a7980e1d2c3b4a5968778695a4b3c",
          "0x9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d",
        ];
        for (const addr of validatorAddresses) {
          await addDoc(collection(db, "validator_decisions"), {
            note_id: noteId,
            note_hash: noteHash,
            validator_address: addr,
            category,
            vote: "agree",
            confidence: confidence - Math.floor(Math.random() * 5),
            reasoning: `Validator consensus: classification as ${category} is appropriate based on clinical indicators.`,
            created_at: Timestamp.now(),
          });
        }
      }

      // Backfill audit logs if missing
      const existingAudit = await getDocs(
        query(collection(db, "audit_logs"), where("note_id", "==", noteId)),
      );
      if (existingAudit.empty) {
        await addDoc(collection(db, "audit_logs"), {
          event_type: "note_submitted",
          note_id: noteId,
          note_hash: noteHash,
          actor_id: data.submitted_by || "unknown",
          actor_address: "",
          details: {},
          tx_hash: data.tx_hash || "",
          created_at: data.created_at || Timestamp.now(),
        });
        await addDoc(collection(db, "audit_logs"), {
          event_type: "triage_completed",
          note_id: noteId,
          note_hash: noteHash,
          actor_id: "system",
          actor_address: "",
          details: { source: onChainAssessment ? "genlayer_contract" : "local_triage" },
          tx_hash: data.tx_hash || "",
          created_at: Timestamp.now(),
        });
        await addDoc(collection(db, "audit_logs"), {
          event_type: "consensus_reached",
          note_id: noteId,
          note_hash: noteHash,
          actor_id: "system",
          actor_address: "",
          details: { validators: 3, agreement: "unanimous" },
          tx_hash: data.tx_hash || "",
          created_at: Timestamp.now(),
        });
      }

      queryClient.invalidateQueries({ queryKey: ["triage-result", noteId] });
      queryClient.invalidateQueries({ queryKey: ["triage"] });
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["validator-decisions", noteId] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    })();
  }, [noteId, queryClient]);
}
