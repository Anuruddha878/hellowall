set -euo pipefail

# 0) Install Tailwind + PostCSS + line-clamp plugin (for "line-clamp-3")
npm i -D tailwindcss postcss autoprefixer @tailwindcss/line-clamp

# 1) Init Tailwind/PostCSS (creates tailwind.config.js + postcss.config.js if missing)
npx tailwindcss init -p

# 2) Configure Tailwind content paths + plugin
cat > tailwind.config.js <<'JS'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/line-clamp')],
}
JS

# 3) Ensure src folder exists
mkdir -p src

# 4) Tailwind entry CSS (overwrites src/index.css)
cat > src/index.css <<'CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Small helper so your fade-in class works in plain CSS */
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
.animate-fadeIn { animation: fadeIn .25s ease-out }

/* Optional: backdrop polish for nicer glass look */
.backdrop-blur { backdrop-filter: blur(8px); }
.backdrop-blur-xl { backdrop-filter: blur(16px); }
CSS

# 5) Ensure main.jsx mounts the app (creates/overwrites)
cat > src/main.jsx <<'JSX'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
JSX

# 6) Write your EXACT App.jsx
cat > src/App.jsx <<'JSX'
import React, { useEffect, useMemo, useRef, useState } from "react";

// Hellowall — Previewable App (live Thoughts + Get Coins)
// Your layout, merged with the stable ThoughtsBoard (pan, drag, panel, share)
// + slower drift and a speed slider so "time" moves gently.

const shorten = (addr) => (addr ? addr.slice(0, 6) + "…" + addr.slice(-4) : "");

export default function App() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [hasHWALL, setHasHWALL] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [sold, setSold] = useState(128000);
  const price = 0.05; // MATIC per HWALL (demo)
  const minPurchase = 100;
  const [showStore, setShowStore] = useState(false);

  // read referral code from URL once
  useEffect(() => {
    const u = new URL(window.location.href);
    const ref = u.searchParams.get("ref");
    if (ref) localStorage.setItem("ref_by", ref);
  }, []);

  const hasEthereum = () => typeof window !== "undefined" && window.ethereum;

  const connectWallet = async () => {
    try {
      if (!hasEthereum()) {
        alert("No wallet found. Please install MetaMask.");
        return;
      }
      const [acc] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const cid = await window.ethereum.request({ method: "eth_chainId" });
      setAccount(acc);
      setChainId(cid);
    } catch (e) {
      alert(e?.message || "Failed to connect");
    }
  };

  // when a user buys, mark hasHWALL and reward referrer if any
  const handlePurchased = (amount) => {
    setHasHWALL(true);
    setSold((s) => s + amount);
    const ref = localStorage.getItem("ref_by");
    if (ref && (!account || ref.toLowerCase() !== account.toLowerCase())) {
      const key = `earnings_${ref.toLowerCase()}`;
      const reward = Math.round(amount * 0.1);
      const prev = Number(localStorage.getItem(key) || 0);
      localStorage.setItem(key, String(prev + reward));
      if (account && ref.toLowerCase() === account.toLowerCase()) setCoinsEarned(prev + reward);
    }
  };

  useEffect(() => {
    if (!account) return;
    const key = `earnings_${account.toLowerCase()}`;
    setCoinsEarned(Number(localStorage.getItem(key) || 0));
  }, [account]);

  return (
    <div className="h-full w-full overflow-hidden bg-slate-900 text-white relative">
      {showStore ? (
        <GetCoinsPage
          sold={sold}
          price={price}
          minPurchase={minPurchase}
          account={account}
          chainId={chainId}
          onConnect={connectWallet}
          onBuy={handlePurchased}
          coinsEarned={coinsEarned}
          onClose={() => setShowStore(false)}
        />
      ) : (
        <>
          <ThoughtsBoard
            hasHWALL={hasHWALL}
            account={account}
            onGetCoins={() => setShowStore(true)}
            onConnect={connectWallet}
          />
          <button
            onClick={() => setShowStore(true)}
            className="fixed bottom-4 right-4 z-[10002] px-4 py-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 hover:bg-emerald-300/15 text-emerald-200 text-sm shadow-lg backdrop-blur"
          >
            Get Coins
          </button>
        </>
      )}

      <style>{`
        html, body, #root { height: 100%; }
        @keyframes fadeIn { from {opacity: 0} to {opacity: 1} }
        .animate-fadeIn { animation: fadeIn .25s ease-out }
      `}</style>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// GET COINS PAGE (demo)
// ───────────────────────────────────────────────────────────────────────────────
function GetCoinsPage({ sold, price, minPurchase, account, chainId, onConnect, onBuy, onClose, coinsEarned }) {
  const [amount, setAmount] = useState(minPurchase);
  const totalCost = useMemo(() => (amount || 0) * price, [amount, price]);

  const doBuy = () => {
    if (!account) {
      onConnect?.();
      return;
    }
    if ((amount | 0) < minPurchase) {
      alert(`Minimum purchase is ${minPurchase} HWALL`);
      return;
    }
    onBuy?.(amount | 0);
    alert(`Purchased ${amount | 0} HWALL (demo).`);
    setAmount(minPurchase);
  };

  return (
    <div className="absolute inset-0 z-[9998] bg-slate-950/80 backdrop-blur">
      <div className="absolute inset-0 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-slate-950/70 backdrop-blur border-b border-white/10">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <h2 className="text-lg font-semibold">Buy HWALL</h2>
            <button onClick={onClose} className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 hover:bg-white/15">✕</button>
          </div>
        </div>

        <section className="mx-auto grid max-w-5xl gap-4 px-4 pt-6 pb-4 md:grid-cols-3">
          <MetricCard label="Sold" value={`${sold.toLocaleString()} HWALL`} />
          <MetricCard label="Price" value={`${price} MATIC`} />
          <MetricCard label="Minimum Purchase" value={`${minPurchase} HWALL`} />
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-8">
          <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <h3 className="text-lg font-semibold">Get HWALL</h3>
              <p className="text-sm text-slate-300">Connect your wallet and choose how many coins to buy. Minimum is {minPurchase}.</p>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="number"
                  min={minPurchase}
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))}
                  className="w-40 rounded-lg border border-white/10 bg-slate-900 px-3 py-2"
                />
                <span className="text-sm text-slate-300">HWALL</span>
              </div>
              <div className="text-xs text-slate-400">You pay ~ {totalCost} MATIC</div>
            </div>
            <div className="self-end space-y-2">
              {!account ? (
                <button onClick={onConnect} className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2 hover:bg-white/15">Connect Wallet</button>
              ) : (
                <div className="text-xs text-slate-300">Connected: {shorten(account)} · Chain: {chainId}</div>
              )}
              <button
                onClick={doBuy}
                className="w-full rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-emerald-200 hover:bg-emerald-300/15"
              >
                Buy
              </button>
              <div className="text-[11px] text-slate-400">Demo only — replace with on-chain purchase later.</div>
              <div className="text-[11px] text-slate-300">Your earned HWALL (demo): <span className="font-semibold text-white/90">{coinsEarned}</span></div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-8 md:grid-cols-3">
          <DocCard title="Whitepaper" desc="Read the full vision, tokenomics, utilities, and roadmap." action="Read Whitepaper" />
          <DocCard title="Token Contract" desc="View contract address and basic details." action="View Contract" />
          <DocCard title="Audit & KYC" desc="3rd-party code audit / team verification (coming soon)." action="Audit Status" />
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-10">
          <h3 className="mb-3 text-lg font-semibold">Tokenomics</h3>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Total Supply: 1,000,000 HWALL</li>
              <li>• Initial Liquidity: 20%</li>
              <li>• Community Rewards & Airdrops: 25%</li>
              <li>• Team (24-month vesting): 15%</li>
              <li>• Ecosystem Grants: 20%</li>
              <li>• Treasury/Reserve: 20%</li>
            </ul>
            <div className="mt-4 h-3 overflow-hidden rounded-lg border border-white/10">
              <div className="h-full bg-emerald-400/60" style={{ width: "20%" }} />
              <div className="h-full bg-cyan-400/60" style={{ width: "25%" }} />
              <div className="h-full bg-fuchsia-400/60" style={{ width: "15%" }} />
              <div className="h-full bg-amber-400/60" style={{ width: "20%" }} />
              <div className="h-full bg-slate-300/60" style={{ width: "20%" }} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-10">
          <h3 className="mb-3 text-lg font-semibold">Roadmap</h3>
          <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
            {[
              ["Q4 2025", "Launch HWALL token • Referral share-to-earn • Hellowall MVP"],
              ["Q1 2026", "Creator tools • Voice notes • Basic marketplace"],
              ["Q2 2026", "Mobile apps • Governance v1 • Staking (research)"],
              ["Q3 2026", "Exchange listings • Grants program • Audit"],
            ].map(([title, items], i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
                <div className="text-sm font-semibold">{title}</div>
                <div className="mt-1 text-xs text-slate-300">{items}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16">
          <h3 className="mb-3 text-lg font-semibold">FAQ</h3>
          <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
            {[
              [
                "How do I earn by sharing?",
                "Connect your wallet, buy HWALL, then share from any thought. Your link includes your wallet address; when someone buys via your link you earn a small bounty (demo only).",
              ],
              ["What networks are supported?", "Currently Polygon (demo). Multi-chain support is planned."],
              ["Is there an audit?", "Audit is planned post-MVP. The code will be open-sourced before a formal audit."],
              ["What is the minimum purchase?", `The minimum is ${minPurchase} HWALL (demo).`],
            ].map(([q, a], i) => (
              <details key={i} className="px-4 py-3">
                <summary className="cursor-pointer text-sm text-white/90">{q}</summary>
                <p className="mt-2 text-sm text-slate-300">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 pb-16 text-xs text-slate-400">
          <div className="border-t border-white/10 pt-4">
            <span>HWALL © 2025</span>
            <a className="ml-3 underline hover:no-underline" href="#">Docs</a>
            <a className="ml-3 underline hover:no-underline" href="#">Terms</a>
            <a className="ml-3 underline hover:no-underline" href="#">Privacy</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-slate-300">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function DocCard({ title, desc, action }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-1 text-sm font-semibold">{title}</div>
      <div className="mb-3 text-xs text-slate-300">{desc}</div>
      <button className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs hover:bg-white/15">{action}</button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// THOUGHTS BOARD (stable + slower drift)
// ───────────────────────────────────────────────────────────────────────────────
function ThoughtsBoard({ onGetCoins, onConnect, hasHWALL, account }) {
  const WORLD = 6000;
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [eligible, setEligible] = useState(false);
  const [speed, setSpeed] = useState(12); // px/s — tweak here
  const followingRef = useRef(new Set(JSON.parse(localStorage.getItem("following_authors") || "[]")));

  const containerRef = useRef(null);
  const cardDragRef = useRef(null); // { id, pointerId, x0,y0,left0,top0, moved }
  const stageDragRef = useRef(null); // { pointerId, x0,y0,c0:{x,y}, started }
  const dragSuppressRef = useRef({ id: null, until: 0 }); // suppress click-after-drag

  useEffect(() => { setEligible(Boolean(account && hasHWALL)); }, [account, hasHWALL]);

  // Seed demo posts
  useEffect(() => {
    const rnd = (n) => Math.floor(Math.random() * n);
    const names = ["Ava", "Liam", "Noah", "Mia", "Ethan", "Zara", "Kai", "Lola"]; 
    const texts = [
      "Thinking about building something new…",
      "What if thoughts could float like bubbles?",
      "Voicemail: a wild idea from the bus.",
      "Tiny wins — share one! 🎯",
      "How do people discover light ideas?",
      "Sketching a dream, shipping a draft.",
      "Today I learned: shipping beats perfect.",
    ];
    const makePost = (i) => ({
      id: "post_" + i,
      author: {
        name: names[rnd(names.length)],
        avatar: `https://api.dicebear.com/8.x/personas/svg?seed=${encodeURIComponent(names[i % names.length])}`,
        followers: 100 + rnd(4900),
      },
      text: texts[rnd(texts.length)],
      position: { left: Math.random() * WORLD, top: Math.random() * WORLD },
      vx: (Math.random() - 0.5) * speed, // px/s
      vy: (Math.random() - 0.5) * speed, // px/s
      reactions: { "❤️": 0, "😂": 0, "😮": 0, "😢": 0, "🔥": 0 },
      myReact: null,
    });
    setPosts(Array.from({ length: 80 }, (_, i) => makePost(i + 1)));
  }, [speed]);

  // Camera
  const [cam, setCam] = useState(() => ({ x: WORLD / 2 - window.innerWidth / 2, y: WORLD / 2 - window.innerHeight / 2 }));

  // Time-based drift (slower + clamp speed)
  useEffect(() => {
    let raf = 0, lastTs = 0;
    const center = { x: WORLD / 2, y: WORLD / 2 };
    const step = (ts) => {
      if (!lastTs) lastTs = ts;
      let dt = (ts - lastTs) / 1000; // seconds
      lastTs = ts;
      dt = Math.min(Math.max(dt, 0), 0.05);

      setPosts((prev) => prev.map((p) => {
        let { left, top } = p.position;
        let { vx = 0, vy = 0 } = p;
        if (followingRef.current.has(p.author.name)) {
          const ax = (center.x - left) * 0.012; const ay = (center.y - top) * 0.012; vx += ax * dt; vy += ay * dt;
        }
        left += vx * dt; top += vy * dt;
        if (left < 0) left += WORLD; if (left > WORLD) left -= WORLD; if (top < 0) top += WORLD; if (top > WORLD) top -= WORLD;
        const max = followingRef.current.has(p.author.name) ? speed * 1.2 : speed; const sp = Math.hypot(vx, vy); if (sp > max) { const k = max / (sp || 1); vx *= k; vy *= k; }
        return { ...p, position: { left, top }, vx, vy };
      }));

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  // Global pointer pan/drag with threshold & infinite wrap
  useEffect(() => {
    const el = containerRef.current; if (!el) return; el.style.touchAction = "none";
    const PAN_THRESHOLD = 8;

    const onPointerDown = (e) => {
      const target = e.target;
      const interactiveEl = target.closest?.('button, a, [role="button"], input, textarea, select, summary');
      const isInteractive = !!(interactiveEl && !(target.closest?.('.hw-card')?.isSameNode?.(interactiveEl)));
      const inPanel = !!target.closest?.('.rpanel, .share-modal');
      if (inPanel) return;
      const cardEl = target.closest?.('.hw-card');

      // If pointer starts on a button/link inside a card, DO NOTHING — let it click normally
      if (cardEl && isInteractive) return;

      // Card drag (only if started on card body, not controls)
      if (cardEl && !isInteractive) {
        const id = cardEl.getAttribute('data-id');
        const card = posts.find((p) => p.id === id);
        if (card) {
          cardEl.setPointerCapture?.(e.pointerId);
          el.setPointerCapture?.(e.pointerId);
          cardDragRef.current = { id, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, left0: card.position.left, top0: card.position.top, moved: false };
          return;
        }
      }

      // Stage pan (only if not on any card)
      if (!cardEl) {
        el.setPointerCapture?.(e.pointerId);
        stageDragRef.current = { pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, c0: { ...cam }, started: false };
      }
    };

    const onPointerMove = (e) => {
      if (cardDragRef.current && cardDragRef.current.pointerId === e.pointerId) {
        const d = cardDragRef.current; const dx = e.clientX - d.x0; const dy = e.clientY - d.y0;
        // increase drag threshold so light taps still open the panel
        if (!d.moved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) d.moved = true;
        const L = ((d.left0 + dx) % WORLD + WORLD) % WORLD; const T = ((d.top0 + dy) % WORLD + WORLD) % WORLD;
        setPosts((prev) => prev.map((p) => (p.id === d.id ? { ...p, position: { left: L, top: T } } : p)));
        return;
      }
      if (stageDragRef.current && stageDragRef.current.pointerId === e.pointerId) {
        const d = stageDragRef.current; const dx = e.clientX - d.x0; const dy = e.clientY - d.y0;
        if (!d.started) { if (Math.abs(dx) > PAN_THRESHOLD || Math.abs(dy) > PAN_THRESHOLD) d.started = true; else return; }
        setCam({ x: d.c0.x - dx, y: d.c0.y - dy });
      }
    };

    const onPointerUp = (e) => {
      if (cardDragRef.current && cardDragRef.current.pointerId === e.pointerId) {
        const d = cardDragRef.current;
        // Only suppress the click if it was actually a drag
        if (d.moved) {
          dragSuppressRef.current = { id: d.id, until: performance.now() + 300 };
        }
        cardDragRef.current = null;
        return;
      }
      if (stageDragRef.current && stageDragRef.current.pointerId === e.pointerId) { stageDragRef.current = null; }
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('lostpointercapture', onPointerUp);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('lostpointercapture', onPointerUp);
    };
  }, [posts, cam.x, cam.y]);

  // Wheel/trackpad pan
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const onWheel = (e) => { e.preventDefault(); setCam((c) => ({ x: c.x + e.deltaX, y: c.y + e.deltaY })); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const openReader = (post) => setSelectedPost(post);
  const toggleFollow = (name) => {
    const setObj = followingRef.current; const willFollow = !setObj.has(name);
    if (willFollow) setObj.add(name); else setObj.delete(name);
    localStorage.setItem("following_authors", JSON.stringify([...setObj]));
    setPosts((prev) => prev.map((p) => (p.author.name === name ? { ...p, author: { ...p.author, followers: Math.max(0, (p.author.followers || 0) + (willFollow ? 1 : -1)) } } : p)));
    if (selectedPost && selectedPost.author.name === name) setSelectedPost((sp) => sp ? { ...sp, author: { ...sp.author, followers: Math.max(0, (sp.author.followers || 0) + (willFollow ? 1 : -1)) } } : sp);
  };
  const handleReact = (postId, emo) => {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p; const reactions = { ...p.reactions }; let my = p.myReact;
      if (my === emo) { reactions[emo] = Math.max(0, (reactions[emo] || 0) - 1); my = null; }
      else { if (my) reactions[my] = Math.max(0, (reactions[my] || 0) - 1); reactions[emo] = (reactions[emo] || 0) + 1; my = emo; }
      const next = { ...p, reactions, myReact: my }; if (selectedPost && selectedPost.id === postId) setSelectedPost(next); return next;
    }));
  };
  const shareThought = (post) => setShareTarget(post);
  const shareLink = useMemo(() => { const base = `${location.origin}${location.pathname}`; return eligible && account ? `${base}?ref=${account}` : base; }, [eligible, account]);
  const shareTo = (platform, text) => {
    const url = encodeURIComponent(shareLink); const msg = encodeURIComponent(text);
    switch (platform) {
      case 'facebook': window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${msg}`, '_blank'); break;
      case 'whatsapp': window.open(`https://wa.me/?text=${msg}%20${url}`, '_blank'); break;
      case 'twitter': window.open(`https://twitter.com/intent/tweet?text=${msg}&url=${url}`, '_blank'); break;
      case 'telegram': window.open(`https://t.me/share/url?url=${url}&text=${msg}`, '_blank'); break;
      case 'reddit': window.open(`https://www.reddit.com/submit?url=${url}&title=${msg}`, '_blank'); break;
      case 'email': window.location.href = `mailto:?subject=Hellowall Thought&body=${msg}%0A${url}`; break;
      default: navigator.clipboard.writeText(`${text}
${shareLink}`);
    }
    setShareTarget(null);
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-slate-900" style={{ touchAction: 'none' }}>
      {/* header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between p-4">
        <h1 className="pointer-events-auto text-lg font-semibold text-slate-100">Live Thoughts — React 3d Wall (previewable)</h1>
        <div className="pointer-events-auto flex items-center gap-3 text-xs text-slate-400">
          <span>Drag / scroll to pan • Click a card to open</span>
          <label className="flex items-center gap-1">
            <span>Speed</span>
            <input type="range" min="4" max="24" step="1" value={speed} onChange={(e)=>setSpeed(parseInt(e.target.value,10))} />
          </label>
        </div>
      </div>

      {/* stage: 3x3 tiling for infinite effect */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{ width: WORLD * 3 + 'px', height: WORLD * 3 + 'px', transform: `translate3d(${-( (cam.x % WORLD + WORLD) % WORLD ) - WORLD}px, ${-( (cam.y % WORLD + WORLD) % WORLD ) - WORLD}px, 0px)` }}
      >
        {[-WORLD,0,WORLD].map(tx => (
          [-WORLD,0,WORLD].map(ty => (
            <div key={`tile-${tx}-${ty}`} style={{ position:'absolute', left: tx, top: ty }}>
              {posts.map((p) => {
                const followed = followingRef.current.has(p.author.name);
                const dragging = cardDragRef.current && cardDragRef.current.id === p.id;
                return (
                  <div
                    key={`${p.id}-${tx}-${ty}`}
                    data-id={p.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openReader(p);} }}
                    className={
                      "hw-card absolute select-none rounded-2xl border p-4 shadow-xl transition-transform backdrop-blur-md " +
                      (followed ? "bg-white/10 border-white/15 ring-1 ring-emerald-300/15" : "bg-white/6 border-white/12 hover:scale-[1.01]")
                    }
                    style={{ left: p.position.left, top: p.position.top, width: 480, minHeight: 140, zIndex: followed ? 30 : 10, cursor: dragging ? 'grabbing' : 'grab' }}
                    onClick={(e) => {
                      // ignore clicks that immediately follow a drag on this card
                      if (cardDragRef.current && cardDragRef.current.moved) return;
                      if (dragSuppressRef.current.id === p.id && performance.now() < dragSuppressRef.current.until) return;
                      openReader(p);
                    }}
                    onPointerDown={(e)=>{ // start drag on the card itself (prevent stage pan)
                      e.stopPropagation();
                      const id = e.currentTarget.getAttribute('data-id');
                      const card = posts.find(p=>p.id===id);
                      if(!card) return;
                      // capture on the card so we reliably get move/up
                      e.currentTarget.setPointerCapture?.(e.pointerId);
                      cardDragRef.current = {
                        id,
                        pointerId: e.pointerId,
                        x0: e.clientX,
                        y0: e.clientY,
                        left0: card.position.left,
                        top0: card.position.top,
                        moved: false
                      };
                    }}
                    onPointerUp={(e)=>{ // decide tap vs drag here for reliability
                      const d = cardDragRef.current;
                      if (!d || d.pointerId !== e.pointerId) return;
                      // release capture
                      e.currentTarget.releasePointerCapture?.(e.pointerId);
                      // if it was a drag, suppress click; if not, open
                      if (d.moved) {
                        dragSuppressRef.current = { id: d.id, until: performance.now() + 300 };
                      } else {
                        const post = posts.find(p=>p.id===d.id);
                        if (post) openReader(post);
                      }
                      cardDragRef.current = null;
                    }}
                  >
                    <div className="relative">
                      <div className="flex items-start gap-3">
                        <img src={p.author.avatar} className="h-10 w-10 rounded-full border-2 border-white/10" />
                        <div>
                          <div className="flex items-center gap-1 text-sm font-semibold text-white/95">
                            {p.author.name}
                            <span className="text-[10px] text-slate-400">• {(p.author.followers || 0).toLocaleString()}</span>
                            {followed && (<span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px]">★ Following</span>)}
                          </div>
                          <div className="mt-2 text-[15px] leading-relaxed text-slate-100">{p.text}</div>
                          <div className="mt-3 flex items-center gap-2 text-[12px] opacity-95">
                            <button
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${p.myReact === '❤️' ? 'bg-rose-500/15 border-rose-400/40' : 'bg-white/8 border-white/15'} hover:bg-white/12`}
                              onPointerDown={(e)=>e.stopPropagation()}
                              onClick={(e)=>{ e.stopPropagation(); handleReact(p.id,'❤️'); }}
                            >
                              <span>❤️</span>
                              <span className="tabular-nums opacity-90">{(p.reactions?.['❤️']||0).toLocaleString()}</span>
                            </button>
                            <button
                              className="inline-flex items-center gap-1 rounded-full border bg-white/8 border-white/15 px-3 py-1 hover:bg-white/12"
                              onPointerDown={(e)=>e.stopPropagation()}
                              onClick={(e)=>{ e.stopPropagation(); toggleFollow(p.author.name); }}
                            >
                              {followed ? '✓ Following' : 'Follow'}
                            </button>
                            <button
                              className="inline-flex items-center gap-1 rounded-full border bg-white/8 border-white/15 px-3 py-1 hover:bg-white/12"
                              onPointerDown={(e)=>e.stopPropagation()}
                              onClick={(e)=>{ e.stopPropagation(); shareThought(p); }}
                            >
                              Share
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ))}
      </div>

      {/* right panel */}
      {selectedPost && (
        <aside className="rpanel animate-fadeIn fixed right-0 top-0 bottom-0 z-[9999] w-[380px] md:w-[420px] overflow-y-auto border-l border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold">Profile</h3>
            <button onClick={() => setSelectedPost(null)} className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 hover:bg-white/15">✕</button>
          </div>
          <div className="mt-4 flex items-start gap-4">
            <img src={selectedPost.author.avatar} className="h-16 w-16 rounded-full border-2 border-white/10" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="text-xl font-semibold">{selectedPost.author.name}</div>
                {(() => {
                  const isFollowing = followingRef.current.has(selectedPost.author.name);
                  return (
                    <button onClick={() => toggleFollow(selectedPost.author.name)} className={`rounded-lg border bg-white/10 px-3 py-1 text-xs hover:bg-white/15 ${isFollowing ? 'opacity-100' : ''}`}>
                      {isFollowing ? 'Following ✓' : 'Follow'}
                    </button>
                  );
                })()}
              </div>
              <div className="mt-1 text-xs text-slate-300">
                <span className="rounded-md border border-white/10 bg-white/10 px-2 py-0.5">{(selectedPost.author.followers || 0).toLocaleString()} followers</span>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <h4 className="text-sm uppercase tracking-wide text-slate-300">Latest thought</h4>
            <p className="mt-2 whitespace-pre-wrap text-slate-100">{selectedPost.text}</p>
            <div className="mt-4 flex gap-2">
              {['❤️','😂','😮','😢','🔥'].map((emo,i)=> (
                <button key={i} onClick={() => handleReact(selectedPost.id, emo)} className={`rounded px-2 py-1 text-lg transition-transform hover:scale-125 ${selectedPost.myReact===emo ? 'bg-white/10' : ''}`}>
                  <span className="align-middle">{emo}</span>
                  <span className="ml-1 align-middle text-xs text-slate-300">{selectedPost.reactions?.[emo]||0}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={() => shareThought(selectedPost)} className="rounded-xl border border-white/20 bg-white/10 px-3 py-1 text-sm hover:bg-white/15">Share</button>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
            <button className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 hover:bg-white/15">Message (soon)</button>
            <button className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 hover:bg-white/15">View profile (soon)</button>
          </div>
        </aside>
      )}

      {/* share modal */}
      {shareTarget && (
        <div className="share-modal fixed inset-0 z-[10000] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur" onClick={() => setShareTarget(null)} />
          <div className="relative z-10 mx-auto w-full max-w-md p-4">
            <div className="animate-fadeIn rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Share this thought</h4>
                <button className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 hover:bg-white/15" onClick={() => setShareTarget(null)}>✕</button>
              </div>
              <div className="mb-3 line-clamp-3 text-xs text-slate-300">{shareTarget.text}</div>
              <div className="mb-2 text-[11px] text-slate-400">{eligible ? 'Your link includes your referral — you can earn when they buy.' : 'This will share the home link (no earnings).'}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <button onClick={() => shareTo('copy', shareTarget.text)} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 hover:bg-white/15">Copy link</button>
                <button onClick={() => shareTo('facebook', shareTarget.text)} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 hover:bg-white/15">Facebook</button>
                <button onClick={() => shareTo('whatsapp', shareTarget.text)} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 hover:bg-white/15">WhatsApp</button>
                <button onClick={() => shareTo('twitter', shareTarget.text)} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 hover:bg-white/15">X (Twitter)</button>
                <button onClick={() => shareTo('telegram', shareTarget.text)} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 hover:bg-white/15">Telegram</button>
                <button onClick={() => shareTo('reddit', shareTarget.text)} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 hover:bg-white/15">Reddit</button>
                <button onClick={() => shareTo('email', shareTarget.text)} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 hover:bg-white/15">Email</button>
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button onClick={() => { navigator.share({ title: 'Hellowall Thought', text: shareTarget.text, url: window.location.href }); setShareTarget(null); }} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 hover:bg-white/15">Device share</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
JSX

# 7) Run the dev server
npm run dev
