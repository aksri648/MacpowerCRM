import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Use HashRouter for Capacitor (static file serving, no server-side rewrites)
// Use BrowserRouter for web (clean URLs, Cloudflare Pages handles rewrites)
const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined
const Router = isCapacitor ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
)
