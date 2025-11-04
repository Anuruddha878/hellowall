const { ethers } = require("hardhat");
async function main() {
  const [me] = await ethers.getSigners();
  const nonce = await ethers.provider.getTransactionCount(me.address, "pending");
  console.log("Cancelling nonce:", nonce, "for", me.address);

  const maxFeePerGas = ethers.parseUnits("600", "gwei");
  const maxPriorityFeePerGas = ethers.parseUnits("80", "gwei");

  const tx = await me.sendTransaction({
    to: me.address,
    value: 0n,
    nonce,
    maxFeePerGas,
    maxPriorityFeePerGas
  });

  console.log("Cancel tx:", tx.hash);
  console.log("Track: https://polygonscan.com/tx/" + tx.hash);
  await tx.wait();
  console.log("Cancel mined ✅");
}
main().catch(e=>{ console.error(e); process.exit(1); });
