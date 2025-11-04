import React, { useEffect, useState } from "react";

const KEY = "hwall_beta_ok";

export default function BetaGate({ children }) {
  const [ok, setOk] = useState(false);
  const [input, setInput] = useState("");

  // Read from env, fallback to a default so production works without Vercel env
  const PASS = (import.meta.env.VITE_BETA_PASS || "hellowall2025").trim();

  // Auto-unlock via ?beta=CODE
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const q = (u.searchParams.get("beta") || "").trim();
      if (q && PASS && q === PASS) {
        localStorage.setItem(KEY, "1");
        setOk(true);
      }
    } catch {}
  }, [PASS]);

  // Restore unlocked state
  useEffect(() => {
    if (localStorage.getItem(KEY) === "1") setOk(true);
  }, []);

  const submit = (e) => {
    e?.preventDefault?.();
    if (!PASS) {
      alert("Beta password not set.");
      return;
    }
    if ((input || "").trim() === PASS) {
      localStorage.setItem(KEY, "1");
      setOk(true);
    } else {
      alert("Wrong code.");
    }
  };

  if (ok) return children;

  return (
    <div style={{ position:"fixed", inset:0, background:"#0b0f19", color:"#e6e7ea", display:"grid", placeItems:"center", padding:24 }}>
      <div style={{ width:"min(520px,92vw)", padding:24, borderRadius:16, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", boxShadow:"0 12px 38px rgba(0,0,0,.35)", backdropFilter:"blur(6px)" }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:"#fff" }}>HelloWall — Private Beta</h1>
        <p style={{ opacity:.9, lineHeight:1.6, marginTop:8 }}>Enter your beta access code to continue.</p>
        <form onSubmit={submit} style={{ display:"flex", gap:10, marginTop:12 }}>
          <input
            type="password"
            placeholder="Beta code"
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            style={{ flex:1, padding:"12px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,.2)", background:"rgba(255,255,255,.08)", color:"#fff", outline:"none" }}
          />
          <button type="submit" style={{ padding:"12px 16px", borderRadius:999, background:"#57C28B", color:"#0b0f19", fontWeight:800, border:"2px solid rgba(255,255,255,.20)", cursor:"pointer" }}>
            Unlock
          </button>
        </form>
        <div style={{ fontSize:12, opacity:.7, marginTop:10 }}>
          Tip: add <code>?beta=hellowall2025</code> to the URL.
        </div>
      </div>
    </div>
  );
}
