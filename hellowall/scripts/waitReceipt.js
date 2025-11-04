const { ethers } = require("hardhat");

async function main() {
  const hash = process.argv[2];
  if (!hash) throw new Error("Usage: node scripts/waitReceipt.js <txHash>");
  console.log("Checking tx:", hash);
  const rcpt = await ethers.provider.waitForTransaction(hash, 1); // wait 1 confirmation
  console.log("Status:", rcpt.status === 1 ? "Success" : "Failed");
  console.log("Block:", rcpt.blockNumber);
  console.log("Contract Address:", rcpt.contractAddress || "(none)");
}
main().catch(e=>{console.error(e); process.exit(1);});
