"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { triageNote } from "@/lib/local-triage";

export function useProcessPendingNotes() {
  const queryClient = useQueryClient();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    (async () => {
      const pendingQuery = query(
        collection(db, "clinical_notes"),
        where("status", "in", ["pending_triage", "submitted"]),
      );
      const snap = await getDocs(pendingQuery);
      if (snap.empty) return;

      for (const noteDoc of snap.docs) {
        const data = noteDoc.data();
        const title = data.title || "";
        const content = data.encrypted_content || data.content || data.de_identified_text || "";
        if (!content) continue;

        const existingTriage = await getDocs(
          query(collection(db, "triage_results"), where("note_id", "==", noteDoc.id)),
        );
        if (!existingTriage.empty) continue;

        const triage = triageNote(title, content);

        const triageId = `${noteDoc.id}_${Date.now()}`;
        await setDoc(doc(db, "triage_results", triageId), {
          note_id: noteDoc.id,
          note_hash: data.note_hash || "",
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

        await updateDoc(doc(db, "clinical_notes", noteDoc.id), {
          status: triage.human_review_required ? "human_review" : "consensus_reached",
          priority: triage.category,
          updated_at: Timestamp.now(),
        });
      }

      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["triage"] });
      queryClient.invalidateQueries({ queryKey: ["triage-all"] });
    })();
  }, [queryClient]);
}
