const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const { HWALL_TOKEN, MIN_TOKENS, FEE_BPS, TREASURY, OWNER } = process.env;
  if (!HWALL_TOKEN || !TREASURY || !OWNER) {
    throw new Error("Missing env: HWALL_TOKEN / TREASURY / OWNER");
  }
  const min = BigInt(MIN_TOKENS || "0");
  const bps = Number(FEE_BPS || "0");

  console.log("Deploying HelloWall with params:", {
    HWALL_TOKEN, MIN_TOKENS: min.toString(), FEE_BPS: bps, TREASURY, OWNER
  });

  const Factory = await hre.ethers.getContractFactory("HelloWall");
  const contract = await Factory.deploy(HWALL_TOKEN, min, bps, TREASURY, OWNER);
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("✅ HelloWall deployed at:", addr);

  const out = { HelloWall: addr, HWALL: HWALL_TOKEN, network: hre.network.name };
  fs.writeFileSync(path.join(process.cwd(), "addresses.json"), JSON.stringify(out, null, 2));
  console.log("📝 Saved addresses.json");
}

main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
