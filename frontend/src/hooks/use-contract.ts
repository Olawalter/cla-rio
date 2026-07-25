import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "./use-wallet";
import { CONTRACT_ADDRESS } from "@/config/contract";

type Address = `0x${string}`;

function addr(): Address {
  if (!CONTRACT_ADDRESS) throw new Error("VITE_CONTRACT_ADDRESS not set");
  return CONTRACT_ADDRESS as Address;
}

// --- Generic read/write ---

export function useContractRead<T = unknown>(
  functionName: string,
  args: unknown[] = [],
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  const { getReadOnlyClient } = useWallet();

  return useQuery({
    queryKey: ["contract", functionName, ...args],
    queryFn: async () => {
      const client = getReadOnlyClient();
      const result = await client.readContract({
        address: addr(),
        functionName,
        args: args as any[],
      });
      return result as T;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });
}

export function useContractJsonRead<T = unknown>(
  functionName: string,
  args: unknown[] = [],
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  const { getReadOnlyClient } = useWallet();

  return useQuery({
    queryKey: ["contract", functionName, ...args],
    queryFn: async () => {
      const client = getReadOnlyClient();
      const result = await client.readContract({
        address: addr(),
        functionName,
        args: args as any[],
      });
      return JSON.parse(result as string) as T;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });
}

export type TxStep =
  | "idle"
  | "waiting_wallet"
  | "submitted"
  | "pending_consensus"
  | "finalized"
  | "failed";

export function useContractWrite() {
  const { getClient, connected } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      functionName,
      args,
    }: {
      functionName: string;
      args: unknown[];
    }) => {
      if (!connected) throw new Error("Wallet not connected");
      const client = getClient();

      const hash = await client.writeContract({
        address: addr(),
        functionName,
        args: args as any[],
        value: BigInt(0),
      });

      const receipt = await client.waitForTransactionReceipt({
        hash,
        retries: 80,
        interval: 3000,
      });

      return { hash, receipt };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract"] });
    },
  });
}

// --- Typed hooks for specific contract methods ---

export interface CaseData {
  case_id: string;
  note_hash: string;
  sanitized_text: string;
  department: string;
  note_type: string;
  submitter: string;
  status: string;
  priority: string;
  category: string;
  confidence: number;
  reasoning: string;
  missing_info: string;
  routing_recommendation: string;
  human_review_required: boolean;
  human_review_reasons: string;
  critical_keywords_found: string;
  validator_agreement: string;
  appealable: boolean;
  created_at: string;
  triage_started_at: string;
  triage_completed_at: string;
  manual_review_requested_at: string;
  manual_review_completed_at: string;
  challenge_created_at: string;
  challenge_resolved_at: string;
  finalized_at: string;
  archived_at: string;
}

export interface ChallengeData {
  challenge_id: string;
  case_id: string;
  challenger: string;
  reason: string;
  evidence: string;
  original_category: string;
  original_priority: string;
  status: string;
  resolution: string;
  new_category: string;
  upheld: boolean;
  created_at: string;
  resolved_at: string;
}

export interface AuditEntry {
  event_type: string;
  case_id: string;
  actor: string;
  details: string;
  timestamp: string;
}

export function useListCases(refetchInterval = 15000) {
  return useContractJsonRead<CaseData[]>("list_cases", [], { refetchInterval });
}

export function useListCasesByStatus(status: string) {
  return useContractJsonRead<CaseData[]>("list_cases_by_status", [status], {
    refetchInterval: 15000,
  });
}

export function useGetCase(caseId: string) {
  return useContractJsonRead<CaseData>("get_case", [caseId], {
    enabled: !!caseId,
  });
}

export function useGetRole(address: string) {
  const normalized = address ? address.toLowerCase() : "";
  return useContractRead<string>("get_role", [normalized], {
    enabled: !!normalized,
  });
}

export function useListChallenges() {
  return useContractJsonRead<ChallengeData[]>("list_challenges", [], {
    refetchInterval: 15000,
  });
}

export function useListChallengesByCase(caseId: string) {
  return useContractJsonRead<ChallengeData[]>(
    "list_challenges_by_case",
    [caseId],
    { enabled: !!caseId }
  );
}

export function useAuditHistory() {
  return useContractJsonRead<AuditEntry[]>("audit_history", [], {
    refetchInterval: 15000,
  });
}

export function useAuditHistoryByCase(caseId: string) {
  return useContractJsonRead<AuditEntry[]>("audit_history_by_case", [caseId], {
    enabled: !!caseId,
  });
}
