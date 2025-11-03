import React from "react";

const BUY_URL = "https://example.com/buy-hwall"; // ← replace with your real link

export default function BuyHWALL(){
  return (
    <a
      href={BUY_URL}
      target="_blank"
      rel="noreferrer"
      style={btn}
      aria-label="Buy HWALL"
    >
      Buy HWALL
    </a>
  );
}

const btn = {
  position: "fixed",
  right: 16,
  bottom: 16,
  padding: "10px 16px",
  borderRadius: 999,
  background: "rgb(16, 185, 129)", // emerald
  color: "#0b0f19",
  fontWeight: 700,
  border: "1px solid rgba(255,255,255,0.2)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  cursor: "pointer",
  zIndex: 9999,
  textDecoration: "none",
};
