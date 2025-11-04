// src/App.jsx
import React from "react";
import HomePage from "./home/HomePage";
import BuyHWALL from "./components/BuyHWALL";
import WalletBadge from "./WalletBadge"; // controller (no visible button)

export default function App() {
  return (
    <>
      <HomePage />
      <BuyHWALL />
      {/* Mount hidden controller so your existing + wallet button can control it */}
      <WalletBadge ui="external" />
    </>
  );
}
