const { ethers } = require("hardhat");

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const hash = process.argv[2];
  if (!hash) throw new Error("Usage: node scripts/waitReceiptPoll.js <txHash>");
  console.log("Watching tx:", hash);

  for (let i = 0; i < 120; i++) {        // try for ~10 minutes
    const rcpt = await ethers.provider.getTransactionReceipt(hash);
    if (rcpt) {
      console.log("Status:", rcpt.status === 1 ? "Success" : "Failed");
      console.log("Block:", rcpt.blockNumber);
      console.log("Contract Address:", rcpt.contractAddress || "(none)");
      process.exit(rcpt.status === 1 ? 0 : 1);
    }
    process.stdout.write(".");
    await sleep(5000);
  }
  console.log("\nTimed out waiting for receipt.");
  process.exit(1);
}
main().catch(e=>{console.error(e); process.exit(1);});
