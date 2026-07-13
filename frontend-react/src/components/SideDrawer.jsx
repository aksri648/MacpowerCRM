import { useClerk, useUser } from '@clerk/clerk-react'

export default function SideDrawer({ open, onClose, onNavigate, currentPath }) {
  const { signOut } = useClerk()
  const { user } = useUser()

  const items = [
    { path: '/', icon: 'dashboard', label: 'Dashboard' },
    { path: '/add-lead', icon: 'add_circle', label: 'Add Lead' },
    { path: '/leads', icon: 'people', label: 'All Leads' },
    { path: '/shared-with-me', icon: 'share', label: 'Shared With Me' },
    { path: '/enquiries', icon: 'help_outline', label: 'Enquiries' },
    { path: '/conversions', icon: 'check_circle', label: 'Conversions' },
    { path: '/settings', icon: 'settings', label: 'Settings' },
  ]

  function handleSignOut() {
    signOut()
    onClose()
  }

  return (
    <>
      <div className={`drawer-overlay ${open ? 'visible' : ''}`} onClick={onClose} />
      <nav className={`side-drawer ${open ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-logo">
            <img src="/logo.jpg" alt="Macpower CNC Limited" className="drawer-logo-img" />
          </div>
          <h2>Macpower CNC Limited</h2>
          {user && (
            <p className="drawer-user-info">
              {user.fullName || user.primaryEmailAddress?.emailAddress || 'User'}
            </p>
          )}
        </div>
        <ul className="drawer-menu">
          {items.map(item => (
            <li
              key={item.path}
              className={`drawer-item ${currentPath === item.path ? 'active' : ''}`}
              onClick={() => onNavigate(item.path)}
            >
              <span className="material-icons">{item.icon}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
        <div className="drawer-footer">
          <button className="drawer-signout-btn" onClick={handleSignOut}>
            <span className="material-icons">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    </>
  )
}
