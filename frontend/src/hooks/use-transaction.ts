import { useState, useCallback } from "react";
import { useContractWrite, type TxStep } from "./use-contract";

export function useTransaction() {
  const [step, setStep] = useState<TxStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const contractWrite = useContractWrite();

  const execute = useCallback(
    async (functionName: string, args: unknown[]) => {
      setStep("waiting_wallet");
      setError(null);
      setTxHash(null);

      try {
        setStep("submitted");
        const result = await contractWrite.mutateAsync({
          functionName,
          args,
        });

        setTxHash(result.hash);
        setStep("pending_consensus");

        setStep("finalized");
        return result;
      } catch (err: any) {
        setStep("failed");
        const msg =
          err?.shortMessage || err?.message || "Transaction failed";
        setError(msg);
        throw err;
      }
    },
    [contractWrite]
  );

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setTxHash(null);
  }, []);

  return { step, error, txHash, execute, reset, isLoading: step !== "idle" && step !== "finalized" && step !== "failed" };
}

export const TX_STEP_LABELS: Record<TxStep, string> = {
  idle: "",
  waiting_wallet: "Waiting for wallet signature...",
  submitted: "Transaction submitted to GenLayer...",
  pending_consensus: "Awaiting validator consensus (1-3 min)...",
  finalized: "Transaction finalized!",
  failed: "Transaction failed",
};
