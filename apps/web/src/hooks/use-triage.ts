"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseClient } from "@/services/supabase/client";

const supabase = createSupabaseClient();

export function useTriageResult(noteId: string) {
  return useQuery({
    queryKey: ["triage", noteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("triage_results")
        .select("*")
        .eq("note_id", noteId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!noteId,
  });
}

export function useCreateTriageResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (result: {
      note_id: string;
      note_hash: string;
      category: string;
      priority_score: number;
      confidence: number;
      reasoning: string;
      missing_info: string[];
      routing_recommendation: string;
      human_review_required: boolean;
      human_review_reasons: string[];
      critical_keywords_found: string[];
      consensus_strength?: string;
      consensus_percentage?: number;
      protocol_version: string;
      tx_hash?: string;
    }) => {
      const { data, error } = await supabase
        .from("triage_results")
        .insert(result)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["triage", data.note_id] });
    },
  });
}

export function useValidatorDecisions(noteId: string) {
  return useQuery({
    queryKey: ["validator-decisions", noteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("validator_decisions")
        .select("*")
        .eq("note_id", noteId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!noteId,
  });
}

export function useChallenges(noteId?: string) {
  return useQuery({
    queryKey: ["challenges", noteId],
    queryFn: async () => {
      let query = supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false });

      if (noteId) {
        query = query.eq("note_id", noteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challenge: {
      note_id: string;
      note_hash: string;
      challenger_id: string;
      challenger_address: string;
      reason: string;
      evidence?: string;
      original_category: string;
      tx_hash?: string;
    }) => {
      const { data, error } = await supabase
        .from("challenges")
        .insert({ ...challenge, status: "open" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}
