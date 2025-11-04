set -euo pipefail

# 1) Ensure folders exist
mkdir -p src/components

# 2) ThoughtsPreview.jsx (panel + chips + toast)
cat > src/components/ThoughtsPreview.jsx <<'JSX'
import React, { useEffect, useMemo, useRef, useState } from "react"

function num(n){ return (n||0).toLocaleString() }
function toast(msg){
  const el = document.getElementById('toast')
  if(!el) return
  el.textContent = msg
  el.classList.add('show')
  setTimeout(()=>el.classList.remove('show'), 1200)
}

export default function ThoughtsPreview(){
  const demo = useMemo(()=>{
    const names = ["Nova","Kai","Zee","Mira","Arlo","Juno","Lux","Echo","Rune","Sora"]
    const pick = (arr)=>arr[Math.floor(Math.random()*arr.length)]
    const lines = [
      "Building something that matters today.",
      "Small steps > big talk.",
      "Ships win. Drafts don’t.",
      "If it’s fun, it’s sustainable.",
      "Be brave, be kind, be consistent.",
      "Less noise, more signal.",
      "Momentum beats motivation.",
      "We learn by launching.",
      "Own your voice. Own your wall.",
      "Focus is a superpower."
    ]
    const out=[]
    for(let i=0;i<24;i++){
      out.push({
        id: i+1,
        text: pick(lines) + (Math.random()>.5 ? " 🚀" : ""),
        likes: Math.floor(Math.random()*200),
        author:{
          id: "0x"+(Math.random().toString(16).slice(2).padEnd(8,'a')),
          name: pick(names),
          followers: 500 + Math.floor(Math.random()*4500),
          avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${i+1}`
        },
        _liked:false
      })
    }
    return out
  },[])

  const [posts, setPosts] = useState(demo)
  const [selectedPost, setSelectedPost] = useState(null)
  const followSetRef = useRef(new Set())
  const down = useRef({x:0,y:0})

  const toggleLike = (id)=>{
    setPosts(p=>p.map(x=>x.id===id?({...x,_liked:!x._liked,likes:(x._liked?x.likes-1:x.likes+1)}):x))
    if(selectedPost?.id===id){
      setSelectedPost(s=>s?{...s,_liked:!s._liked,likes:(s._liked?s.likes-1:s.likes+1)}:s)
    }
  }
  const toggleFollow = (aid)=>{
    const s = followSetRef.current
    s.has(aid) ? s.delete(aid) : s.add(aid)
    toast(s.has(aid) ? "Following" : "Unfollowed")
    setSelectedPost(sp=>sp?{...sp}:sp)
  }
  const sharePost = async (p)=>{
    const text = `Thought by ${p.author.name}: ${p.text}`
    try{
      if(navigator.share){
        await navigator.share({ title:"HelloWall", text })
      }else{
        await navigator.clipboard.writeText(text)
        toast("Copied to clipboard")
      }
    }catch{}
  }

  useEffect(()=>{
    const onKey=(e)=>{ if(e.key==="Escape") setSelectedPost(null) }
    window.addEventListener("keydown", onKey)
    return ()=>window.removeEventListener("keydown", onKey)
  },[])

  return (
    <div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12}}>
        {posts.map(p=>(
          <div key={p.id}
            className="card hover:lift"
            onPointerDown={(e)=>{ down.current={x:e.clientX,y:e.clientY} }}
            onClick={(e)=>{
              const dx=Math.abs(e.clientX-down.current.x)
              const dy=Math.abs(e.clientY-down.current.y)
              if(dx<6 && dy<6) setSelectedPost(p)
            }}>
            <div style={{display:"flex", gap:10, alignItems:"center"}}>
              <img src={p.author.avatar} width={36} height={36} alt="" style={{borderRadius:8, border:"1px solid rgba(255,255,255,.2)"}}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:600}}>{p.author.name}</div>
                <div style={{fontSize:12, color:"#9fb0d2"}}>{num(p.author.followers)} followers</div>
              </div>
            </div>
            <div style={{ marginTop:8, fontSize:15, lineHeight:1.45, color:"#eaf1ff" }}>
              {p.text}
            </div>
            <div style={{ marginTop:10, display:"flex", gap:10, alignItems:"center", opacity:.95 }}>
              <button className={"chip "+(p._liked?"chip-on":"")}
                onClick={(e)=>{ e.stopPropagation(); toggleLike(p.id) }}>
                ❤️ {num(p.likes||0)}
              </button>
              <button className="chip"
                onClick={(e)=>{ e.stopPropagation(); toggleFollow(p.author.id) }}>
                {followSetRef.current.has(p.author.id) ? "✓ Following" : "Follow"}
              </button>
              <button className="chip"
                onClick={(e)=>{ e.stopPropagation(); sharePost(p) }}>
                Share
              </button>
            </div>
          </div>
        ))}
      </div>

      <aside className={"panel "+(selectedPost ? "show" : "")}>
        {selectedPost && (
          <>
            <div className="panel-head">
              <h3 style={{margin:0}}>Thought</h3>
              <button className="btn" onClick={()=>setSelectedPost(null)}>✕</button>
            </div>
            <div className="panel-author">
              <img src={selectedPost.author.avatar} width={40} height={40} alt=""/>
              <div className="a-meta">
                <div className="a-name">{selectedPost.author.name}</div>
                <div className="a-follow">{num(selectedPost.author.followers)} followers</div>
              </div>
              <div className="a-actions">
                <button className="chip" onClick={()=>toggleFollow(selectedPost.author.id)}>
                  {followSetRef.current.has(selectedPost.author.id) ? "✓ Following" : "Follow"}
                </button>
              </div>
            </div>
            <div className="panel-text">{selectedPost.text}</div>
            <div className="panel-row">
              <button className={"chip "+(selectedPost._liked?"chip-on":"")}
                onClick={()=>toggleLike(selectedPost.id)}>❤️ {num(selectedPost.likes||0)}</button>
              <button className="chip" onClick={()=>sharePost(selectedPost)}>Share</button>
            </div>
          </>
        )}
      </aside>

      <div id="toast" className="toast"></div>
    </div>
  )
}
JSX

# 3) App.jsx wrapper
cat > src/App.jsx <<'JSX'
import React from "react"
import ThoughtsPreview from "./components/ThoughtsPreview"

export default function App(){
  return (
    <div className="app">
      <div className="panel-root">
        <div className="topbar">
          <strong>HelloWall — Local Demo</strong>
          <div style={{display:"flex", gap:8}}>
            <span className="kpi">Demo Mode</span>
            <span className="kpi">No wallet required</span>
          </div>
        </div>
        <div style={{ padding: 14 }}>
          <ThoughtsPreview />
        </div>
      </div>
    </div>
  )
}
JSX

# 4) CSS (append to src/index.css)
cat >> src/index.css <<'CSS'

/* --- HelloWall demo styles (chips, panel, glass) --- */
.app{
  min-height:100vh;
  padding:14px;
  background: radial-gradient(1200px 800px at 20% 10%, #101826, #070a0f 60%);
  color:#eaf1ff;
}
.panel-root{
  background: linear-gradient(180deg, rgba(20,28,48,.55), rgba(9,14,28,.55));
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 16px;
  backdrop-filter: blur(14px) saturate(120%);
  -webkit-backdrop-filter: blur(14px) saturate(120%);
  box-shadow: 0 12px 40px rgba(0,0,0,.35);
  overflow: hidden;
}
.topbar{
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 14px; border-bottom:1px solid rgba(255,255,255,.08);
}
.kpi{
  padding:6px 10px; border-radius:10px;
  border:1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.06); color:#fff; font-size:12px;
}
.card{
  position:relative;
  border-radius:16px;
  background: radial-gradient(160px 90px at 30% 0%, rgba(255,255,255,.18), rgba(255,255,255,.06));
  border:1px solid rgba(255,255,255,.12);
  box-shadow: 0 12px 40px rgba(4,10,22,.55), inset 0 1px 0 rgba(255,255,255,.10);
  padding:12px; color:#eaf1ff; cursor:pointer;
  transition: transform .15s ease;
}
.hover\:lift:hover{ transform: translateY(-2px); }
.card, .panel { will-change: transform; }

/* Chips / buttons */
.chip{
  padding:6px 10px; border-radius:999px;
  border:1px solid rgba(255,255,255,.22);
  background: rgba(255,255,255,.06); color:#fff; font-size:12px;
}
.chip-on{ background: rgba(255,120,140,.22); border-color: rgba(255,120,140,.45); }

.btn{
  padding:6px 10px; border-radius:10px;
  border:1px solid rgba(255,255,255,.25);
  background: rgba(255,255,255,.08); color:#fff;
}
.btn:hover{ background: rgba(255,255,255,.12); }

/* Slide-in side panel */
.panel{
  position:fixed; right:-460px; top:0; bottom:0; width:420px;
  background: linear-gradient(180deg, rgba(14,22,44,.88), rgba(10,16,32,.88));
  border-left:1px solid rgba(255,255,255,.14);
  backdrop-filter: blur(14px) saturate(120%);
  -webkit-backdrop-filter: blur(14px) saturate(120%);
  padding:20px; z-index:60; overflow:auto; color:#eaf1ff;
  transition: right .25s ease;
}
.panel.show{ right:0; }
.panel-head{ display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.panel-author{ display:flex; gap:12px; align-items:center; margin-bottom:8px;}
.panel-author img{ border-radius:10px; border:1px solid rgba(255,255,255,.2); }
.a-meta{ flex:1; }
.a-name{ font-weight:600; }
.a-follow{ font-size:12px; color:#a6b2d9; }
.a-actions{ display:flex; gap:8px; }
.panel-text{ white-space:pre-wrap; line-height:1.5; margin-top:10px; }
.panel-row{ display:flex; gap:10px; margin-top:12px; }

/* Toast */
.toast{
  position:fixed; left:50%; bottom:24px; transform:translateX(-50%);
  background: rgba(0,0,0,.6); color:#fff; padding:8px 12px; border-radius:10px;
  opacity:0; pointer-events:none; transition: opacity .2s ease;
  border:1px solid rgba(255,255,255,.2); backdrop-filter: blur(10px);
}
.toast.show{ opacity:1; }
CSS

# 5) Start dev server (kills previous vite if running on this shell)
npm run dev
