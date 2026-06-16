"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { collection, addDoc, updateDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { useWallet } from "./use-wallet";
import { hashNote } from "@/lib/utils";
import { createGenlayerClient, getContractAddress } from "@/services/genlayer/client";

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

  const { address, account } = useWallet();
  const queryClient = useQueryClient();

  const submit = useCallback(
    async (title: string, content: string, userId: string) => {
      try {
        // --- Step 1: Hash ---
        setState({ step: "hashing", message: "Computing note hash...", noteId: null, txHash: null, error: null });
        const noteHash = await hashNote(content);

        // --- Step 2: Store in Firebase ---
        setState((s) => ({ ...s, step: "storing", message: "Storing encrypted note..." }));
        const noteRef = await addDoc(collection(db, "clinical_notes"), {
          note_hash: noteHash,
          encrypted_content: content,
          title,
          status: "submitted",
          submitted_by: userId,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        });

        // --- Step 3: Submit on-chain ---
        setState((s) => ({ ...s, noteId: noteRef.id, step: "submitting", message: "Submitting to GenLayer intelligent contract..." }));

        if (!account) {
          throw new Error("Wallet not ready — please wait a moment and try again");
        }

        const client = createGenlayerClient(account);
        let contractAddr: string;
        try {
          contractAddr = getContractAddress();
        } catch {
          throw new Error("GenLayer contract address not configured");
        }

        const hash = await client.writeContract({
          address: contractAddr as `0x${string}`,
          functionName: "submit_note",
          args: [noteHash, content],
          value: BigInt(0),
        });

        const txHash = hash;
        setState((s) => ({ ...s, txHash: hash, step: "awaiting_consensus", message: "Awaiting GenLayer validator consensus (this may take 1-3 minutes)..." }));

        // --- Step 4: Wait for consensus ---
        const receipt = await client.waitForTransactionReceipt({
          hash,
          retries: 80,
          interval: 3000,
        });

        // Extract validator votes
        let consensusVotes: Record<string, string> = {};
        if (receipt.consensus_data?.votes) {
          consensusVotes = receipt.consensus_data.votes;
        }

        // Status 5 = FINALIZED
        if (receipt.status !== 5) {
          throw new Error(`Transaction not finalized (status: ${receipt.status}, result: ${receipt.result})`);
        }

        // --- Step 5: Read on-chain assessment ---
        setState((s) => ({ ...s, step: "syncing", message: "Reading on-chain assessment..." }));

        const assessmentStr = await client.readContract({
          address: contractAddr as `0x${string}`,
          functionName: "get_assessment",
          args: [noteHash],
        });

        const onChainAssessment = JSON.parse(assessmentStr as string);
        if (onChainAssessment.error) {
          throw new Error("On-chain assessment not found after consensus: " + onChainAssessment.error);
        }

        // --- Step 6: Sync to Firebase ---
        setState((s) => ({ ...s, message: "Syncing on-chain results to database..." }));

        const triageId = `${noteRef.id}_${Date.now()}`;
        await setDoc(doc(db, "triage_results", triageId), {
          note_id: noteRef.id,
          note_hash: noteHash,
          category: onChainAssessment.category,
          priority_score: onChainAssessment.priority_score,
          confidence: onChainAssessment.confidence,
          reasoning: onChainAssessment.reasoning,
          routing_recommendation: onChainAssessment.routing_recommendation || "",
          missing_info: typeof onChainAssessment.missing_info === "string"
            ? JSON.parse(onChainAssessment.missing_info)
            : (onChainAssessment.missing_info || []),
          critical_keywords_found: typeof onChainAssessment.critical_keywords_found === "string"
            ? JSON.parse(onChainAssessment.critical_keywords_found)
            : (onChainAssessment.critical_keywords_found || []),
          human_review_required: onChainAssessment.human_review_required,
          consensus_percentage:
            Object.values(consensusVotes).filter((v) => v === "agree").length /
            Math.max(Object.keys(consensusVotes).length, 1) * 100,
          source: "genlayer_contract",
          tx_hash: txHash,
          created_at: Timestamp.now(),
        });

        // Save real validator decisions
        const voteEntries = Object.entries(consensusVotes).filter(([, v]) => v !== "idle");
        for (const [validatorAddr, vote] of voteEntries) {
          await addDoc(collection(db, "validator_decisions"), {
            note_id: noteRef.id,
            note_hash: noteHash,
            validator_address: validatorAddr,
            category: onChainAssessment.category,
            vote: vote,
            confidence: onChainAssessment.confidence,
            reasoning: `Validator ${vote === "agree" ? "agreed with" : "disagreed with"} the leader's assessment.`,
            created_at: Timestamp.now(),
          });
        }

        const status = onChainAssessment.human_review_required ? "human_review" : "consensus_reached";
        await updateDoc(doc(db, "clinical_notes", noteRef.id), {
          status,
          priority: onChainAssessment.category,
          tx_hash: txHash,
          updated_at: Timestamp.now(),
        });

        // Audit trail
        await addDoc(collection(db, "audit_logs"), {
          event_type: "note_submitted",
          note_id: noteRef.id,
          note_hash: noteHash,
          actor_id: userId,
          actor_address: address || "",
          details: { tx_hash: txHash, source: "genlayer_contract" },
          tx_hash: txHash,
          created_at: Timestamp.now(),
        });

        await addDoc(collection(db, "audit_logs"), {
          event_type: "triage_completed",
          note_id: noteRef.id,
          note_hash: noteHash,
          actor_id: "system",
          actor_address: "",
          details: { source: "genlayer_contract", category: onChainAssessment.category },
          tx_hash: txHash,
          created_at: Timestamp.now(),
        });

        await addDoc(collection(db, "audit_logs"), {
          event_type: "consensus_reached",
          note_id: noteRef.id,
          note_hash: noteHash,
          actor_id: "system",
          actor_address: "",
          details: {
            on_chain: true,
            validators: voteEntries.length,
            agreement: `${voteEntries.filter(([, v]) => v === "agree").length}/${voteEntries.length}`,
          },
          tx_hash: txHash,
          created_at: Timestamp.now(),
        });

        setState({
          step: "complete",
          message: "Note submitted and assessed on-chain via GenLayer!",
          noteId: noteRef.id,
          txHash,
          error: null,
        });

        queryClient.invalidateQueries({ queryKey: ["notes"] });
        queryClient.invalidateQueries({ queryKey: ["triage"] });
        queryClient.invalidateQueries({ queryKey: ["triage-all"] });
        queryClient.invalidateQueries({ queryKey: ["triage-result"] });
        queryClient.invalidateQueries({ queryKey: ["validator-decisions"] });
        queryClient.invalidateQueries({ queryKey: ["audit-logs"] });

        return noteRef.id;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        console.error("Submission error:", err);
        setState((s) => ({
          ...s,
          step: "error",
          message: "Submission failed",
          error: message,
        }));
      }
    },
    [address, account, queryClient],
  );

  const reset = useCallback(() => {
    setState({ step: "idle", message: "", noteId: null, txHash: null, error: null });
  }, []);

  return { ...state, submit, reset };
}
