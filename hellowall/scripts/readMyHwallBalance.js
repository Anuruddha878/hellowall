const hre = require("hardhat");

async function main() {
  const addr = process.env.HWALL_ADDR;
  if (!addr) throw new Error("HWALL_ADDR missing from .env");

  const [signer] = await hre.ethers.getSigners();
  const me = signer.address;

  const abi = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];
  const token = await hre.ethers.getContractAt(abi, addr);

  const [dec, raw] = await Promise.all([token.decimals(), token.balanceOf(me)]);
  const bal = hre.ethers.formatUnits(raw, dec);

  console.log("Account:      ", me);
  console.log("HWALL address:", addr);
  console.log("Balance:      ", bal);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
