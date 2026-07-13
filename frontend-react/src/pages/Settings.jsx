export default function Settings() {
  const apiUrl = import.meta.env.VITE_API_URL || 'Not configured'

  return (
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
  )
}
