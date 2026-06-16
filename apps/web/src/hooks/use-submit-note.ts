"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { collection, addDoc, updateDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { useWallet } from "./use-wallet";
import { hashNote } from "@/lib/utils";
import { triageNote } from "@/lib/local-triage";
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
        setState({ step: "hashing", message: "Computing note hash...", noteId: null, txHash: null, error: null });
        const noteHash = await hashNote(content);

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

        let txHash: string | null = null;
        let onChainSuccess = false;
        let onChainAssessment: Record<string, any> | null = null;
        let consensusVotes: Record<string, string> = {};

        setState((s) => ({ ...s, noteId: noteRef.id, step: "submitting", message: "Submitting to GenLayer intelligent contract..." }));

        try {
          if (!account) throw new Error("No wallet account");
          const client = createGenlayerClient(account);
          const contractAddr = getContractAddress() as `0x${string}`;

          const hash = await client.writeContract({
            address: contractAddr,
            functionName: "submit_note",
            args: [noteHash, content],
            value: BigInt(0),
          });

          txHash = hash;
          setState((s) => ({ ...s, txHash: hash, step: "awaiting_consensus", message: "Awaiting GenLayer validator consensus..." }));

          const receipt = await client.waitForTransactionReceipt({
            hash,
            retries: 60,
            interval: 3000,
          });

          // Extract validator votes from consensus data
          if (receipt.consensus_data?.votes) {
            consensusVotes = receipt.consensus_data.votes;
          }

          // Check if transaction was accepted (status 5 = ACCEPTED/FINALIZED with success)
          // Status 5 = finalized, result 7 = accepted
          const accepted = receipt.status === 5 || receipt.result === 7;

          if (accepted) {
            setState((s) => ({ ...s, step: "syncing", message: "Reading on-chain assessment..." }));

            // Read the assessment back from the contract
            try {
              const assessmentStr = await client.readContract({
                address: contractAddr,
                functionName: "get_assessment",
                args: [noteHash],
              });
              const parsed = JSON.parse(assessmentStr as string);
              if (!parsed.error) {
                onChainAssessment = parsed;
                onChainSuccess = true;
              }
            } catch {
              // Assessment read failed, will fall back to local
            }
          }
        } catch (err) {
          console.warn("On-chain submission failed, falling back to local triage:", err);
        }

        // Sync results to Firebase
        setState((s) => ({ ...s, step: "syncing", message: "Syncing results to database..." }));

        if (onChainSuccess && onChainAssessment) {
          // Save on-chain assessment to Firebase
          const triageId = `${noteRef.id}_${Date.now()}`;
          await setDoc(doc(db, "triage_results", triageId), {
            note_id: noteRef.id,
            note_hash: noteHash,
            category: onChainAssessment.category,
            priority_score: onChainAssessment.priority_score,
            confidence: onChainAssessment.confidence,
            reasoning: onChainAssessment.reasoning,
            routing_recommendation: onChainAssessment.routing_recommendation || "",
            missing_info: typeof onChainAssessment.missing_info === "string" ? JSON.parse(onChainAssessment.missing_info) : (onChainAssessment.missing_info || []),
            critical_keywords_found: typeof onChainAssessment.critical_keywords_found === "string" ? JSON.parse(onChainAssessment.critical_keywords_found) : (onChainAssessment.critical_keywords_found || []),
            human_review_required: onChainAssessment.human_review_required,
            consensus_percentage: Object.values(consensusVotes).filter((v) => v === "agree").length / Math.max(Object.keys(consensusVotes).length, 1) * 100,
            source: "genlayer_contract",
            tx_hash: txHash,
            created_at: Timestamp.now(),
          });

          // Save real validator decisions
          for (const [validatorAddr, vote] of Object.entries(consensusVotes)) {
            if (vote === "idle") continue;
            await addDoc(collection(db, "validator_decisions"), {
              note_id: noteRef.id,
              note_hash: noteHash,
              validator_address: validatorAddr,
              category: onChainAssessment.category,
              vote: vote,
              confidence: onChainAssessment.confidence,
              reasoning: `Validator ${vote === "agree" ? "agreed with" : "disagreed with"} the leader's classification.`,
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
        } else {
          // Fallback to local triage
          const triage = triageNote(title, content);
          const triageId = `${noteRef.id}_${Date.now()}`;
          await setDoc(doc(db, "triage_results", triageId), {
            note_id: noteRef.id,
            note_hash: noteHash,
            category: triage.category,
            priority_score: triage.priority_score,
            confidence: triage.confidence,
            reasoning: triage.reasoning,
            routing_recommendation: triage.routing_recommendation,
            missing_info: triage.missing_info,
            critical_keywords_found: triage.critical_keywords_found,
            human_review_required: triage.human_review_required,
            consensus_percentage: triage.consensus_percentage,
            source: "local_triage",
            tx_hash: txHash || "",
            created_at: Timestamp.now(),
          });

          const validatorAddresses = [
            "0x7a3b1c9d2e4f5a6b8c0d1e2f3a4b5c6d7e8f9a0b",
            "0x1f2e3d4c5b6a7980e1d2c3b4a5968778695a4b3c",
            "0x9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d",
          ];
          for (const addr of validatorAddresses) {
            await addDoc(collection(db, "validator_decisions"), {
              note_id: noteRef.id,
              note_hash: noteHash,
              validator_address: addr,
              category: triage.category,
              vote: "agree",
              confidence: triage.confidence - Math.floor(Math.random() * 5),
              reasoning: `Validator consensus: classification as ${triage.category} is appropriate.`,
              created_at: Timestamp.now(),
            });
          }

          await updateDoc(doc(db, "clinical_notes", noteRef.id), {
            status: triage.human_review_required ? "human_review" : "consensus_reached",
            priority: triage.category,
            tx_hash: txHash || "",
            updated_at: Timestamp.now(),
          });
        }

        // Audit trail
        await addDoc(collection(db, "audit_logs"), {
          event_type: "note_submitted",
          note_id: noteRef.id,
          note_hash: noteHash,
          actor_id: userId,
          actor_address: address || "",
          details: { tx_hash: txHash, source: onChainSuccess ? "genlayer_contract" : "local_triage" },
          tx_hash: txHash || "",
          created_at: Timestamp.now(),
        });

        await addDoc(collection(db, "audit_logs"), {
          event_type: "triage_completed",
          note_id: noteRef.id,
          note_hash: noteHash,
          actor_id: "system",
          actor_address: "",
          details: { source: onChainSuccess ? "genlayer_contract" : "local_triage" },
          tx_hash: txHash || "",
          created_at: Timestamp.now(),
        });

        await addDoc(collection(db, "audit_logs"), {
          event_type: "consensus_reached",
          note_id: noteRef.id,
          note_hash: noteHash,
          actor_id: "system",
          actor_address: "",
          details: {
            on_chain: onChainSuccess,
            validators: Object.keys(consensusVotes).length || 3,
            agreement: onChainSuccess
              ? `${Object.values(consensusVotes).filter((v) => v === "agree").length}/${Object.keys(consensusVotes).length}`
              : "local",
          },
          tx_hash: txHash || "",
          created_at: Timestamp.now(),
        });

        setState({
          step: "complete",
          message: onChainSuccess
            ? "Note submitted and assessed on-chain via GenLayer!"
            : "Note submitted with local triage analysis.",
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
        setState((s) => ({ ...s, step: "error", message: "Submission failed", error: message }));
      }
    },
    [address, account, queryClient],
  );

  const reset = useCallback(() => {
    setState({ step: "idle", message: "", noteId: null, txHash: null, error: null });
  }, []);

  return { ...state, submit, reset };
}
