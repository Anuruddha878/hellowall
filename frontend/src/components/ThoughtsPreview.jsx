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
