import React, { useEffect, useState, useCallback } from "react";
import { formatUnits } from "ethers";
import { getProvider, getContract, TOKEN } from "./lib/hwall";

function Drawer({ open, onClose, children }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position:"fixed", inset:0, background: open ? "rgba(0,0,0,0.35)" : "transparent",
                 pointerEvents: open ? "auto" : "none", transition:"background .2s ease" }}
      />
      <div
        style={{ position:"fixed", top:0, right:0, height:"100vh", width:360, background:"#fff",
                 boxShadow:"-12px 0 30px rgba(0,0,0,.12)", transform: open ? "translateX(0)" : "translateX(100%)",
                 transition:"transform .25s ease", padding:20, overflowY:"auto", borderLeft:"1px solid rgba(0,0,0,.08)", zIndex:1000 }}
      >
        {children}
      </div>
    </>
  );
}

/**
 * WalletBadge controller
 * props.ui:
 *  - "badge" (default): shows its own button
 *  - "external": hides its button and exposes window.hwWallet API + events so your old button can control it
 *
 * Global:
 *  window.hwWallet = { toggle(), connect(), open(), close(), isConnected, balance, symbol, address }
 *  window dispatches: new CustomEvent('wallet:state', { detail: { connected, balance, symbol, address } })
 */
export default function WalletBadge({ ui = "badge" }) {
  const [acct, setAcct] = useState(null);
  const [sym, setSym]   = useState("HWALL");
  const [dec, setDec]   = useState(18);
  const [bal, setBal]   = useState(null);
  const [open, setOpen] = useState(false);
  const [err, setErr]   = useState("");

  const notify = (state) => {
    const detail = {
      connected: !!acct,
      balance: bal,
      symbol: sym,
      address: acct,
      ...state
    };
    window.dispatchEvent(new CustomEvent("wallet:state", { detail }));
  };

  const load = useCallback(async () => {
    try {
      setErr("");
      const provider = await getProvider();
      const c = await getContract(provider);
      const [s, d] = await Promise.all([c.symbol(), c.decimals()]);
      setSym(s); setDec(d);

      const accounts = await provider.send("eth_accounts", []);
      const a = accounts?.[0] || null;
      setAcct(a);
      if (a) {
        const b = await c.balanceOf(a);
        const v = formatUnits(b, d);
        setBal(v);
        notify({ connected: true, balance: v, symbol: s, address: a });
      } else {
        setBal(null);
        notify({ connected: false });
      }
    } catch (e) {
      setErr(e.message || String(e));
    }
  }, [sym, bal, acct]);

  useEffect(() => {
    const onConnected = () => load();
    window.addEventListener("wallet:connected", onConnected);
    load();
    return () => window.removeEventListener("wallet:connected", onConnected);
  }, [load]);

  useEffect(() => {
    if (!window.ethereum) return;
    const onAcc = () => load();
    const onChain = () => load();
    window.ethereum.on("accountsChanged", onAcc);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAcc);
      window.ethereum.removeListener("chainChanged", onChain);
    };
  }, [load]);

  const connect = async () => {
    if (!window.ethereum) throw new Error("Please install MetaMask");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    window.dispatchEvent(new Event("wallet:connected"));
    await load();
    setOpen(true);
  };

  // expose controller for your external button
  useEffect(() => {
    window.hwWallet = {
      toggle: () => setOpen((v) => !v),
      open:   () => setOpen(true),
      close:  () => setOpen(false),
      connect,
      get isConnected() { return !!acct; },
      get balance() { return bal; },
      get symbol() { return sym; },
      get address() { return acct; },
    };
    notify({});
    return () => { if (window.hwWallet) delete window.hwWallet; };
  }, [acct, bal, sym]);

  const pseudoDisconnect = () => { setOpen(false); setAcct(null); setBal(null); notify({ connected:false }); };

  const short = (a) => (a ? a.slice(0,6)+"…"+a.slice(-4) : "");
  const buyUrl = `https://quickswap.exchange/#/swap?outputCurrency=${TOKEN}`;

  // hide internal badge if ui="external"
  const showBadge = ui !== "external";

  return (
    <>
      {showBadge && (
        <button
          onClick={() => (acct ? setOpen(true) : connect())}
          style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"8px 12px",
                   borderRadius:999, border:"1px solid rgba(0,0,0,.12)", background:"#fff",
                   cursor:"pointer", boxShadow:"0 4px 14px rgba(0,0,0,.06)" }}
          aria-label="Wallet"
          title={acct ? "Open wallet panel" : "Connect wallet"}
        >
          <span style={{fontWeight:700}}>{acct ? "My Wallet" : "Connect Wallet"}</span>
          {acct && <span style={{opacity:.7, fontFamily:"monospace"}}>
            {bal === null ? "…" : Number(bal).toLocaleString()} {sym}
          </span>}
        </button>
      )}

      <Drawer open={open} onClose={()=>setOpen(false)}>
        <h3 style={{marginTop:0}}>My Wallet</h3>
        {acct ? (
          <>
            <div style={{margin:"12px 0"}}>
              <div style={{opacity:.7, fontSize:12, textTransform:"uppercase", letterSpacing:.6}}>Amount</div>
              <div style={{fontSize:28, fontWeight:800}}>
                {bal === null ? "…" : Number(bal).toLocaleString()} {sym}
              </div>
              <div style={{opacity:.6, fontFamily:"monospace"}}>{short(acct)}</div>
            </div>
            <div style={{margin:"16px 0"}}>
              <div style={{opacity:.7, fontSize:12, textTransform:"uppercase", letterSpacing:.6}}>Rank</div>
              <div style={{fontSize:18, fontWeight:700}}>Soon</div>
            </div>
            <div style={{display:"flex", gap:10, marginTop:12, flexWrap:"wrap"}}>
              <a href={buyUrl} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
                <button style={{padding:"10px 14px", borderRadius:12, border:"1px solid #ddd"}}>+ HWALL</button>
              </a>
              <button onClick={pseudoDisconnect} style={{padding:"10px 14px", borderRadius:12, border:"1px solid #ddd"}}>- Wallet</button>
            </div>
          </>
        ) : (
          <>
            <p>Connect your wallet to view.</p>
            <button onClick={connect} style={{padding:"8px 12px", borderRadius:10, border:"1px solid #ddd"}}>Connect Wallet</button>
          </>
        )}
        {err && <div style={{marginTop:10, color:"#c00"}}>{err}</div>}
      </Drawer>
    </>
  );
}
