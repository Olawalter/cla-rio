"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { collection, addDoc, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase/config";
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

  const challenge = useCallback(
    async (params: {
      noteId: string;
      noteHash: string;
      challengerId: string;
      reason: string;
      evidence: string;
      originalCategory: string;
    }) => {
      try {
        let txHash: string | null = null;

        if (connected && address) {
          try {
            setState({
              step: "submitting_chain",
              message: "Submitting challenge to GenLayer...",
              txHash: null,
              error: null,
            });

            const result = await contractWrite.mutateAsync({
              functionName: "challenge_decision",
              args: [params.noteHash, params.reason, params.evidence],
            });
            txHash = result.hash;
          } catch {
            // On-chain failed, proceed with Firestore only
          }
        }

        setState((s) => ({
          ...s,
          txHash,
          step: "syncing",
          message: "Recording challenge...",
          error: null,
        }));

        await addDoc(collection(db, "challenges"), {
          note_id: params.noteId,
          note_hash: params.noteHash,
          challenger_id: params.challengerId,
          challenger_address: address || "",
          reason: params.reason,
          evidence: params.evidence,
          status: "open",
          original_category: params.originalCategory,
          tx_hash: txHash || "",
          created_at: Timestamp.now(),
        });

        await updateDoc(doc(db, "clinical_notes", params.noteId), {
          status: "challenged",
          updated_at: Timestamp.now(),
        });

        await addDoc(collection(db, "audit_logs"), {
          event_type: "decision_challenged",
          note_id: params.noteId,
          note_hash: params.noteHash,
          actor_id: params.challengerId,
          actor_address: address || "",
          details: { reason: params.reason, tx_hash: txHash },
          tx_hash: txHash || "",
          created_at: Timestamp.now(),
        });

        setState({
          step: "complete",
          message: "Challenge submitted successfully!",
          txHash,
          error: null,
        });

        queryClient.invalidateQueries({ queryKey: ["challenges"] });
        queryClient.invalidateQueries({ queryKey: ["notes"] });
        queryClient.invalidateQueries({ queryKey: ["note", params.noteId] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setState((s) => ({
          ...s,
          step: "error",
          message: "Challenge failed",
          error: message,
        }));
      }
    },
    [connected, address, contractWrite, queryClient],
  );

  const reset = useCallback(() => {
    setState({ step: "idle", message: "", txHash: null, error: null });
  }, []);

  return { ...state, challenge, reset };
}
