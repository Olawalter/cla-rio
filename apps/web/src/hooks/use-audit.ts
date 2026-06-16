"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { useAuth } from "./use-auth";

export function useAuditLog(noteHash?: string) {
  return useQuery({
    queryKey: ["audit", noteHash],
    queryFn: async () => {
      const constraints: Parameters<typeof query>[1][] = [
        orderBy("created_at", "desc"),
        firestoreLimit(100),
      ];
      if (noteHash) {
        constraints.unshift(where("note_hash", "==", noteHash));
      }
      const q = query(collection(db, "audit_logs"), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
  });
}

export function useAuditLogs(params?: { noteId?: string; noteHash?: string; limit?: number }) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: async () => {
      const constraints: Parameters<typeof query>[1][] = [
        orderBy("created_at", "desc"),
        firestoreLimit(params?.limit || 100),
      ];
      if (params?.noteId) {
        constraints.unshift(where("note_id", "==", params.noteId));
      }
      if (params?.noteHash) {
        constraints.unshift(where("note_hash", "==", params.noteHash));
      }
      const q = query(collection(db, "audit_logs"), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
  });
}

export function useCreateAuditEntry() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      event_type: string;
      note_hash: string;
      details: Record<string, unknown>;
    }) => {
      await addDoc(collection(db, "audit_logs"), {
        ...data,
        actor: user?.uid || "system",
        actor_email: user?.email || "system",
        created_at: Timestamp.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}
