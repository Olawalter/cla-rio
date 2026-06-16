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
  orderBy,
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
      const constraints: Parameters<typeof query>[1][] = [orderBy("created_at", "desc")];
      if (filters?.status) {
        constraints.unshift(where("status", "==", filters.status));
      }
      const q = query(collection(db, "clinical_notes"), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NoteData));
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
