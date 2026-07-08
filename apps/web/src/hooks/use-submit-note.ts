"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "./use-wallet";
import { hashNote } from "@/lib/utils";
import { createGenlayerClient, getContractAddress } from "@/services/genlayer/client";

type SubmitStep =
  | "idle"
  | "hashing"
  | "submitting"
  | "awaiting_consensus"
  | "reading"
  | "complete"
  | "error";

interface SubmitState {
  step: SubmitStep;
  message: string;
  noteHash: string | null;
  txHash: string | null;
  error: string | null;
}

export function useSubmitNote() {
  const [state, setState] = useState<SubmitState>({
    step: "idle",
    message: "",
    noteHash: null,
    txHash: null,
    error: null,
  });

  const { account } = useWallet();
  const queryClient = useQueryClient();

  const submit = useCallback(
    async (title: string, content: string) => {
      try {
        if (!account) throw new Error("Wallet not ready");

        setState({ step: "hashing", message: "Computing note hash...", noteHash: null, txHash: null, error: null });
        const noteHash = await hashNote(content);

        setState((s) => ({ ...s, noteHash, step: "submitting", message: "Submitting to GenLayer intelligent contract..." }));

        const client = createGenlayerClient(account);
        const contractAddr = getContractAddress() as `0x${string}`;

        const noteContent = title ? `[${title}]\n\n${content}` : content;

        const hash = await client.writeContract({
          address: contractAddr,
          functionName: "submit_note",
          args: [noteHash, noteContent],
          value: BigInt(0),
        });

        setState((s) => ({ ...s, txHash: hash, step: "awaiting_consensus", message: "Awaiting GenLayer validator consensus..." }));

        await client.waitForTransactionReceipt({
          hash,
          retries: 60,
          interval: 3000,
        });

        setState((s) => ({ ...s, step: "reading", message: "Reading on-chain assessment..." }));

        await client.readContract({
          address: contractAddr,
          functionName: "get_assessment",
          args: [noteHash],
        });

        setState({
          step: "complete",
          message: "Note submitted and assessed on-chain via GenLayer!",
          noteHash,
          txHash: hash,
          error: null,
        });

        queryClient.invalidateQueries({ queryKey: ["contract"] });

        return noteHash;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setState((s) => ({ ...s, step: "error", message: "Submission failed", error: message }));
        return null;
      }
    },
    [account, queryClient],
  );

  const reset = useCallback(() => {
    setState({ step: "idle", message: "", noteHash: null, txHash: null, error: null });
  }, []);

  return { ...state, submit, reset };
}
