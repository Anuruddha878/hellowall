import React, { useEffect, useMemo, useState } from "react";

/**
 * SidePanel
 * Props:
 *  - open: boolean
 *  - card: { id, author:{name, avatar, followers}, text, likes }
 *  - onClose: fn()
 *  - onFollow: fn(cardId)
 *  - isFollowing: boolean
 *  - account: string | null
 *  - meetsHold: boolean   // true if user holds >= MIN_HOLD HWALL
 */
export default function SidePanel({
  open,
  card,
  onClose,
  onFollow,
  isFollowing,
  account,
  meetsHold,
}) {
  if (!open || !card) return null;

  return (
    <div style={wrap} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>Thought</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button style={followBtn} onClick={() => onFollow(card.id)}>
              {isFollowing ? "Following" : "Follow"}
            </button>
            <button style={closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Author */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <div style={{ fontSize: 28 }}>{card.author.avatar}</div>
          <div>
            <div style={{ fontWeight: 800, color: "#fff", fontSize: 18 }}>{card.author.name}</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              {card.author.followers.toLocaleString()} followers
            </div>
          </div>
        </div>

        {/* Action chips under author */}
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button style={chip}>Chat (soon)</button>
          <button style={chip}>Profile (soon)</button>
          <CommentGate account={account} meetsHold={meetsHold} cardId={card.id} />
        </div>

        {/* Content */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 22 }}>
          <div style={heartBadge}>❤️ {card.likes || 0}</div>
        </div>

        <div style={{ marginTop: 14, color: "#e6e7ea", fontSize: 22, lineHeight: 1.4 }}>
          {card.text}
        </div>

        {/* Comments */}
        <CommentsBlock cardId={card.id} authorName={card.author.name} />
      </div>
    </div>
  );
}

/* -------------------- Comment gate button -------------------- */

function CommentGate({ account, meetsHold, cardId }) {
  const [showComposer, setShowComposer] = useState(false);

  const clickComment = () => {
    if (!account) {
      alert("Connect your wallet to comment.");
      return;
    }
    if (!meetsHold) {
      alert("You need to hold the minimum HWALL to comment.");
      return;
    }
    setShowComposer((v) => !v);
  };

  return (
    <>
      <button style={ctaBtn} onClick={clickComment}>
        {showComposer ? "Hide Comment" : "Comment"}
      </button>
      {showComposer && <Composer cardId={cardId} onDone={() => setShowComposer(false)} />}
    </>
  );
}

/* -------------------- Comment composer + storage -------------------- */

function Composer({ cardId, onDone }) {
  const [text, setText] = useState("");

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    const now = new Date().toISOString();
    const mine = {
      user: "You",
      text: t.slice(0, 300),
      time: now,
    };
    const key = `hwall_comments_${cardId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.unshift(mine);
    localStorage.setItem(key, JSON.stringify(existing));
    setText("");
    onDone?.();
  };

  return (
    <div style={composerBox}>
      <textarea
        placeholder="Write your comment…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={300}
        style={composerInput}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={chip} onClick={onDone}>Cancel</button>
        <button style={ctaBtn} onClick={submit}>Post</button>
      </div>
    </div>
  );
}

/* -------------------- Comments list (with seeding) -------------------- */

const SEED_USERS = ["Nova", "Rex", "Ivy", "Kai", "Mira", "Zed", "Aria", "Owen", "Leo", "Nina"];
const SEED_LINES = [
  "Love this!",
  "This hits different.",
  "Agree — shipping beats perfect.",
  "Tiny wins add up 💪",
  "Following for more.",
  "This is so true.",
  "Respect.",
  "Inspired to build now.",
];

function seedComments(cardId, authorName) {
  const key = `hwall_comments_${cardId}`;
  if (localStorage.getItem(key)) return;

  const count = 2 + ((cardId * 7) % 3); // 2–4 comments
  const items = Array.from({ length: count }).map((_, i) => ({
    user: i === 0 ? authorName : SEED_USERS[(cardId + i) % SEED_USERS.length],
    text: SEED_LINES[(cardId * 3 + i) % SEED_LINES.length],
    time: new Date(Date.now() - (count - i) * 3600_000).toISOString(),
  }));
  localStorage.setItem(key, JSON.stringify(items));
}

function useComments(cardId, authorName) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (cardId == null) return;
    seedComments(cardId, authorName);
    try {
      const key = `hwall_comments_${cardId}`;
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      setComments(arr);
    } catch {
      setComments([]);
    }
  }, [cardId, authorName]);

  // listen for posts from composer (same tab)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === `hwall_comments_${cardId}`) {
        try {
          setComments(JSON.parse(e.newValue || "[]"));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [cardId]);

  // in-tab updates (composer writes localStorage but doesn't fire storage)
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const key = `hwall_comments_${cardId}`;
        const arr = JSON.parse(localStorage.getItem(key) || "[]");
        setComments((prev) => (JSON.stringify(prev) !== JSON.stringify(arr) ? arr : prev));
      } catch {}
    }, 500);
    return () => clearInterval(id);
  }, [cardId]);

  return comments;
}

function CommentsBlock({ cardId, authorName }) {
  const comments = useComments(cardId, authorName);

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontWeight: 700, color: "#fff", marginBottom: 8 }}>Comments</div>
      {comments.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No comments yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {comments.map((c, idx) => (
            <div key={idx} style={commentRow}>
              <div style={{ fontWeight: 600, color: "#e9eaef" }}>{c.user}</div>
              <div style={{ opacity: 0.85 }}>{c.text}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                {new Date(c.time).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------- styles -------------------- */

const wrap = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  zIndex: 95,
  display: "flex",
  justifyContent: "flex-end",
};

const panel = {
  width: 480,
  maxWidth: "95vw",
  height: "100%",
  background: "rgba(12,15,24,0.98)",
  borderLeft: "1px solid rgba(255,255,255,0.12)",
  padding: 16,
  color: "#dfe2ea",
  boxShadow: "0 0 40px rgba(0,0,0,0.5)",
  backdropFilter: "blur(6px)",
};

const closeBtn = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "#e6e7ea",
  padding: "6px 10px",
  borderRadius: 10,
  cursor: "pointer",
};

const followBtn = {
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.12)",
  color: "#e6e7ea",
  padding: "8px 12px",
  borderRadius: 999,
  cursor: "pointer",
};

const chip = {
  fontSize: 13,
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.12)",
  color: "#e6e7ea",
  border: "1px solid rgba(255,255,255,0.15)",
  cursor: "pointer",
};

const ctaBtn = {
  fontSize: 14,
  fontWeight: 700,
  padding: "10px 14px",
  borderRadius: 999,
  background: "#57C28B",
  color: "#0b0f19",
  border: "2px solid rgba(255,255,255,0.20)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 3px 10px rgba(0,0,0,0.25)",
  cursor: "pointer",
};

const heartBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 12px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
  fontWeight: 600,
};

const composerBox = {
  marginTop: 10,
  padding: 10,
  borderRadius: 12,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  display: "grid",
  gap: 8,
};

const composerInput = {
  width: "100%",
  minHeight: 80,
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 10,
  background: "rgba(0,0,0,0.2)",
  color: "#e6e7ea",
  padding: 10,
  outline: "none",
};

const commentRow = {
  padding: 10,
  borderRadius: 12,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
};
