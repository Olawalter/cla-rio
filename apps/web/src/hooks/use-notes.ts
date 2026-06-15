"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseClient } from "@/services/supabase/client";
import type { NoteStatus, TriageCategory } from "@/types/clinical";

const supabase = createSupabaseClient();

export function useNotes(filters?: {
  status?: NoteStatus;
  priority?: TriageCategory;
}) {
  return useQuery({
    queryKey: ["notes", filters],
    queryFn: async () => {
      let query = supabase
        .from("clinical_notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.priority) {
        query = query.eq("priority", filters.priority);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: ["note", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_notes")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useNoteByHash(noteHash: string) {
  return useQuery({
    queryKey: ["note-hash", noteHash],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_notes")
        .select("*")
        .eq("note_hash", noteHash)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!noteHash,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: {
      note_hash: string;
      encrypted_content: string;
      title: string;
      submitted_by: string;
    }) => {
      const { data, error } = await supabase
        .from("clinical_notes")
        .insert({
          ...note,
          status: "draft",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useUpdateNoteStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      tx_hash,
      priority,
      de_identified_text,
    }: {
      id: string;
      status: NoteStatus;
      tx_hash?: string;
      priority?: TriageCategory;
      de_identified_text?: string;
    }) => {
      const update: Record<string, unknown> = { status };
      if (tx_hash) update.tx_hash = tx_hash;
      if (priority) update.priority = priority;
      if (de_identified_text) update.de_identified_text = de_identified_text;

      const { data, error } = await supabase
        .from("clinical_notes")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note", data.id] });
    },
  });
}
