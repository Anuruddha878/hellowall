require("dotenv").config();
const { ethers } = require("ethers");

const rpc = process.env.POLYGON_RPC || "https://polygon-rpc.com";
const provider = new ethers.JsonRpcProvider(rpc);

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("Missing PRIVATE_KEY in .env");
  const wallet = new ethers.Wallet(pk, provider);

  const nonceArg = process.argv[2];
  if (!nonceArg) throw new Error("Usage: node scripts/cancelNonce.js <nonce>");

  const nonce = Number(nonceArg);
  const maxFeePerGas = ethers.parseUnits("900", "gwei");
  const maxPriorityFeePerGas = ethers.parseUnits("120", "gwei");

  console.log("Cancelling nonce", nonce, "for", wallet.address);
  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0n,
    nonce,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });
  console.log("Cancel tx:", tx.hash);
  console.log("Track:", "https://polygonscan.com/tx/" + tx.hash);
  await tx.wait();
  console.log("✅ Cancel mined");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
