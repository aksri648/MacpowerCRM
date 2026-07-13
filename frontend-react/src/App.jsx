import { useState, createContext, useContext, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useApiToken } from './hooks/useApiToken'
import Dashboard from './pages/Dashboard'
import AddLead from './pages/AddLead'
import Leads from './pages/Leads'
import Enquiries from './pages/Enquiries'
import Conversions from './pages/Conversions'
import Settings from './pages/Settings'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import CompleteProfile from './pages/CompleteProfile'
import SharedWithMe from './pages/SharedWithMe'
import SideDrawer from './components/SideDrawer'
import Snackbar from './components/Snackbar'
import ProtectedRoute from './components/ProtectedRoute'
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
  '/complete-profile': 'Complete Profile',
}

// Component that checks if user has completed profile registration
function RequireProfile({ children }) {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [checking, setChecking] = useState(true)
  const [registered, setRegistered] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function checkProfile() {
      try {
        const token = await getToken()
        const API_BASE = import.meta.env.VITE_API_URL || 'https://macpower-crm-api.akshatsri648.workers.dev'
        const url = new URL(API_BASE)
        url.searchParams.set('action', 'getMe')
        const res = await fetch(url.toString(), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.success && data.registered) {
          setRegistered(true)
        } else {
          navigate('/complete-profile', { replace: true })
        }
      } catch {
        // On error, allow through - the API calls will fail with proper error
        setRegistered(true)
      }
      setChecking(false)
    }
    if (user) checkProfile()
  }, [user])

  if (checking) return <Loading show={true} />
  if (!registered) return null
  return children
}

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '' })
  const navigate = useNavigate()
  const location = useLocation()
  const { isSignedIn, isLoaded } = useAuth()

  // Connect Clerk auth token to API layer
  useApiToken()

  const showSnackbar = (message) => {
    setSnackbar({ open: true, message })
    setTimeout(() => setSnackbar({ open: false, message: '' }), 3000)
  }

  const title = PAGE_TITLES[location.pathname] || 'MacpowerCRM'

  // Auth pages don't show the app shell
  const isAuthPage = ['/sign-in', '/sign-up'].includes(location.pathname)
  const isProfilePage = location.pathname === '/complete-profile'

  if (!isLoaded) return <Loading show={true} />

  return (
    <SnackbarContext.Provider value={showSnackbar}>
      <div className="app-container">
        {/* Show app shell only for authenticated non-auth pages */}
        {!isAuthPage && !isProfilePage && isSignedIn && (
          <>
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
          </>
        )}

        <main className={isAuthPage || isProfilePage ? 'main-content auth-main' : 'main-content'}>
          <Routes>
            {/* Public auth routes */}
            <Route path="/sign-in/*" element={
              isSignedIn ? <Navigate to="/" replace /> : <SignIn />
            } />
            <Route path="/sign-up/*" element={
              isSignedIn ? <Navigate to="/" replace /> : <SignUp />
            } />

            {/* Profile completion (auth required but no profile check) */}
            <Route path="/complete-profile" element={
              <ProtectedRoute><CompleteProfile /></ProtectedRoute>
            } />

            {/* Protected routes (auth + profile required) */}
            <Route path="/" element={
              <ProtectedRoute><RequireProfile><Dashboard /></RequireProfile></ProtectedRoute>
            } />
            <Route path="/add-lead" element={
              <ProtectedRoute><RequireProfile><AddLead /></RequireProfile></ProtectedRoute>
            } />
            <Route path="/leads" element={
              <ProtectedRoute><RequireProfile><Leads /></RequireProfile></ProtectedRoute>
            } />
            <Route path="/enquiries" element={
              <ProtectedRoute><RequireProfile><Enquiries /></RequireProfile></ProtectedRoute>
            } />
            <Route path="/conversions" element={
              <ProtectedRoute><RequireProfile><Conversions /></RequireProfile></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><RequireProfile><Settings /></RequireProfile></ProtectedRoute>
            } />
            <Route path="/shared-with-me" element={
              <ProtectedRoute><RequireProfile><SharedWithMe /></RequireProfile></ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* FAB and bottom nav only for authenticated users on non-auth pages */}
        {!isAuthPage && !isProfilePage && isSignedIn && (
          <>
            <button className="fab" onClick={() => navigate('/add-lead')}
              style={{ display: location.pathname === '/add-lead' ? 'none' : 'flex' }}>
              <span className="material-icons">add</span>
            </button>

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
          </>
        )}

        <Snackbar
          open={snackbar.open}
          message={snackbar.message}
          onClose={() => setSnackbar({ open: false, message: '' })}
        />
      </div>
    </SnackbarContext.Provider>
  )
}
