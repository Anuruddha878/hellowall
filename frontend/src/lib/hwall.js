import { ethers } from "ethers";

export const TOKEN = import.meta.env.VITE_TOKEN_ADDRESS || "0x688546B4819b637aF3657EEb2752c081316fA7D1";
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 137);
export const EXPLORER = import.meta.env.VITE_BLOCK_EXPLORER || "https://polygonscan.com";

const ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

export async function getProvider() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const net = await provider.getNetwork();
  if (Number(net.chainId) !== CHAIN_ID) {
    throw new Error(`Wrong network. Please switch to Polygon (chainId ${CHAIN_ID}).`);
  }
  return provider;
}

export async function getContract(signerOrProvider) {
  return new ethers.Contract(TOKEN, ABI, signerOrProvider);
}

export function quickSwapBuyUrl() {
  return `https://quickswap.exchange/#/swap?outputCurrency=${TOKEN}`;
}
