import { useState, createContext, useContext, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth, useUser, SignedIn, SignedOut } from '@clerk/clerk-react'
import { useApiToken } from './hooks/useApiToken'
import Dashboard from './pages/Dashboard'
import AddLead from './pages/AddLead'
import Leads from './pages/Leads'
import Enquiries from './pages/Enquiries'
import Conversions from './pages/Conversions'
import Settings from './pages/Settings'
import SharedWithMe from './pages/SharedWithMe'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import SideDrawer from './components/SideDrawer'
import Snackbar from './components/Snackbar'
import Loading from './components/Loading'
import './index.css'

export const SnackbarContext = createContext()

export function useSnackbar() {
  return useContext(SnackbarContext)
}

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/add-lead': 'Add New Lead',
  '/leads': 'All Leads',
  '/enquiries': 'Enquiries',
  '/conversions': 'Conversions',
  '/settings': 'Settings',
  '/shared-with-me': 'Shared With Me',
}

// Component that auto-registers user in our DB using Clerk's username/email
function EnsureRegistered({ children }) {
  const { getToken } = useAuth()
  const { user, isLoaded: isUserLoaded } = useUser()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Wait until Clerk has loaded user data
    if (!isUserLoaded) return

    // If no user object after loading, skip registration (shouldn't happen inside SignedIn)
    if (!user) {
      setReady(true)
      return
    }

    async function ensureUser() {
      try {
        const token = await getToken()
        if (!token) {
          setReady(true)
          return
        }

        const API_BASE = import.meta.env.VITE_API_URL || 'https://macpower-crm-api.akshatsri648.workers.dev'

        // Check if already registered
        const checkUrl = new URL(API_BASE)
        checkUrl.searchParams.set('action', 'getMe')
        const checkRes = await fetch(checkUrl.toString(), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const checkData = await checkRes.json()

        if (checkData.success && checkData.registered) {
          setReady(true)
          return
        }

        // Not registered yet — auto-register using Clerk profile data
        const username = user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || ''
        const email = user.primaryEmailAddress?.emailAddress || ''
        const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()

        const regUrl = new URL(API_BASE)
        regUrl.searchParams.set('action', 'registerUser')
        regUrl.searchParams.set('username', username.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 30))
        regUrl.searchParams.set('email', email.toLowerCase())
        regUrl.searchParams.set('fullName', fullName)

        await fetch(regUrl.toString(), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      } catch {
        // Allow through on error — API calls will fail with proper error
      }
      setReady(true)
    }

    ensureUser()
  }, [user, isUserLoaded])

  if (!ready) return <Loading show={true} />
  return children
}

// The authenticated application shell (header, nav, routed pages)
function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const title = PAGE_TITLES[location.pathname] || 'MacpowerCRM'

  return (
    <div className="app-container">
      <header className="top-bar">
        <button className="icon-btn" onClick={() => setDrawerOpen(true)}>
          <span className="material-icons">menu</span>
        </button>
        <h1 className="top-bar-title">{title}</h1>
      </header>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(path) => { navigate(path); setDrawerOpen(false) }}
        currentPath={location.pathname}
      />

      <main className="main-content">
        <EnsureRegistered>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-lead" element={<AddLead />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/enquiries" element={<Enquiries />} />
            <Route path="/conversions" element={<Conversions />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/shared-with-me" element={<SharedWithMe />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </EnsureRegistered>
      </main>

      {!['/add-lead', '/settings', '/conversions', '/enquiries', '/shared-with-me'].includes(location.pathname) && (
        <button className="fab" onClick={() => navigate('/add-lead')}>
          <span className="material-icons">add</span>
        </button>
      )}

      <nav className="bottom-nav">
        {[
          { path: '/', icon: 'dashboard', label: 'Dashboard' },
          { path: '/leads', icon: 'people', label: 'Leads' },
          { path: '/add-lead', icon: 'add_circle', label: 'New Lead' },
          { path: '/shared-with-me', icon: 'share', label: 'Shared' },
        ].map(item => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="material-icons">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  const [snackbar, setSnackbar] = useState({ open: false, message: '' })
  const { isLoaded } = useAuth()

  // Connect Clerk auth token to API layer
  useApiToken()

  const showSnackbar = (message) => {
    setSnackbar({ open: true, message })
    setTimeout(() => setSnackbar({ open: false, message: '' }), 3000)
  }

  if (!isLoaded) return <Loading show={true} />

  return (
    <SnackbarContext.Provider value={showSnackbar}>
      <Routes>
        {/* Public auth routes — hosted on our own domain */}
        <Route path="/sign-in/*" element={
          <>
            <SignedIn><Navigate to="/" replace /></SignedIn>
            <SignedOut><SignIn /></SignedOut>
          </>
        } />
        <Route path="/sign-up/*" element={
          <>
            <SignedIn><Navigate to="/" replace /></SignedIn>
            <SignedOut><SignUp /></SignedOut>
          </>
        } />

        {/* Everything else: app if signed in, else redirect to our /sign-in */}
        <Route path="/*" element={
          <>
            <SignedIn><AppShell /></SignedIn>
            <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
          </>
        } />
      </Routes>

      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        onClose={() => setSnackbar({ open: false, message: '' })}
      />
    </SnackbarContext.Provider>
  )
}
