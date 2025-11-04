import React, { useEffect, useMemo, useRef, useState } from "react";

export default function ThoughtsBoard({ account, hasHWALL, onGetCoins, onConnect }) {
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);
  const followingRef = useRef(new Set(JSON.parse(localStorage.getItem("following_authors") || "[]")));

  // seed demo posts
  useEffect(() => {
    const names = ["Ava","Liam","Noah","Mia","Ethan","Zara","Kai","Lola"];
    const lines = [
      "Thinking about building something new…","What if thoughts could float like bubbles?",
      "Tiny wins — share one! 🎯","Sketching a dream, shipping a draft.","Shipping beats perfect."
    ];
    const rnd = (n)=>Math.floor(Math.random()*n);
    const out=[];
    for(let i=0;i<30;i++){
      out.push({
        id: "p"+(i+1),
        text: lines[rnd(lines.length)],
        author: {
          name: names[rnd(names.length)],
          followers: 100 + rnd(4900),
          avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${i+1}`
        },
      });
    }
    setPosts(out);
  },[]);

  const follow = (name)=>{
    const s = followingRef.current;
    if(s.has(name)) s.delete(name); else s.add(name);
    localStorage.setItem("following_authors", JSON.stringify([...s]));
    setPosts(p=>p.map(x=>x.author.name===name?{...x,author:{...x.author,followers:Math.max(0,(x.author.followers||0)+(s.has(name)?1:-1))}}:x));
    if(selected?.author.name===name) setSelected(s=>s?{...s,author:{...s.author,followers:Math.max(0,(s.author.followers||0)+(s.has(name)?1:-1))}}:s);
  };

  const react = (id, emo)=>{
    setPosts(arr=>arr.map(p=>{
      if(p.id!==id) return p;
      const r={...p.reactions}; let my=p.myReact;
      if(my===emo){ r[emo]=Math.max(0,(r[emo]||0)-1); my=null; }
      else{ if(my) r[my]=Math.max(0,(r[my]||0)-1); r[emo]=(r[emo]||0)+1; my=emo; }
      const next={...p,reactions:r,myReact:my};
      if(selected?.id===id) setSelected(next);
      return next;
    }));
  };

  const eligible = !!(account && hasHWALL);

  return (
    <div style={{padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <h2 style={{margin:0,fontWeight:700}}>Live Thoughts</h2>
        <div style={{display:"flex",gap:8}}>
          {!account && (<button className="btn" onClick={onConnect}>Connect</button>)}
          {!eligible && (<button className="btn" onClick={onGetCoins}>Get Coins</button>)}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
        {posts.map(p=>{
          const followed = followingRef.current.has(p.author.name);
          return (
            <div key={p.id} className="card" onClick={()=>setSelected(p)}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <img src={p.author.avatar} width={36} height={36} style={{borderRadius:8,border:"1px solid rgba(255,255,255,.2)"}}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600}}>{p.author.name}</div>
                  <div style={{fontSize:12,opacity:.8}}>{(p.author.followers||0).toLocaleString()} followers</div>
                </div>
              </div>
              <div style={{marginTop:8, lineHeight:1.5}}>{p.text}</div>
              <div style={{marginTop:10, display:"flex", gap:8}}>
                </button>
                <button className="chip" onClick={(e)=>{e.stopPropagation();follow(p.author.name)}}>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* right panel */}
      {selected && (
        <aside className="panel show">
          <div className="panel-head">
            <h3 style={{margin:0}}>Thought</h3>
            <button className="btn" onClick={()=>setSelected(null)}>✕</button>
          </div>
          <div className="panel-author">
            <img src={selected.author.avatar} width={44} height={44}/>
            <div className="a-meta">
              <div className="a-name">{selected.author.name}</div>
              <div className="a-follow">{(selected.author.followers||0).toLocaleString()} followers</div>
            </div>
            <div className="a-actions">
              <button className="chip" onClick={()=>follow(selected.author.name)}>
              </button>
            </div>
          </div>
          <div className="panel-text">{selected.text}</div>
          <div className="panel-row">
            <button className="chip" onClick={()=>navigator.clipboard.writeText(selected.text)}>Copy</button>
          </div>
        </aside>
      )}
    </div>
  );
}
