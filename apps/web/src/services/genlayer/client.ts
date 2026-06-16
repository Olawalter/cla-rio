import { createClient, createAccount, generatePrivateKey, chains } from "genlayer-js";
import type { Account } from "genlayer-js/types";

const { studionet, localnet } = chains;

const CHAIN = process.env.NEXT_PUBLIC_GENLAYER_CHAIN || "studionet";

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "";

function getChain() {
  if (CHAIN === "localnet") return localnet;
  return studionet;
}

export function createGenlayerClient(account?: Account) {
  return createClient({
    chain: getChain() as any,
    account: account || createAccount(),
  });
}

export function getContractAddress(): string {
  if (!CONTRACT_ADDRESS) {
    throw new Error("NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS is not set");
  }
  return CONTRACT_ADDRESS;
}

export { createAccount, generatePrivateKey };
