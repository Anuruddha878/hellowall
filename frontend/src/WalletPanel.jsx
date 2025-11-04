import React, { useEffect, useState, useCallback } from "react";
import { formatUnits } from "ethers";
import { getProvider, getContract, TOKEN, EXPLORER, quickSwapBuyUrl } from "./lib/hwall";

export default function WalletPanel() {
  const [acct, setAcct] = useState(null);
  const [symbol, setSymbol] = useState("HWALL");
  const [dec, setDec] = useState(18);
  const [bal, setBal] = useState(null);
  const [error, setError] = useState("");

  const connect = useCallback(async () => {
    try {
      setError("");
      if (!window.ethereum) throw new Error("Please install MetaMask.");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAcct(accounts?.[0] || null);
    } catch (e) {
      setError(e.message || String(e));
    }
  }, []);

  const load = useCallback(async () => {
    if (!acct) return;
    try {
      setError("");
      const provider = await getProvider();
      const c = await getContract(provider);
      const [s, d, b] = await Promise.all([c.symbol(), c.decimals(), c.balanceOf(acct)]);
      setSymbol(s);
      setDec(d);
      setBal(formatUnits(b, d));
    } catch (e) {
      setError(e.message || String(e));
    }
  }, [acct]);

  useEffect(() => {
    if (window.ethereum) {
      const onAcc = (accs) => setAcct(accs?.[0] || null);
      const onChain = () => load();
      window.ethereum.on("accountsChanged", onAcc);
      window.ethereum.on("chainChanged", onChain);
      return () => {
        window.ethereum.removeListener("accountsChanged", onAcc);
        window.ethereum.removeListener("chainChanged", onChain);
      };
    }
  }, [load]);

  useEffect(() => { load(); }, [acct, load]);

  return (
    <div style={{maxWidth: 560, margin: "40px auto", padding: 16, borderRadius: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.08)"}}>
      <h2 style={{margin: 0}}>HelloWall — Wallet</h2>
      <p style={{marginTop: 6, opacity: 0.7}}>
        Token: <a href={`${EXPLORER}/token/${TOKEN}`} target="_blank" rel="noreferrer">{TOKEN.slice(0,6)}…{TOKEN.slice(-4)}</a>
      </p>

      {!acct ? (
        <button onClick={connect} style={{padding: "10px 16px", borderRadius: 12, border: "1px solid #ddd", cursor: "pointer"}}>
          Connect MetaMask
        </button>
      ) : (
        <>
          <div style={{margin: "10px 0", fontFamily: "monospace"}}>Account: {acct.slice(0,6)}…{acct.slice(-4)}</div>
          <div style={{fontSize: 24, fontWeight: 700}}>
            {bal === null ? "…" : Number(bal).toLocaleString()} {symbol}
          </div>

          <div style={{display: "flex", gap: 10, marginTop: 14}}>
            <a href={quickSwapBuyUrl()} target="_blank" rel="noreferrer" style={{textDecoration: "none"}}>
              <button style={{padding: "10px 16px", borderRadius: 12, border: "1px solid #ddd", cursor: "pointer"}}>
                Buy {symbol} on QuickSwap
              </button>
            </a>
            <a href={`${EXPLORER}/address/${acct}`} target="_blank" rel="noreferrer" style={{textDecoration: "none"}}>
              <button style={{padding: "10px 16px", borderRadius: 12, border: "1px solid #ddd", cursor: "pointer"}}>
                View on Polygonscan
              </button>
            </a>
          </div>
        </>
      )}

      {error && <div style={{marginTop:12, color:"#c00"}}>{error}</div>}
    </div>
  );
}
