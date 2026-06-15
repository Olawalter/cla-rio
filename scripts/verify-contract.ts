/**
 * Verify a deployed Clario contract by calling its view methods.
 *
 * Usage:
 *   NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0x... npx tsx scripts/verify-contract.ts
 */

import { createClient, createAccount } from "genlayer-js";

const RPC_URL =
  process.env.GENLAYER_RPC_URL || "https://studio.genlayer.com/api";
const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "";

async function main() {
  if (!CONTRACT_ADDRESS) {
    console.error("Set NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS");
    process.exit(1);
  }

  console.log("=== Clario Contract Verification ===\n");
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`RPC: ${RPC_URL}\n`);

  const client = createClient({
    chain: {
      id: 0,
      name: "studionet",
      rpcUrls: { default: { http: [RPC_URL] } },
    } as any,
    account: createAccount(),
  });

  const address = CONTRACT_ADDRESS as `0x${string}`;

  try {
    console.log("Reading protocol version...");
    const version = await client.readContract({
      address,
      functionName: "get_protocol_version",
      args: [],
    });
    console.log(`  Protocol version: ${version}`);

    console.log("Reading audit log length...");
    const logLength = await client.readContract({
      address,
      functionName: "get_audit_log_length",
      args: [],
    });
    console.log(`  Audit log entries: ${logLength}`);

    console.log("\n=== Contract is responsive ===");
  } catch (error: any) {
    console.error("Verification failed:", error.message || error);
    process.exit(1);
  }
}

main();
