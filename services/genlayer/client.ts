import { createClient, createAccount } from "genlayer-js";
import type { Account } from "genlayer-js/types";

const GENLAYER_RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "http://localhost:4000/api";

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "";

const CHAIN = process.env.NEXT_PUBLIC_GENLAYER_CHAIN || "studionet";

function getChainConfig() {
  switch (CHAIN) {
    case "localnet":
      return { id: 0, name: "localnet", rpcUrls: { default: { http: [GENLAYER_RPC_URL] } } };
    case "studionet":
      return { id: 61999, name: "studionet", rpcUrls: { default: { http: ["https://studio.genlayer.com/api"] } } };
    default:
      return { id: 0, name: CHAIN, rpcUrls: { default: { http: [GENLAYER_RPC_URL] } } };
  }
}

export function createGenlayerClient(account?: Account) {
  const chain = getChainConfig();
  return createClient({
    chain: chain as any,
    account: account || createAccount(),
  });
}

export function getContractAddress(): string {
  if (!CONTRACT_ADDRESS) {
    throw new Error("NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS is not set");
  }
  return CONTRACT_ADDRESS;
}

export { createAccount };
