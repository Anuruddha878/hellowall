import React, { useEffect, useState } from "react";

const KEY = "hwall_wallet_ok";

export default function WalletGate({ children }) {
  const OWNER = (import.meta.env.VITE_OWNER_ADDR || "").toLowerCase();

  const [account, setAccount] = useState(null);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  // Restore prior unlock
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const { acct } = JSON.parse(saved);
        if (acct) {
          setAccount(acct);
          setOk(OWNER && acct.toLowerCase() === OWNER);
        }
      }
    } catch {}
  }, [OWNER]);

  // React to wallet account changes
  useEffect(() => {
    if (!window.ethereum) return;
    const handler = (accts) => {
      const addr = (accts?.[0] || "").toLowerCase();
      setAccount(addr || null);
      setOk(OWNER && addr === OWNER);
      try { localStorage.setItem(KEY, JSON.stringify({ acct: addr })); } catch {}
    };
    window.ethereum.on?.("accountsChanged", handler);
    return () => window.ethereum.removeListener?.("accountsChanged", handler);
  }, [OWNER]);

  const connect = async () => {
    setErr("");
    try {
      if (!window.ethereum) { setErr("No wallet found. Install MetaMask."); return; }
      const accts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const addr = (accts?.[0] || "").toLowerCase();
      setAccount(addr || null);
      const pass = OWNER && addr === OWNER;
      setOk(pass);
      try { localStorage.setItem(KEY, JSON.stringify({ acct: addr })); } catch {}
      if (!pass) setErr("This wallet is not authorized.");
    } catch (e) {
      setErr(e?.message || "Wallet connection cancelled.");
    }
  };

  const disconnect = () => {
    try { localStorage.removeItem(KEY); } catch {}
    setAccount(null);
    setOk(false);
  };

  if (ok) return children;

  return (
    <div style={{ position:"fixed", inset:0, background:"#0b0f19", color:"#e6e7ea",
                  display:"grid", placeItems:"center", padding:24 }}>
      <div style={{
        width:"min(520px,92vw)", padding:24, borderRadius:16,
        background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)",
        boxShadow:"0 12px 38px rgba(0,0,0,.35)", backdropFilter:"blur(6px)"
      }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:"#fff" }}>
          HelloWall — Owner Access
        </h1>
        <p style={{ opacity:.9, lineHeight:1.6, marginTop:8 }}>
          Connect the authorized wallet to continue.
        </p>
        <div style={{ display:"flex", gap:10, marginTop:12, alignItems:"center" }}>
          <button onClick={connect}
            style={{ padding:"12px 16px", borderRadius:999, background:"#57C28B",
                     color:"#0b0f19", fontWeight:800, border:"2px solid rgba(255,255,255,.20)",
                     cursor:"pointer" }}>
            {account ? "Reconnect wallet" : "Connect wallet"}
          </button>
          {account && (
            <button onClick={disconnect}
              style={{ padding:"10px 14px", borderRadius:12, background:"rgba(255,255,255,.08)",
                       color:"#e6e7ea", border:"1px solid rgba(255,255,255,.15)" }}>
              Disconnect
            </button>
          )}
        </div>
        <div style={{ fontSize:12, opacity:.8, marginTop:10 }}>
          {account ? `Connected: ${account.slice(0,6)}…${account.slice(-4)}` : "No wallet connected"}
        </div>
        {err && <div style={{ color:"#ff9e9e", marginTop:10 }}>{err}</div>}
        {!OWNER && (
          <div style={{ color:"#ffcf8a", marginTop:10 }}>
            Warning: VITE_OWNER_ADDR is not set on this environment.
          </div>
        )}
      </div>
    </div>
  );
}
