"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { useAuth } from "./use-auth";

interface TriageData {
  id: string;
  note_id: string;
  note_hash: string;
  category: string;
  priority_score: number;
  confidence: number;
  reasoning: string;
  routing_recommendation?: string;
  missing_info?: string[];
  critical_keywords_found?: string[];
  human_review_required?: boolean;
  consensus_percentage?: number;
  created_at: unknown;
  [key: string]: unknown;
}

export function useTriageResults(noteId?: string) {
  return useQuery({
    queryKey: ["triage", noteId],
    queryFn: async () => {
      if (!noteId) return [];
      const q = query(
        collection(db, "triage_results"),
        where("note_id", "==", noteId),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TriageData));
    },
    enabled: !!noteId,
  });
}

export function useAllTriageResults() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["triage-all"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "triage_results"));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TriageData));
    },
    enabled: !!user,
  });
}

export function useTriageResult(noteId?: string) {
  return useQuery({
    queryKey: ["triage-result", noteId],
    queryFn: async () => {
      if (!noteId) return null;
      const q = query(
        collection(db, "triage_results"),
        where("note_id", "==", noteId),
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as TriageData;
    },
    enabled: !!noteId,
  });
}

export function useValidatorDecisions(noteId?: string) {
  return useQuery({
    queryKey: ["validator-decisions", noteId],
    queryFn: async () => {
      if (!noteId) return [];
      const q = query(
        collection(db, "validator_decisions"),
        where("note_id", "==", noteId),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    enabled: !!noteId,
  });
}

export function useChallenges(noteId?: string) {
  return useQuery({
    queryKey: ["challenges", noteId],
    queryFn: async () => {
      const constraints: Parameters<typeof query>[1][] = [];
      if (noteId) {
        constraints.push(where("note_id", "==", noteId));
      }
      const q = query(collection(db, "challenges"), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
  });
}

export function useSaveTriageResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      note_id: string;
      note_hash: string;
      category: string;
      priority_score: number;
      confidence: number;
      reasoning: string;
      human_review_required: boolean;
    }) => {
      const id = `${data.note_id}_${Date.now()}`;
      await setDoc(doc(db, "triage_results", id), {
        ...data,
        created_at: Timestamp.now(),
      });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["triage"] });
      queryClient.invalidateQueries({ queryKey: ["triage-all"] });
    },
  });
}
