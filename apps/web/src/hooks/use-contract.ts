"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useWallet } from "./use-wallet";
import { getContractAddress } from "@/services/genlayer/client";

export function useContractRead(functionName: string, args: unknown[] = []) {
  const { getClient, connected } = useWallet();

  return useQuery({
    queryKey: ["contract", functionName, ...args],
    queryFn: async () => {
      const client = getClient();
      const result = await client.readContract({
        address: getContractAddress() as `0x${string}`,
        functionName,
        args: args as any[],
      });
      return result;
    },
    enabled: connected && !!getContractAddress(),
  });
}

export function useContractWrite() {
  const { getClient } = useWallet();

  return useMutation({
    mutationFn: async ({
      functionName,
      args,
    }: {
      functionName: string;
      args: unknown[];
    }) => {
      const client = getClient();
      const address = getContractAddress() as `0x${string}`;

      const hash = await client.writeContract({
        address,
        functionName,
        args: args as any[],
        value: BigInt(0),
      });

      const receipt = await client.waitForTransactionReceipt({
        hash,
        retries: 60,
        interval: 3000,
      });

      return { hash, receipt };
    },
  });
}

export function useAllNotes() {
  const { getClient, connected } = useWallet();

  return useQuery({
    queryKey: ["contract", "get_all_notes"],
    queryFn: async () => {
      const client = getClient();
      const result = await client.readContract({
        address: getContractAddress() as `0x${string}`,
        functionName: "get_all_notes",
        args: [],
      });
      const parsed = JSON.parse(result as string);
      return parsed as Array<{
        note_hash: string;
        note: {
          note_hash: string;
          de_identified_text: string;
          submitter: string;
          timestamp: string;
          status: string;
        };
        assessment: {
          category: string;
          priority_score: number;
          confidence: number;
          reasoning: string;
          missing_info: string;
          routing_recommendation: string;
          human_review_required: boolean;
          human_review_reasons: string;
          critical_keywords_found: string;
        } | null;
      }>;
    },
    enabled: connected,
    refetchInterval: 15000,
  });
}

export function useAllAuditLogs() {
  const { getClient, connected } = useWallet();

  return useQuery({
    queryKey: ["contract", "get_all_audit_logs"],
    queryFn: async () => {
      const client = getClient();
      const result = await client.readContract({
        address: getContractAddress() as `0x${string}`,
        functionName: "get_all_audit_logs",
        args: [],
      });
      return JSON.parse(result as string) as Array<{
        event_type: string;
        note_hash: string;
        actor: string;
        details: string;
        timestamp: string;
      }>;
    },
    enabled: connected,
    refetchInterval: 15000,
  });
}

export function useAllChallenges() {
  const { getClient, connected } = useWallet();

  return useQuery({
    queryKey: ["contract", "get_all_challenges"],
    queryFn: async () => {
      const client = getClient();
      const result = await client.readContract({
        address: getContractAddress() as `0x${string}`,
        functionName: "get_all_challenges",
        args: [],
      });
      return JSON.parse(result as string) as Array<{
        challenge_id: string;
        note_hash: string;
        challenger: string;
        reason: string;
        evidence: string;
        status: string;
        original_category: string;
        proposed_category: string;
        resolution: string;
        created_at: string;
        resolved_at: string;
      }>;
    },
    enabled: connected,
    refetchInterval: 15000,
  });
}

export function useNoteDetail(noteHash: string) {
  const { getClient, connected } = useWallet();

  return useQuery({
    queryKey: ["contract", "note_detail", noteHash],
    queryFn: async () => {
      const client = getClient();
      const addr = getContractAddress() as `0x${string}`;

      const [noteStr, assessmentStr] = await Promise.all([
        client.readContract({ address: addr, functionName: "get_note", args: [noteHash] }),
        client.readContract({ address: addr, functionName: "get_assessment", args: [noteHash] }),
      ]);

      const note = JSON.parse(noteStr as string);
      const assessment = JSON.parse(assessmentStr as string);

      return {
        note: note.error ? null : note,
        assessment: assessment.error ? null : assessment,
      };
    },
    enabled: connected && !!noteHash,
  });
}
