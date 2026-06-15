"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createSupabaseClient } from "@/services/supabase/client";
import { useWallet } from "./use-wallet";
import { useContractWrite } from "./use-contract";

type ChallengeStep =
  | "idle"
  | "submitting_chain"
  | "syncing"
  | "complete"
  | "error";

interface ChallengeState {
  step: ChallengeStep;
  message: string;
  txHash: string | null;
  error: string | null;
}

export function useChallengeDecision() {
  const [state, setState] = useState<ChallengeState>({
    step: "idle",
    message: "",
    txHash: null,
    error: null,
  });

  const { connected, address } = useWallet();
  const contractWrite = useContractWrite();
  const queryClient = useQueryClient();
  const supabase = createSupabaseClient();

  const challenge = useCallback(
    async (params: {
      noteId: string;
      noteHash: string;
      challengerId: string;
      reason: string;
      evidence: string;
      originalCategory: string;
    }) => {
      if (!connected || !address) {
        setState({
          step: "error",
          message: "Wallet not connected",
          txHash: null,
          error: "Please connect your wallet.",
        });
        return;
      }

      try {
        setState({
          step: "submitting_chain",
          message: "Submitting challenge to GenLayer...",
          txHash: null,
          error: null,
        });

        const { hash } = await contractWrite.mutateAsync({
          functionName: "challenge_decision",
          args: [params.noteHash, params.reason, params.evidence],
        });

        setState((s) => ({
          ...s,
          txHash: hash,
          step: "syncing",
          message: "Syncing challenge to database...",
        }));

        await supabase.from("challenges").insert({
          note_id: params.noteId,
          note_hash: params.noteHash,
          challenger_id: params.challengerId,
          challenger_address: address,
          reason: params.reason,
          evidence: params.evidence,
          status: "open",
          original_category: params.originalCategory,
          tx_hash: hash,
        });

        await supabase
          .from("clinical_notes")
          .update({ status: "challenged" })
          .eq("id", params.noteId);

        await supabase.from("audit_logs").insert({
          event_type: "decision_challenged",
          note_id: params.noteId,
          note_hash: params.noteHash,
          actor_id: params.challengerId,
          actor_address: address,
          details: { reason: params.reason, tx_hash: hash },
          tx_hash: hash,
        });

        setState({
          step: "complete",
          message: "Challenge submitted successfully!",
          txHash: hash,
          error: null,
        });

        queryClient.invalidateQueries({ queryKey: ["challenges"] });
        queryClient.invalidateQueries({ queryKey: ["notes"] });
        queryClient.invalidateQueries({ queryKey: ["note", params.noteId] });
      } catch (err: any) {
        setState((s) => ({
          ...s,
          step: "error",
          message: "Challenge failed",
          error: err.message || "An unexpected error occurred",
        }));
      }
    },
    [connected, address, contractWrite, supabase, queryClient],
  );

  const reset = useCallback(() => {
    setState({ step: "idle", message: "", txHash: null, error: null });
  }, []);

  return { ...state, challenge, reset };
}
