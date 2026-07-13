import { useState, createContext, useContext } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import AddLead from './pages/AddLead'
import Leads from './pages/Leads'
import Enquiries from './pages/Enquiries'
import Conversions from './pages/Conversions'
import Settings from './pages/Settings'
import SideDrawer from './components/SideDrawer'
import Snackbar from './components/Snackbar'
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
}

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '' })
  const navigate = useNavigate()
  const location = useLocation()

  const showSnackbar = (message) => {
    setSnackbar({ open: true, message })
    setTimeout(() => setSnackbar({ open: false, message: '' }), 3000)
  }

  const title = PAGE_TITLES[location.pathname] || 'MacpowerCRM'

  return (
    <SnackbarContext.Provider value={showSnackbar}>
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
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-lead" element={<AddLead />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/enquiries" element={<Enquiries />} />
            <Route path="/conversions" element={<Conversions />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        <button className="fab" onClick={() => navigate('/add-lead')}
          style={{ display: location.pathname === '/add-lead' ? 'none' : 'flex' }}>
          <span className="material-icons">add</span>
        </button>

        <nav className="bottom-nav">
          {[
            { path: '/', icon: 'dashboard', label: 'Dashboard' },
            { path: '/leads', icon: 'people', label: 'Leads' },
            { path: '/add-lead', icon: 'add_circle', label: 'New Lead' },
            { path: '/conversions', icon: 'check_circle', label: 'Converted' },
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

        <Snackbar
          open={snackbar.open}
          message={snackbar.message}
          onClose={() => setSnackbar({ open: false, message: '' })}
        />
      </div>
    </SnackbarContext.Provider>
  )
}
