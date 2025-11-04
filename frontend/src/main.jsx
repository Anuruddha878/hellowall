import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import BetaGate from './BetaGate.jsx'

createRoot(document.getElementById('root')).render(
  <BetaGate>
    <App />
  </BetaGate>
)
