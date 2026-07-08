"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "./use-wallet";
import { useContractWrite } from "./use-contract";

type ChallengeStep = "idle" | "submitting" | "awaiting_consensus" | "complete" | "error";

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

  const { connected } = useWallet();
  const contractWrite = useContractWrite();
  const queryClient = useQueryClient();

  const challenge = useCallback(
    async (params: {
      noteHash: string;
      reason: string;
      evidence: string;
    }) => {
      try {
        if (!connected) throw new Error("Wallet not ready");

        setState({ step: "submitting", message: "Submitting challenge to GenLayer...", txHash: null, error: null });

        const result = await contractWrite.mutateAsync({
          functionName: "challenge_decision",
          args: [params.noteHash, params.reason, params.evidence],
        });

        setState({
          step: "complete",
          message: "Challenge submitted on-chain!",
          txHash: result.hash,
          error: null,
        });

        queryClient.invalidateQueries({ queryKey: ["contract"] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setState({ step: "error", message: "Challenge failed", txHash: null, error: message });
      }
    },
    [connected, contractWrite, queryClient],
  );

  const reset = useCallback(() => {
    setState({ step: "idle", message: "", txHash: null, error: null });
  }, []);

  return { ...state, challenge, reset };
}
