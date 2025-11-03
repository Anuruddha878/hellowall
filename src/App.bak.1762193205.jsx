import React from "react";
import useIsMobile from "./hooks/useIsMobile";
import MobileGate from "./components/MobileGate";
import ThoughtsBoard from "./components/ThoughtsBoard"; // your desktop wall

export default function App() {
  const isMobile = useIsMobile(768); // <768 => MobileGate
  return isMobile ? <MobileGate /> : <ThoughtsBoard />;
}
