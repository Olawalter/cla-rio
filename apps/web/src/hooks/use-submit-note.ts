"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createSupabaseClient } from "@/services/supabase/client";
import { useWallet } from "./use-wallet";
import { useContractWrite } from "./use-contract";
import { hashNote } from "@/lib/utils";

type SubmitStep =
  | "idle"
  | "hashing"
  | "storing"
  | "submitting"
  | "awaiting_consensus"
  | "syncing"
  | "complete"
  | "error";

interface SubmitState {
  step: SubmitStep;
  message: string;
  noteId: string | null;
  txHash: string | null;
  error: string | null;
}

export function useSubmitNote() {
  const [state, setState] = useState<SubmitState>({
    step: "idle",
    message: "",
    noteId: null,
    txHash: null,
    error: null,
  });

  const { connected, address } = useWallet();
  const contractWrite = useContractWrite();
  const queryClient = useQueryClient();
  const supabase = createSupabaseClient();

  const submit = useCallback(
    async (title: string, content: string, userId: string) => {
      if (!connected || !address) {
        setState({
          step: "error",
          message: "Wallet not connected",
          noteId: null,
          txHash: null,
          error: "Please connect your wallet before submitting.",
        });
        return;
      }

      try {
        // Step 1: Hash
        setState({
          step: "hashing",
          message: "Computing note hash...",
          noteId: null,
          txHash: null,
          error: null,
        });
        const noteHash = await hashNote(content);

        // Step 2: Store in Supabase
        setState((s) => ({
          ...s,
          step: "storing",
          message: "Storing encrypted note...",
        }));
        const { data: note, error: insertError } = await supabase
          .from("clinical_notes")
          .insert({
            note_hash: noteHash,
            encrypted_content: content,
            title,
            status: "submitted",
            submitted_by: userId,
          })
          .select()
          .single();

        if (insertError) throw new Error(insertError.message);

        setState((s) => ({
          ...s,
          noteId: note.id,
          step: "submitting",
          message: "Submitting to GenLayer contract...",
        }));

        // Step 3: Submit to contract
        const { hash, receipt } = await contractWrite.mutateAsync({
          functionName: "submit_note",
          args: [noteHash, content],
        });

        setState((s) => ({
          ...s,
          txHash: hash,
          step: "awaiting_consensus",
          message: "Awaiting validator consensus...",
        }));

        // Step 4: Sync result back to Supabase
        setState((s) => ({
          ...s,
          step: "syncing",
          message: "Syncing assessment to database...",
        }));

        await supabase
          .from("clinical_notes")
          .update({
            status: "consensus_reached",
            tx_hash: hash,
          })
          .eq("id", note.id);

        // Step 5: Log audit event
        await supabase.from("audit_logs").insert({
          event_type: "note_submitted",
          note_id: note.id,
          note_hash: noteHash,
          actor_id: userId,
          actor_address: address,
          details: { tx_hash: hash },
          tx_hash: hash,
        });

        setState({
          step: "complete",
          message: "Note submitted and assessed successfully!",
          noteId: note.id,
          txHash: hash,
          error: null,
        });

        queryClient.invalidateQueries({ queryKey: ["notes"] });
      } catch (err: any) {
        setState((s) => ({
          ...s,
          step: "error",
          message: "Submission failed",
          error: err.message || "An unexpected error occurred",
        }));
      }
    },
    [connected, address, contractWrite, supabase, queryClient],
  );

  const reset = useCallback(() => {
    setState({
      step: "idle",
      message: "",
      noteId: null,
      txHash: null,
      error: null,
    });
  }, []);

  return { ...state, submit, reset };
}
