"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseClient } from "@/services/supabase/client";

const supabase = createSupabaseClient();

export function useAuditLogs(filters?: {
  noteId?: string;
  eventType?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filters?.limit ?? 50);

      if (filters?.noteId) {
        query = query.eq("note_id", filters.noteId);
      }
      if (filters?.eventType) {
        query = query.eq("event_type", filters.eventType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAuditLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: {
      event_type: string;
      note_id?: string;
      note_hash?: string;
      actor_id: string;
      actor_address?: string;
      details: Record<string, unknown>;
      tx_hash?: string;
    }) => {
      const { data, error } = await supabase
        .from("audit_logs")
        .insert(log)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}
