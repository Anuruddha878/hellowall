const hre = require("hardhat");

async function main() {
  const addr = process.env.HWALL_ADDR;
  if (!addr) throw new Error("HWALL_ADDR missing from .env");

  const abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)"
  ];

  const token = await hre.ethers.getContractAt(abi, addr);

  const [name, symbol, decimals, totalSupply] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
    token.totalSupply()
  ]);

  // Format supply with decimals
  const formattedSupply = hre.ethers.formatUnits(totalSupply, decimals);

  console.log("Address:       ", addr);
  console.log("Name / Symbol: ", name, "/", symbol);
  console.log("Decimals:      ", decimals);
  console.log("Total Supply:  ", formattedSupply);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
