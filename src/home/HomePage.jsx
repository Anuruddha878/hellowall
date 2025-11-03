import React, { useEffect, useMemo, useRef, useState } from "react";
import SidePanel from "../components/SidePanel";

/* ───────── Config ───────── */
const TOKEN_ADDRESS  = "0x688546B4819b637aF3657EEb2752c081316fA7D1"; // HWALL (Polygon)
const TOKEN_DECIMALS = 18;
const MIN_HOLD_USD   = 20;          // gate by USD value (instead of min units)
const THOUGHT_LIMIT  = 40;          // emoji-safe char cap
const EXTERNAL_BUY_LINK =
  `https://quickswap.exchange/#/swap?inputCurrency=MATIC&outputCurrency=${TOKEN_ADDRESS}`;
const TOTAL_SUPPLY = 1_000_000_000;
const INITIAL_SOLD = 128_000_000;
/* ────────────────────────── */

/* ——— World + motion ——— */
const WORLD = 8000;
const CARD_W = 240;
const CARD_H = 140;
const SPEED_MAX = 0.6;
const REPULSE_DIST = 120;
const REPULSE_K = 0.015;
const PAN_THRESHOLD = 5;

/* ——— Helpers ——— */
const shorten = (a) => (a ? a.slice(0, 6) + "…" + a.slice(-4) : "");
function wrap(v, min, max){ const span=max-min; let x=v; while(x<min)x+=span; while(x>=max)x-=span; return x; }
function limitThought(str){ return Array.from(str ?? "").slice(0, THOUGHT_LIMIT).join(""); } // counts emojis
function getClientId(){ const k="hwall_client_id"; let id=localStorage.getItem(k); if(!id){id="u_"+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem(k,id);} return id; }
function loadUserLikes(uid){ try{return new Set(JSON.parse(localStorage.getItem(`hwall_likes_${uid}`)||"[]"));}catch{return new Set();} }
function saveUserLikes(uid,set){ localStorage.setItem(`hwall_likes_${uid}`, JSON.stringify([...set])); }
function neonColorsFor(name){ let h=0; for(let i=0;i<name.length;i++) h=(h*33+name.charCodeAt(i))%360; return { border:`hsla(${h},100%,60%,.95)`, glow:`hsla(${h},100%,60%,.55)`, tint:`hsla(${h},100%,60%,.015)` }; }

/* —— Minimal ERC-20 balance (no lib) —— */
function pad32(hex){ const s=hex.replace(/^0x/,"").toLowerCase(); return "0x"+s.padStart(64,"0"); }
function toHexAddress(a){ return "0x"+a.replace(/^0x/,"").toLowerCase().padStart(40,"0"); }
async function readErc20Balance(provider, token, wallet){
  const selector="0x70a08231"; const data=selector+pad32(toHexAddress(wallet)).slice(2);
  const res=await provider.request({method:"eth_call", params:[{to:token, data}, "latest"]});
  return BigInt(res);
}
function fromUnits(bn,dec){
  const s=bn.toString(); if(dec===0) return s;
  const int=s.length>dec?s.slice(0,s.length-dec):"0";
  const frac=((dec-(Math.max(0,s.length-dec)))>0 ? "0".repeat(dec-(Math.max(0,s.length-dec))) : "") + s.slice(Math.max(0,s.length-dec));
  return (int+"."+frac).replace(/\.?0+$/,"");
}

/* —— 500 unique names/thoughts/avatars —— */
function generateNames(count){
  const A=["Luna","Nova","Milo","Zara","Arlo","Iris","Enzo","Kian","Nia","Sora","Vera","Remy","Asha","Kao","Odin","Yara","Faye","Avi","Mira","Ezra","Rio","Vale","Juno","Nico","Indie","Pax","Elio","Raya","Kael","Zuri"];
  const B=["Bloom","Flux","Drift","Spark","Quill","Wisp","Glint","Trace","Rune","Scout","Pulse","Forge","Vibe","Wave","Glyph","Nook","Muse","Echo","Loom","Kite","Glow","Hearth","Dash","Fern","Grove","Sage","Dune","Fable","Gale","Myth"];
  const out=[]; let i=0; while(out.length<count){ const name=`${A[i%A.length]} ${B[(i*7)%B.length]}`; out.push(name+(i>=A.length*B.length?` ${Math.floor(i/(A.length*B.length))+1}`:"")); i++; } return out.slice(0,count);
}
function generateThoughts(count){
  const starts=["Tiny win:","Idea:","Note:","Today:","Build:","Ship:","Try:","Sketch:","Plan:","Hint:"];
  const mids=[" ship small"," be kind"," learn fast"," fix one bug"," share joy"," ask why"," test early"," iterate"," keep going"," follow curiosity"," write it down"," trace the spark"," tidy the edges"];
  const em=["✨","🎯","🧠","🛠️","🚀","💡","📌","🧪","🧩","🌱","📎","📦","🔍","📈","💭","🧵","🪄","🔧"];
  const set=new Set(); let tries=0;
  while(set.size<count && tries<count*20){ const s=starts[(Math.random()*starts.length)|0], m=mids[(Math.random()*mids.length)|0], e=em[(Math.random()*em.length)|0]; set.add(limitThought(`${s}${m} ${e}`)); tries++; }
  while(set.size<count){ set.add(limitThought(`Note ${set.size+1} ${em[set.size%em.length]}`)); }
  return [...set].slice(0,count);
}
function seededRand(seed){ let h=0; for(let i=0;i<seed.length;i++) h=(h*31+seed.charCodeAt(i))>>>0; return ()=> (h=(h*1664525+1013904223)>>>0)/2**32; }
function avatarDataUrl(name){
  const rand=seededRand(name); const hue=Math.floor(rand()*360); const hue2=(hue+60+Math.floor(rand()*120))%360;
  const s1=70+Math.floor(rand()*20), l1=50+Math.floor(rand()*10), s2=70+Math.floor(rand()*20), l2=35+Math.floor(rand()*15);
  const emojis=["😀","🙂","😌","😎","🧐","🤓","🥳","😺","🦊","🐼","🐯","🦄","🐨","🐸","🐵","🐝","🌙","⭐️","🍀","⚡️","🎈","🎧","🧠","💡","🚀"];
  const face=emojis[Math.floor(rand()*emojis.length)];
  const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'>
    <defs><radialGradient id='g' cx='30%' cy='30%'><stop offset='0%' stop-color='hsl(${hue},${s1}%,${l1}%)'/><stop offset='100%' stop-color='hsl(${hue2},${s2}%,${l2}%)'/></radialGradient></defs>
    <circle cx='40' cy='40' r='38' fill='url(#g)'/><text x='50%' y='55%' text-anchor='middle' dominant-baseline='middle' font-size='40'>${face}</text></svg>`;
  return "data:image/svg+xml;utf8,"+encodeURIComponent(svg);
}

/* —— styles —— */
const ctaBtn = { fontSize:16, fontWeight:700, padding:"12px 18px", borderRadius:999, background:"#57C28B", color:"#0b0f19", border:"2px solid rgba(255,255,255,.20)", boxShadow:"inset 0 1px 0 rgba(255,255,255,.25), 0 3px 10px rgba(0,0,0,.25)", cursor:"pointer" };
const chip   = { fontSize:12, padding:"6px 10px", borderRadius:999, background:"rgba(255,255,255,.12)", color:"#e6e7ea", border:"1px solid rgba(255,255,255,.15)", cursor:"pointer" };
const closeBtn = { border:"1px solid rgba(255,255,255,.12)", background:"rgba(255,255,255,.08)", color:"#e6e7ea", padding:"6px 12px", borderRadius:10, cursor:"pointer" };
const navLinkStyle = { color:"#cfd2d8", textDecoration:"none" };

/* ------- USD price helpers (fallback manual) ------- */
function getManualPriceUsd(){ const s=localStorage.getItem("hwall_price_usd"); return s?parseFloat(s):null; }
window.setHwallPriceUsd = (p)=>{ localStorage.setItem("hwall_price_usd", String(p)); alert("Manual HWALL price saved: $"+p); };
async function fetchUsdPriceVia0x(token, tokenDecimals){
  try{
    const url=new URL("https://polygon.api.0x.org/swap/v1/price");
    url.searchParams.set("sellToken","USDC");
    url.searchParams.set("buyToken",token);
    url.searchParams.set("sellAmount","1000000"); // 1 USDC (6dp)
    const res=await fetch(url.toString(),{mode:"cors"});
    if(!res.ok) throw new Error("0x price fail");
    const data=await res.json();
    const buyAmount=BigInt(data.buyAmount);
    const hwallFor1Usd=Number(buyAmount)/10**tokenDecimals;
    if(!hwallFor1Usd||!isFinite(hwallFor1Usd)||hwallFor1Usd<=0) throw new Error("bad quote");
    return 1/hwallFor1Usd; // $ per HWALL
  }catch{ return null; }
}
const SNAP_KEY="hwall_grandfather_units";
function readGrandfatherUnits(){ const s=localStorage.getItem(SNAP_KEY); return s?parseFloat(s):null; }
function writeGrandfatherUnits(units){ localStorage.setItem(SNAP_KEY,String(units)); }

async function checkUsdGate(balanceBigInt, decimals){
  if(balanceBigInt==null) return {ok:false, reason:"no-balance"};
  const units=Number(balanceBigInt)/10**decimals;

  // grandfather rule
  const snap=readGrandfatherUnits();
  if(snap!=null && units>=snap) return {ok:true, reason:"grandfather"};

  let price=await fetchUsdPriceVia0x(TOKEN_ADDRESS, TOKEN_DECIMALS);
  if(price==null) price=getManualPriceUsd();
  if(price==null) return {ok:false, reason:"no-price"};

  const usd=units*price;
  const ok=usd>=MIN_HOLD_USD;
  if(ok && snap==null) writeGrandfatherUnits(units);
  return {ok, reason: ok?"usd-ok":"usd-insufficient", usd};
}

/* —— Buy landing (two-line contract, NO copy button) —— */
function ContractStat(){
  const addr = TOKEN_ADDRESS;
  const part1 = addr.slice(0, 22);
  const part2 = addr.slice(22);
  return (
    <div style={{ padding:"10px 12px", borderRadius:12, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", color:"#e6e7ea" }}>
      <div style={{ fontSize:12, opacity:.75 }}>Contract</div>
      <div style={{ fontWeight:800, fontSize:16, fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace", lineHeight:1.2, marginTop:2 }}>
        <div>{part1}</div>
        <div>{part2}</div>
      </div>
    </div>
  );
}
function BuyLanding({ onClose, onBuyExternal, onBuyWithWallet, stats }){
  const Section = ({id, title, children}) => (
    <section id={id} style={{ padding:"26px 0", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
      <h2 style={{ color:"#fff", fontSize:22, fontWeight:800, margin:"0 0 10px" }}>{title}</h2>
      <div style={{ color:"#cfd2d8", lineHeight:1.7, fontSize:15 }}>{children}</div>
    </section>
  );
  const Stat = (label, value) => (
    <div style={{ padding:"10px 12px", borderRadius:12, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", color:"#e6e7ea" }}>
      <div style={{ fontSize:12, opacity:.75 }}>{label}</div>
      <div style={{ fontWeight:800, fontSize:16, wordBreak:"break-word", overflowWrap:"anywhere" }}>{value}</div>
    </div>
  );
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(10,12,18,.96)", zIndex:10000, display:"grid", gridTemplateRows:"auto 1fr", overflow:"hidden", backdropFilter:"blur(6px)" }}
         onPointerDown={(e)=>e.stopPropagation()} onClick={(e)=>e.stopPropagation()}>
      <div style={{ position:"sticky", top:0, zIndex:2, backdropFilter:"blur(8px)", background:"rgba(15,18,28,.85)", borderBottom:"1px solid rgba(255,255,255,.08)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"10px 16px" }}>
          <div style={{ display:"flex", gap:12, alignItems:"center", color:"#fff", fontWeight:800 }}>
            <span style={{ fontSize:18 }}>Buy HWALL</span>
            <nav style={{ display:"flex", gap:12, fontSize:13, opacity:.9 }}>
              <a href="#utilities" style={navLinkStyle}>Utilities</a>
              <a href="#tokenomics" style={navLinkStyle}>Tokenomics</a>
              <a href="#how" style={navLinkStyle}>How to Buy</a>
              <a href="#roadmap" style={navLinkStyle}>Roadmap</a>
              <a href="#faq" style={navLinkStyle}>FAQ</a>
              <a href="#legal" style={navLinkStyle}>Legal</a>
            </nav>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button style={ctaBtn} onClick={onBuyExternal}>Go to Buy Page</button>
            <button style={ctaBtn} onClick={onBuyWithWallet}>Buy with Wallet</button>
            <button style={closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>
      </div>
      <div style={{ overflowY:"auto", padding:"0 16px" }}>
        <div style={{ padding:"22px 0 10px" }}>
          <h1 style={{ color:"#fff", margin:"0 0 6px", fontSize:28, fontWeight:900 }}>HelloWall (HWALL) — Token Details</h1>
          <p style={{ color:"#cfd2d8", margin:"0 0 12px", maxWidth:840, lineHeight:1.7 }}>
            Hold HWALL to post freely on the main wall, unlock creator walls, claim ad slots, and vote on features. Built on Polygon.
          </p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button style={ctaBtn} onClick={onBuyWithWallet}>Buy with Wallet</button>
            <button style={ctaBtn} onClick={onBuyExternal}>Open Full Buy Page</button>
          </div>
        </div>

        <div style={{ display:"grid", gap:10, gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", margin:"14px 0 8px" }}>
          {Stat("Total Supply", stats.totalSupply)}
          {Stat("Sold", stats.sold)}
          {Stat("Available", stats.available)}
          {Stat("Chain", "Polygon")}
          <ContractStat />
          {Stat("Decimals", String(TOKEN_DECIMALS))}
        </div>

        <Section id="utilities" title="Utilities">
          <ul>
            <li>Post freely after holding minimum ~${MIN_HOLD_USD} of HWALL</li>
            <li>Priority placement & creator-wall eligibility</li>
            <li>Ad slots with phased revenue share</li>
            <li>Community votes for features & roadmap</li>
          </ul>
        </Section>
        <Section id="tokenomics" title="Tokenomics">
          <ul>
            <li>Fixed supply with community-first allocation</li>
            <li>Gradual unlock schedule for team & treasury</li>
            <li>Transparent on-chain accounting</li>
          </ul>
        </Section>
        <Section id="how" title="How to Buy">
          <ol>
            <li>Connect your wallet (MetaMask or compatible) on Polygon.</li>
            <li>Fund with MATIC/POL for gas.</li>
            <li>Use “Buy with Wallet” or open the external Buy page.</li>
            <li>Hold at least ≈ ${MIN_HOLD_USD} of HWALL to unlock unlimited posting.</li>
          </ol>
          <div style={{ display:"flex", gap:10, marginTop:8, flexWrap:"wrap" }}>
            <button style={ctaBtn} onClick={onBuyWithWallet}>Buy with Wallet</button>
            <button style={ctaBtn} onClick={onBuyExternal}>Open Full Buy Page</button>
          </div>
        </Section>
        <Section id="roadmap" title="Roadmap">
          <ul>
            <li>Phase 1 — Public wall, wallet gating, basic ads</li>
            <li>Phase 2 — Creator walls, referrals, revenue share</li>
            <li>Phase 3 — Mobile apps, on-chain reputation, staking</li>
          </ul>
        </Section>
        <Section id="faq" title="FAQ">
          <p><b>Is this financial advice?</b> No. Tokens are volatile; do your own research.</p>
          <p><b>Minimum to post?</b> One post is free; after that, hold ≈ ${MIN_HOLD_USD} of HWALL (grandfathered if you keep your qualifying amount).</p>
        </Section>
        <Section id="legal" title="Legal">
          <p style={{ opacity:.9 }}>Information only — not investment advice. Ensure compliance with your local regulations.</p>
        </Section>
        <div style={{ height:24 }} />
      </div>
    </div>
  );
}

/* ——— Main page ——— */
export default function HomePage(){
  const [vp,setVp]=useState({w:innerWidth,h:innerHeight});
  const [selected,setSelected]=useState(null);
  const [account,setAccount]=useState(null);
  const [balance,setBalance]=useState(null); // BigInt
  const [showLanding,setShowLanding]=useState(false);
  const [sold,setSold]=useState(INITIAL_SOLD);

  const cam=useRef({x:WORLD/2-innerWidth/2,y:WORLD/2-innerHeight/2});
  const userIdRef=useRef(getClientId());
  const likedSetRef=useRef(loadUserLikes(userIdRef.current));
  const followedAuthorsRef=useRef(new Set());

  // demo 500
  const initial = useMemo(() => {
    const names = generateNames(500);
    const thoughts = generateThoughts(500);
    const out = [];
    for (let i=0;i<500;i++){
      const name = names[i];
      const text = limitThought(thoughts[i]);
      const vx=(Math.random()-.5)*0.4, vy=(Math.random()-.5)*0.4;
      out.push({
        id:i,
        author:{ name, avatarUrl: avatarDataUrl(name), followers: 300 + ((Math.random()*4500)|0) },
        text, likes: (Math.random()*12)|0,
        x: Math.random()*WORLD, y: Math.random()*WORLD,
        vx, vy, pvx:vx, pvy:vy, frozen:false, z:1,
      });
    }
    return out;
  }, []);
  const stateRef=useRef(initial);
  const [,force]=useState(0);

  useEffect(()=>{ const r=()=>setVp({w:innerWidth,h:innerHeight}); addEventListener("resize",r); return()=>removeEventListener("resize",r); },[]);

  const freeze=(c)=>{ if(!c.frozen){ c.pvx=c.vx; c.pvy=c.vy; c.vx=0; c.vy=0; c.frozen=true; } };
  const resume=(c,nudge=true)=>{ if(c.frozen){ let {pvx,pvy}=c; if(nudge&&Math.hypot(pvx,pvy)<.01){ pvx=(Math.random()-.5)*.25; pvy=(Math.random()-.5)*.25; } c.vx=pvx; c.vy=pvy; c.frozen=false; } };

  useEffect(()=>{ let raf=0; const step=()=>{ const arr=stateRef.current;
    for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){ const a=arr[i],b=arr[j];
      const dx=(a.x + CARD_W/2) - (b.x + CARD_W/2), dy=(a.y + CARD_H/2) - (b.y + CARD_H/2);
      const d2=dx*dx+dy*dy; if(!d2)continue; const d=Math.sqrt(d2);
      if(d<REPULSE_DIST){ const ux=dx/d, uy=dy/d, k=(1-d/REPULSE_DIST)*REPULSE_K; a.vx+=ux*k; a.vy+=uy*k; b.vx-=ux*k; b.vy-=uy*k; }
    }
    for(const c of arr){ if(dragRef.current.id===c.id||c.frozen) continue;
      const s=Math.hypot(c.vx,c.vy); if(s>SPEED_MAX){ c.vx=(c.vx/s)*SPEED_MAX; c.vy=(c.vy/s)*SPEED_MAX; }
      c.x+=c.vx; c.y+=c.vy; if(c.x<0)c.x+=WORLD; if(c.y<0)c.y+=WORLD; if(c.x>=WORLD)c.x-=WORLD; if(c.y>=WORLD)c.y-=WORLD;
    }
    force(t=>(t+1)%100000); raf=requestAnimationFrame(step); }; raf=requestAnimationFrame(step); return()=>cancelAnimationFrame(raf); },[]);

  const panRef=useRef({dragging:false,startX:0,startY:0,startCamX:0,startCamY:0,moved:false});
  const onBGPointerDown=(e)=>{ if(dragRef.current.id!=null)return;
    const x=e.clientX??e.touches?.[0]?.clientX, y=e.clientY??e.touches?.[0]?.clientY; if(x==null||y==null)return;
    panRef.current={dragging:true,startX:x,startY:y,startCamX:cam.current.x,startCamY:cam.current.y,moved:false};
    document.body.style.cursor="grabbing";
  };
  const onBGPointerMove=(e)=>{ if(!panRef.current.dragging)return;
    const x=e.clientX??e.touches?.[0]?.clientX, y=e.clientY??e.touches?.[0]?.clientY; if(x==null||y==null)return;
    const dx=x-panRef.current.startX, dy=y-panRef.current.startY;
    if(!panRef.current.moved && Math.hypot(dx,dy)>PAN_THRESHOLD) panRef.current.moved=true;
    cam.current.x=wrap(panRef.current.startCamX-dx,0,WORLD); cam.current.y=wrap(panRef.current.startCamY-dy,0,WORLD);
    force(t=>t+1);
  };
  const onBGPointerUp=()=>{ panRef.current.dragging=false; document.body.style.cursor="default"; };
  const onWheel=(e)=>{ cam.current.x=wrap(cam.current.x+e.deltaX,0,WORLD); cam.current.y=wrap(cam.current.y+e.deltaY,0,WORLD); force(t=>t+1); };

  const dragRef=useRef({id:null,startX:0,startY:0,startWorldX:0,startWorldY:0,moved:false});
  const startCardDrag=(e,card)=>{ e.stopPropagation();
    const x=e.clientX??e.touches?.[0]?.clientX, y=e.clientY??e.touches?.[0]?.clientY; if(x==null||y==null)return;
    const worldX=cam.current.x+x, worldY=cam.current.y+y; freeze(card);
    dragRef.current={id:card.id,startX:x,startY:y,startWorldX:worldX-card.x,startWorldY:worldY-card.y,moved:false};
    card.z=20; document.body.style.cursor="grabbing";
  };
  const onGlobalPointerMove=(e)=>{ if(dragRef.current.id!=null){
      const card=stateRef.current.find(c=>c.id===dragRef.current.id); if(!card)return;
      const x=e.clientX??e.touches?.[0]?.clientX, y=e.clientY??e.touches?.[0]?.clientY; if(x==null||y==null)return;
      const dx=x-dragRef.current.startX, dy=y-dragRef.current.startY;
      if(!dragRef.current.moved && Math.hypot(dx,dy)>PAN_THRESHOLD) dragRef.current.moved=true;
      const worldX=cam.current.x+x, worldY=cam.current.y+y;
      card.x=wrap(worldX-dragRef.current.startWorldX,0,WORLD);
      card.y=wrap(worldY-dragRef.current.startWorldY,0,WORLD);
      force(t=>t+1); return;
    }
    if(panRef.current.dragging) onBGPointerMove(e);
  };
  const endAnyDrag=()=>{ if(dragRef.current.id!=null){ const card=stateRef.current.find(c=>c.id===dragRef.current.id); if(card){ card.z=1; resume(card,true);} dragRef.current.id=null; }
    if(panRef.current.dragging) panRef.current.dragging=false; document.body.style.cursor="default";
  };

  const clickCard=(card)=>{ if(dragRef.current.moved||panRef.current.moved) return; setSelected(card); };
  const sx=(x)=>x-cam.current.x, sy=(y)=>y-cam.current.y;

  const isLiked=(id)=>likedSetRef.current.has(id);
  const toggleLike=(id)=>{ const c=stateRef.current.find(x=>x.id===id); if(!c) return;
    if(likedSetRef.current.has(id)){ likedSetRef.current.delete(id); c.likes=Math.max(0,(c.likes||0)-1); }
    else { likedSetRef.current.add(id); c.likes=(c.likes||0)+1; }
    saveUserLikes(userIdRef.current, likedSetRef.current); force(t=>t+1);
  };
  const isFollowingAuthor=(name)=>followedAuthorsRef.current.has(name);
  const toggleFollowAuthor=(name)=>{ const set=followedAuthorsRef.current, arr=stateRef.current;
    if(set.has(name)){ set.delete(name); for(const c of arr) if(c.author.name===name){ c.author.followers=Math.max(0,c.author.followers-1);} }
    else { set.add(name); for(const c of arr) if(c.author.name===name){ c.author.followers+=1;} }
    force(t=>t+1);
  };
  const share=(card)=>{ const text=`${card.author.name} on HelloWall: "${card.text}"`, url=location.href;
    if(navigator.share) navigator.share({title:"HelloWall",text,url}).catch(()=>{});
    else { navigator.clipboard?.writeText(`${text} ${url}`); alert("Link copied"); }
  };

  const refreshBalance = async (addr) => {
    if (addr && TOKEN_ADDRESS.startsWith("0x") && TOKEN_ADDRESS.length === 42) {
      try { const b = await readErc20Balance(window.ethereum, TOKEN_ADDRESS, addr); setBalance(b); }
      catch { setBalance(null); }
    }
  };

  const handleAddThought = async () => {
    const KEY="hwall_free_thought_used";
    const usedOnce = localStorage.getItem(KEY) === "1";

    if (!account) {
      const ok = confirm(usedOnce ? "Connect your wallet to continue?" : "You get 1 free thought. Connect wallet now?");
      if (ok) await handleWalletClick();
    }
    if (account && balance == null) { try { await refreshBalance(account); } catch {} }

    if (usedOnce) {
      const gate = await checkUsdGate(balance, TOKEN_DECIMALS);
      if (!gate.ok) {
        if (gate.reason === "no-price") {
          alert("Price lookup failed. Admin can run in console:\nwindow.setHwallPriceUsd(0.02)");
        } else if (gate.reason === "usd-insufficient") {
          alert(`You need at least ~$${MIN_HOLD_USD} of HWALL to post more.`);
        } else {
          alert("You don't meet the posting requirement yet.");
        }
        setShowLanding(true);
        return;
      }
    }

    const raw = window.prompt(`Write your thought (max ${THOUGHT_LIMIT} chars):`, "");
    if (!raw) return;
    const t = limitThought(raw.trim());
    if (!t) return;

    const arr = stateRef.current;
    const id = (arr.length ? arr[arr.length-1].id+1 : 0) + Math.floor(Math.random()*1000);
    const you = {
      id,
      author:{ name: account ? shorten(account) : "You", avatarUrl: avatarDataUrl(account || "you"), followers: 0 },
      text: t,
      likes: 0,
      x: cam.current.x + vp.w/2 - CARD_W/2,
      y: cam.current.y + vp.h/2 - CARD_H/2,
      vx:(Math.random()-.5)*.25, vy:(Math.random()-.5)*.25, pvx:0, pvy:0, frozen:false, z:2
    };
    arr.push(you); force(n=>n+1); setSelected(you);
    if (!usedOnce) localStorage.setItem(KEY, "1");
  };

  // Connect ⇄ Disconnect toggle
  const handleWalletClick = async () => {
    if (account) { setAccount(null); setBalance(null); alert("Wallet disconnected for this session."); return; }
    try {
      if (!window.ethereum) { alert("No wallet found. Please install MetaMask."); return; }
      const accts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const addr = accts?.[0] || null;
      setAccount(addr);
      if (addr) await refreshBalance(addr);
    } catch { alert("Wallet connection cancelled."); }
  };

  const openLanding = () => setShowLanding(true);

  // hide stray Buy buttons not in our dock
  useEffect(() => {
    const hide = () => {
      const dock = document.getElementById("hud-dock");
      document.querySelectorAll('button,a,[role="button"]').forEach(el=>{
        const txt=(el.textContent||"").trim().toLowerCase();
        if (txt==="buy hwall" && (!dock || !dock.contains(el))) {
          el.style.display="none"; el.style.visibility="hidden";
        }
      });
    };
    hide(); const mo=new MutationObserver(hide); mo.observe(document.body,{childList:true,subtree:true}); return()=>mo.disconnect();
  }, []);

  return (
    <div
      style={{ position:"relative", width:"100vw", height:"100vh", overflow:"hidden", background:"#0b0f19", touchAction:"none" }}
      onPointerDown={onBGPointerDown} onPointerMove={onGlobalPointerMove}
      onPointerUp={endAnyDrag} onPointerCancel={endAnyDrag} onWheel={onWheel}
    >
      {/* Unified dock */}
      <div id="hud-dock"
           style={{ position:"fixed", right:16, bottom:16, display:"flex", gap:12, zIndex:9999, alignItems:"center" }}
           onPointerDown={(e)=>e.stopPropagation()} onClick={(e)=>e.stopPropagation()}>
        <button type="button" style={ctaBtn} onClick={handleAddThought}>+ thought</button>
        <button type="button" style={ctaBtn} onClick={handleWalletClick}>
          {account ? `Connected: ${shorten(account)}` : "+ wallet"}
        </button>
        <button type="button" style={ctaBtn} onClick={openLanding}>Buy HWALL</button>
      </div>

      {/* 3x3 tiles → infinite pan */}
      {([0,-WORLD,+WORLD]).flatMap(tx=>([0,-WORLD,+WORLD]).map(ty=>{
        const ox=tx, oy=ty;
        return (
          <div key={`${tx},${ty}`} style={{ position:"absolute", inset:0 }}>
            {stateRef.current.map((p)=>{
              const left = p.x - cam.current.x + ox;
              const top  = p.y - cam.current.y + oy;
              if (left < -CARD_W-400 || left > vp.w+400 || top < -CARD_H-400 || top > vp.h+400) return null;

              const following=isFollowingAuthor(p.author.name);
              const cols = following ? neonColorsFor(p.author.name) : null;

              return (
                <div key={`${p.id}-${tx}-${ty}`}
                  onPointerDown={(e)=>startCardDrag(e,p)}
                  onClick={()=>clickCard(p)}
                  onMouseEnter={()=>{freeze(p); p.z=10;}}
                  onMouseLeave={()=>{ if(dragRef.current.id!==p.id){ p.z=1; resume(p,false); } }}
                  style={{
                    position:"absolute", left, top, width: CARD_W, padding:12, borderRadius:16,
                    backgroundColor:"rgba(255,255,255,.06)", backdropFilter:"blur(6px)",
                    backgroundImage: following ? `linear-gradient(0deg, ${cols.tint}, ${cols.tint})` : "none",
                    backgroundBlendMode: following ? "screen" : "normal",
                    border: following ? `2px solid ${cols.border}` : "1px solid rgba(255,255,255,.1)",
                    boxShadow: following
                      ? `0 0 0 1px ${cols.border}, 0 0 18px ${cols.glow}, 0 12px 38px rgba(0,0,0,.35)`
                      : "0 10px 30px rgba(0,0,0,.25)",
                    color:"#e6e7ea", cursor:(dragRef.current.id===p.id||panRef.current.dragging)?"grabbing":"grab", zIndex:p.z, userSelect:"none"
                  }}
                >
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <img src={p.author.avatarUrl} alt={p.author.name} width={28} height={28}
                         style={{ borderRadius:"50%", border:"1px solid rgba(255,255,255,.15)" }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, color:"#fff" }}>{p.author.name}</div>
                      <div style={{ fontSize:12, opacity:.7 }}>{p.author.followers.toLocaleString()} followers</div>
                    </div>
                    <button onClick={(e)=>{e.stopPropagation(); toggleFollowAuthor(p.author.name);}} style={chip}>
                      {following ? "Following" : "Follow"}
                    </button>
                  </div>

                  <div style={{ marginTop:8, lineHeight:1.5 }}>{limitThought(p.text)}</div>

                  {/* bottom row — LIKE + SHARE only */}
                  <div style={{ marginTop:10, display:"flex", gap:10 }}>
                    <button onClick={(e)=>{e.stopPropagation(); toggleLike(p.id);}} style={chip}>
                      {isLiked(p.id) ? "❤️" : "🤍"} {p.likes}
                    </button>
                    <button onClick={(e)=>{e.stopPropagation(); share(p);}} style={chip}>Share</button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }))}

      {/* Side panel */}
      <SidePanel
        open={!!selected}
        card={selected}
        onClose={()=>setSelected(null)}
        onFollow={(id)=>{ const c=stateRef.current.find(x=>x.id===id); if(!c) return; toggleFollowAuthor(c.author.name); }}
        isFollowing={selected ? followedAuthorsRef.current.has(selected.author.name) : false}
        account={account}
      />

      {/* Buy landing overlay */}
      {showLanding && (
        <BuyLanding
          onClose={()=>setShowLanding(false)}
          onBuyExternal={()=>window.open(EXTERNAL_BUY_LINK, "_blank", "noopener,noreferrer")}
          onBuyWithWallet={()=>window.open(EXTERNAL_BUY_LINK, "_blank", "noopener,noreferrer")}
          stats={{
            totalSupply: TOTAL_SUPPLY.toLocaleString(),
            sold: sold.toLocaleString(),
            available: (TOTAL_SUPPLY - sold).toLocaleString()
          }}
        />
      )}
    </div>
  );
}
