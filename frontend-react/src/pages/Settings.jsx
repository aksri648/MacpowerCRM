import { UserProfile } from '@clerk/clerk-react'

export default function Settings() {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://macpower-crm-api.akshatsri648.workers.dev'

  return (
    <div className="settings-page">
      <div className="settings-list">
        <div className="settings-item">
          <div className="settings-icon"><span className="material-icons">link</span></div>
          <div className="settings-info">
            <h4>API Endpoint</h4>
            <p className="settings-value">{apiUrl}</p>
          </div>
        </div>
        <div className="settings-item">
          <div className="settings-icon"><span className="material-icons">info</span></div>
          <div className="settings-info">
            <h4>About</h4>
            <p>MacpowerCRM v2.0.0 (React + D1)</p>
          </div>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: 24 }}>
        <h2>Manage Profile</h2>
      </div>
      <div className="profile-manager">
        <UserProfile routing="hash" />
      </div>
    </div>
  )
}
