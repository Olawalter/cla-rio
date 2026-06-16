"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { collection, addDoc, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase/config";
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

        if (connected && address) {
          try {
            setState((s) => ({
              ...s,
              noteId: noteRef.id,
              step: "submitting",
              message: "Submitting to GenLayer contract...",
            }));

            const result = await contractWrite.mutateAsync({
              functionName: "submit_note",
              args: [noteHash, content],
            });
            txHash = result.hash;

            setState((s) => ({
              ...s,
              txHash,
              step: "syncing",
              message: "Syncing assessment to database...",
            }));

            await updateDoc(doc(db, "clinical_notes", noteRef.id), {
              status: "consensus_reached",
              tx_hash: txHash,
              updated_at: Timestamp.now(),
            });
          } catch {
            await updateDoc(doc(db, "clinical_notes", noteRef.id), {
              status: "pending_triage",
              updated_at: Timestamp.now(),
            });
          }
        } else {
          await updateDoc(doc(db, "clinical_notes", noteRef.id), {
            status: "pending_triage",
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

        setState({
          step: "complete",
          message: "Note submitted successfully!",
          noteId: noteRef.id,
          txHash,
          error: null,
        });

        queryClient.invalidateQueries({ queryKey: ["notes"] });
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
    [connected, address, contractWrite, queryClient],
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
