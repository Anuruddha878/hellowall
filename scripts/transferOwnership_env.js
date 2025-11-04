const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const token = (process.env.TOKEN || "").trim();
  const newOwner = (process.env.NEW_OWNER || "").trim();
  if (!token || !newOwner) throw new Error("Set TOKEN and NEW_OWNER env vars.");

  const [signer] = await ethers.getSigners();
  console.log("Using signer:", signer.address);

  const abi = [
    "function owner() view returns (address)",
    "function transferOwnership(address newOwner)"
  ];
  const c = new ethers.Contract(token, abi, signer);

  const cur = await c.owner();
  console.log("Current owner:", cur);
  if (cur.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(`Signer is not current owner. Signer=${signer.address} Owner=${cur}`);
  }

  console.log("Transferring ownership to:", newOwner);
  const tx = await c.transferOwnership(newOwner);
  console.log("Tx sent:", tx.hash);
  const rcpt = await tx.wait();
  console.log("Confirmed in block:", rcpt.blockNumber);

  const after = await c.owner();
  console.log("New owner:", after);
}
main().catch((e)=>{ console.error(e); process.exit(1); });
