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
        status: "ACCEPTED" as any,
        retries: 50,
        interval: 3000,
      });

      return { hash, receipt };
    },
  });
}
