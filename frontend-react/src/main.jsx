import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './index.css'

// Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable')
}

// Use HashRouter for Capacitor (static file serving, no server-side rewrites)
// Use BrowserRouter for web (clean URLs, Cloudflare Pages handles rewrites)
const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined
const Router = isCapacitor ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <Router>
        <App />
      </Router>
    </ClerkProvider>
  </React.StrictMode>
)
