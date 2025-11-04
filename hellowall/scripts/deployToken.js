const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // use the same (pending) nonce to replace the stuck tx
  const nonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
  console.log("Using nonce:", nonce);

  // aggressive EIP-1559 fees (adjust if needed)
  const maxFeePerGas = ethers.parseUnits("300", "gwei");
  const maxPriorityFeePerGas = ethers.parseUnits("60", "gwei");

  const initialSupply = ethers.parseUnits("1000000000", 18);
  const Token = await ethers.getContractFactory("HelloWallToken");

  const token = await Token.deploy(
    deployer.address,
    initialSupply,
    { nonce, maxFeePerGas, maxPriorityFeePerGas }
  );

  const tx = token.deploymentTransaction();
  console.log("Deploy tx:", tx.hash);
  console.log("Track:", "https://polygonscan.com/tx/" + tx.hash);

  await tx.wait(1);
  console.log("HWALL deployed to:", await token.getAddress());
}

main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
