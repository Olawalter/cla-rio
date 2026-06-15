/**
 * Deploy the Clario Intelligent Contract to GenLayer StudioNet.
 *
 * Usage:
 *   npx tsx scripts/deploy.ts
 *
 * Requires:
 *   GENLAYER_RPC_URL — defaults to https://studio.genlayer.com/api
 *   DEPLOYER_PRIVATE_KEY — optional, generates a random account if not set
 */

import { createClient, createAccount } from "genlayer-js";
import * as fs from "node:fs";
import * as path from "node:path";

const RPC_URL =
  process.env.GENLAYER_RPC_URL || "https://studio.genlayer.com/api";

async function main() {
  console.log("=== Clario Contract Deployment ===\n");
  console.log(`Target RPC: ${RPC_URL}`);

  // Read contract source
  const contractPath = path.resolve(__dirname, "../contracts/clario.py");
  if (!fs.existsSync(contractPath)) {
    console.error(`Contract not found at ${contractPath}`);
    process.exit(1);
  }
  const contractCode = fs.readFileSync(contractPath, "utf-8");
  console.log(`Contract source: ${contractPath} (${contractCode.length} bytes)`);

  // Create deployer account
  const account = createAccount();
  console.log(`Deployer address: ${account.address}\n`);

  // Create client
  const client = createClient({
    chain: {
      id: 0,
      name: "studionet",
      rpcUrls: { default: { http: [RPC_URL] } },
    } as any,
    account,
  });

  console.log("Deploying contract...");

  try {
    const hash = await client.deployContract({
      code: contractCode,
      args: [],
    });

    console.log(`Transaction hash: ${hash}`);
    console.log("Waiting for transaction receipt...");

    const receipt = await client.waitForTransactionReceipt({
      hash,
      status: "ACCEPTED" as any,
      retries: 60,
      interval: 3000,
    });

    const contractAddress = (receipt as any).contract_address ||
      (receipt as any).contractAddress ||
      (receipt as any).result;

    console.log("\n=== Deployment Successful ===");
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Transaction Hash: ${hash}`);
    console.log(`\nAdd this to your .env.local:`);
    console.log(`NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=${contractAddress}`);

    // Write address to a file for convenience
    const envPath = path.resolve(__dirname, "../apps/web/.env.local");
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, "utf-8");
      if (envContent.includes("NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=")) {
        envContent = envContent.replace(
          /NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=.*/,
          `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=${contractAddress}`,
        );
      } else {
        envContent += `\nNEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=${contractAddress}\n`;
      }
      fs.writeFileSync(envPath, envContent);
      console.log(`\nUpdated ${envPath} with contract address.`);
    }
  } catch (error: any) {
    console.error("\nDeployment failed:", error.message || error);
    process.exit(1);
  }
}

main();
