// src/hooks/useHelloWallFeed.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";

// ───────────────────────────────────────────────
// CONFIG — change only if you redeploy
// ───────────────────────────────────────────────
const HELLOWALL = "0xdEA87C6660DAd8cf9E12EFed95E032Fc1B369BAa";
const RPC = "https://rpc-amoy.polygon.technology";
const ABI = [
  "event Post(address indexed author,uint256 indexed id,string contentCid,uint256 feePaid)"
];

// ───────────────────────────────────────────────
// Hook — loads and decodes Post events
// ───────────────────────────────────────────────
export function useHelloWallFeed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const provider = new ethers.JsonRpcProvider(RPC);
    const iface = new ethers.Interface(ABI);

    async function load() {
      try {
        const latest = await provider.getBlockNumber();
        const fromBlock = latest > 12000 ? latest - 12000 : 0;
        const topic = ethers.id("Post(address,uint256,string,uint256)");
        const logs = await provider.getLogs({
          address: HELLOWALL,
          fromBlock,
          toBlock: "latest",
          topics: [topic],
        });

        const decoded = logs.map((l) => {
          const parsed = iface.parseLog(l);
          return {
            id: Number(parsed.args.id),
            author: parsed.args.author,
            text: parsed.args.contentCid,
            tx: l.transactionHash,
          };
        }).reverse();

        setPosts(decoded);
      } catch (err) {
        console.error("Feed error:", err);
      }
    }

    load();
  }, []);

  return posts;
}
