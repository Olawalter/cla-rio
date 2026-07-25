import { createClient } from "genlayer-js";
import { studionet, localnet } from "genlayer-js/chains";
import { GENLAYER_CHAIN } from "./contract";

function getChain() {
  if (GENLAYER_CHAIN === "localnet") return localnet;
  return studionet;
}

export function createGenlayerClient(provider?: unknown) {
  return createClient({
    chain: getChain() as any,
    provider: provider as any,
  });
}

export function createReadOnlyClient() {
  return createClient({
    chain: getChain() as any,
  });
}
