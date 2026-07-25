import { useState, useCallback } from "react";
import { useContractWrite, type TxStep } from "./use-contract";

export function useTransaction() {
  const [step, setStep] = useState<TxStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { sendTx } = useContractWrite();

  const execute = useCallback(
    async (functionName: string, args: unknown[]) => {
      setStep("waiting_wallet");
      setError(null);
      setTxHash(null);

      try {
        setStep("submitted");

        const result = await sendTx(functionName, args, (hash) => {
          // Fires as soon as wallet signs and hash is returned —
          // before waitForTransactionReceipt, so consensus is actually pending here
          setTxHash(hash);
          setStep("pending_consensus");
        });

        setStep("finalized");
        return result;
      } catch (err: any) {
        setStep("failed");
        const msg = err?.shortMessage || err?.message || "Transaction failed";
        setError(msg);
        throw err;
      }
    },
    [sendTx]
  );

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setTxHash(null);
  }, []);

  return {
    step,
    error,
    txHash,
    execute,
    reset,
    isLoading: step !== "idle" && step !== "finalized" && step !== "failed",
  };
}

export const TX_STEP_LABELS: Record<TxStep, string> = {
  idle: "",
  waiting_wallet: "Waiting for wallet signature...",
  submitted: "Submitting transaction to GenLayer...",
  pending_consensus: "Validators reaching consensus (1–3 min)...",
  finalized: "Consensus reached — transaction finalized!",
  failed: "Transaction failed",
};
