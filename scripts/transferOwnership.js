const hre = require("hardhat");
const { ethers } = hre;

// USAGE:
//   npx hardhat run scripts/transferOwnership.js --network polygon \
//     --token 0xTOKEN_ADDR --new 0xNEW_OWNER_ADDR
//
// or use --network amoy for testnet.

async function main() {
  const args = require("minimist")(process.argv.slice(2));
  const token = (args.token || "").trim();
  const newOwner = (args.new || "").trim();

  if (!token || !newOwner) {
    throw new Error("Missing --token or --new address.");
  }

  const [signer] = await ethers.getSigners();
  console.log("Using signer:", signer.address);

  // Minimal ABI: try Ownable; fall back if not present
  const ownableAbi = [
    "function owner() view returns (address)",
    "function transferOwnership(address newOwner)"
  ];

  const contract = new ethers.Contract(token, ownableAbi, signer);

  // Check if contract is Ownable
  let currentOwner;
  try {
    currentOwner = await contract.owner();
    console.log("Current owner:", currentOwner);
  } catch (e) {
    console.error("This contract does not expose owner() — likely not Ownable.");
    console.error("If it's a standard ERC-20 without Ownable, there is no ownership to transfer.");
    return;
  }

  if (currentOwner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(`Signer is not the current owner. Signer=${signer.address} Owner=${currentOwner}`);
  }

  console.log(`Transferring ownership to: ${newOwner} ...`);
  const tx = await contract.transferOwnership(newOwner);
  console.log("Tx sent:", tx.hash);
  const rcpt = await tx.wait();
  console.log("Confirmed in block:", rcpt.blockNumber);

  const after = await contract.owner();
  console.log("New owner:", after);
}
main().catch((e) => { console.error(e); process.exit(1); });
