const { ethers } = require("hardhat");
(async () => {
  const [me] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(me.address);
  const latest = await ethers.provider.getTransactionCount(me.address, "latest");
  const pending = await ethers.provider.getTransactionCount(me.address, "pending");
  console.log("Addr:", me.address);
  console.log("Balance (POL wei):", bal.toString());
  console.log("Nonce latest:", latest);
  console.log("Nonce pending:", pending);
})();
