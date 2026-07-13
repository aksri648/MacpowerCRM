export default function SideDrawer({ open, onClose, onNavigate, currentPath }) {
  const items = [
    { path: '/', icon: 'dashboard', label: 'Dashboard' },
    { path: '/add-lead', icon: 'add_circle', label: 'Add Lead' },
    { path: '/leads', icon: 'people', label: 'All Leads' },
    { path: '/enquiries', icon: 'help_outline', label: 'Enquiries' },
    { path: '/conversions', icon: 'check_circle', label: 'Conversions' },
    { path: '/settings', icon: 'settings', label: 'Settings' },
  ]

  return (
    <>
      <div className={`drawer-overlay ${open ? 'visible' : ''}`} onClick={onClose} />
      <nav className={`side-drawer ${open ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-logo">
            <span className="material-icons">business_center</span>
          </div>
          <h2>MacpowerCRM</h2>
          <p>Sales Management</p>
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
      </nav>
    </>
  )
}
