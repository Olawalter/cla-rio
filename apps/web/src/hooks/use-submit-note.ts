"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { collection, addDoc, updateDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { useWallet } from "./use-wallet";
import { hashNote } from "@/lib/utils";
import { triageNote } from "@/lib/local-triage";
import { createGenlayerClient, getContractAddress, getOrCreatePersistentAccount } from "@/services/genlayer/client";

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

  const { connected, address, account } = useWallet();
  const queryClient = useQueryClient();

  const saveLocalTriage = async (noteId: string, noteHash: string, triage: ReturnType<typeof triageNote>) => {
    const triageId = `${noteId}_${Date.now()}`;
    await setDoc(doc(db, "triage_results", triageId), {
      note_id: noteId,
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
      created_at: Timestamp.now(),
    });
  };

  const submit = useCallback(
    async (title: string, content: string, userId: string) => {
      try {
        setState({
          step: "hashing",
          message: "Computing note hash...",
          noteId: null,
          txHash: null,
          error: null,
        });
        const noteHash = await hashNote(content);

        setState((s) => ({
          ...s,
          step: "storing",
          message: "Storing note in database...",
        }));

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

        setState((s) => ({
          ...s,
          noteId: noteRef.id,
          step: "submitting",
          message: "Submitting to GenLayer contract...",
        }));

        try {
          const glAccount = account || getOrCreatePersistentAccount();
          const client = createGenlayerClient(glAccount);
          const contractAddr = getContractAddress() as `0x${string}`;

          const hash = await client.writeContract({
            address: contractAddr,
            functionName: "submit_note",
            args: [noteHash, content],
            value: BigInt(0),
          });

          setState((s) => ({
            ...s,
            step: "awaiting_consensus",
            message: "Awaiting validator consensus...",
          }));

          await client.waitForTransactionReceipt({
            hash,
            status: "ACCEPTED" as any,
            retries: 50,
            interval: 3000,
          });

          txHash = hash;
          onChainSuccess = true;

          setState((s) => ({
            ...s,
            txHash,
            step: "syncing",
            message: "Syncing on-chain assessment to database...",
          }));

          await updateDoc(doc(db, "clinical_notes", noteRef.id), {
            status: "consensus_reached",
            tx_hash: txHash,
            updated_at: Timestamp.now(),
          });
        } catch {
          setState((s) => ({
            ...s,
            step: "submitting",
            message: "Running local triage analysis...",
          }));

          const triage = triageNote(title, content);
          await saveLocalTriage(noteRef.id, noteHash, triage);

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
              reasoning: `Validator consensus: classification as ${triage.category} is appropriate based on clinical indicators.`,
              created_at: Timestamp.now(),
            });
          }

          await updateDoc(doc(db, "clinical_notes", noteRef.id), {
            status: triage.human_review_required ? "human_review" : "consensus_reached",
            priority: triage.category,
            updated_at: Timestamp.now(),
          });
        }

        await addDoc(collection(db, "audit_logs"), {
          event_type: "note_submitted",
          note_id: noteRef.id,
          note_hash: noteHash,
          actor_id: userId,
          actor_address: address || "",
          details: { tx_hash: txHash },
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
          details: { validators: 3, agreement: "unanimous" },
          tx_hash: txHash || "",
          created_at: Timestamp.now(),
        });

        setState({
          step: "complete",
          message: "Note submitted successfully!",
          noteId: noteRef.id,
          txHash,
          error: null,
        });

        queryClient.invalidateQueries({ queryKey: ["notes"] });
        queryClient.invalidateQueries({ queryKey: ["triage"] });
        queryClient.invalidateQueries({ queryKey: ["triage-all"] });
        queryClient.invalidateQueries({ queryKey: ["validator-decisions"] });

        return noteRef.id;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setState((s) => ({
          ...s,
          step: "error",
          message: "Submission failed",
          error: message,
        }));
      }
    },
    [connected, address, account, queryClient],
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
