import { createClient, generatePrivateKey, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { readFileSync } from "fs";
import { resolve } from "path";

const contractPath = resolve("../contracts/clario.py");
const code = readFileSync(contractPath, "utf-8");

console.log("Generating deployer account...");
const privateKey = generatePrivateKey();
const account = createAccount(privateKey);
console.log("Deployer address:", account.address);

console.log("Creating client for StudioNet (gasless)...");
const client = createClient({ chain: studionet, account });

console.log("\nDeploying contract (" + code.length + " bytes)...");
console.log("This may take 2-5 minutes for validator consensus...\n");

try {
  const txHash = await client.deployContract({
    code,
    args: [],
    leaderOnly: false,
  });

  console.log("Deploy transaction submitted!");
  console.log("Transaction hash:", txHash);

  console.log("\nWaiting for transaction receipt (up to 6 min)...");
  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    retries: 120,
    interval: 3000,
  });

  console.log("\n========================================");
  console.log("DEPLOYMENT COMPLETE");
  console.log("========================================");
  console.log("  Status:", receipt.status);

  const contractAddr =
    receipt.contract_address ||
    receipt.contractAddress ||
    receipt.data?.contract_address ||
    "see full receipt below";
  console.log("  Contract address:", contractAddr);
  console.log("  Deployer:", account.address);
  console.log("  Transaction:", txHash);
  console.log("========================================\n");

  console.log("Full receipt:", JSON.stringify(receipt, null, 2));
} catch (err) {
  console.error("Deployment failed:", err.message || err);
  if (err.details) console.error("Details:", err.details);
  process.exit(1);
}
