"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { useAuth } from "./use-auth";

interface NoteData {
  id: string;
  note_hash: string;
  encrypted_content?: string;
  de_identified_text?: string;
  content?: string;
  title?: string;
  status: string;
  submitted_by: string;
  submitter_email?: string;
  tx_hash?: string;
  created_at: unknown;
  updated_at: unknown;
  [key: string]: unknown;
}

export function useNotes(filters?: { status?: string; priority?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notes", filters],
    queryFn: async () => {
      const constraints: Parameters<typeof query>[1][] = [];
      if (filters?.status) {
        constraints.push(where("status", "==", filters.status));
      }
      const q = query(collection(db, "clinical_notes"), ...constraints);
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NoteData));
      docs.sort((a, b) => {
        const aTime = a.created_at && typeof a.created_at === "object" && "seconds" in a.created_at
          ? (a.created_at as { seconds: number }).seconds : 0;
        const bTime = b.created_at && typeof b.created_at === "object" && "seconds" in b.created_at
          ? (b.created_at as { seconds: number }).seconds : 0;
        return bTime - aTime;
      });
      return docs;
    },
    enabled: !!user,
  });
}

export function useNote(noteId: string) {
  return useQuery({
    queryKey: ["note", noteId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, "clinical_notes", noteId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as NoteData;
    },
    enabled: !!noteId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      de_identified_text: string;
      note_hash: string;
    }) => {
      const docRef = await addDoc(collection(db, "clinical_notes"), {
        ...data,
        status: "submitted",
        submitted_by: user?.uid || "",
        submitter_email: user?.email || "",
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useUpdateNoteStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, status }: { noteId: string; status: string }) => {
      await updateDoc(doc(db, "clinical_notes", noteId), {
        status,
        updated_at: Timestamp.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
