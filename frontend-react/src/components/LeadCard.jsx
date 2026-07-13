function formatPrice(price) {
  if (!price && price !== 0) return ''
  return Number(price).toLocaleString('en-IN')
}

function getStatusClass(status) {
  switch (status) {
    case 'New Lead': return 'new'
    case 'Enquiry': return 'enquiry'
    case 'Converted': return 'converted'
    case 'Lost': return 'lost'
    default: return 'new'
  }
}

export default function LeadCard({ lead, onClick, onShare, isShared }) {
  const date = new Date(lead.created_at)
  const formattedDate = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  function handleShareClick(e) {
    e.stopPropagation()
    onShare?.(lead)
  }

  return (
    <div className="lead-card" onClick={() => onClick?.(lead)}>
      <div className="lead-card-header">
        <span className="lead-card-title">{lead.company_name}</span>
        <div className="lead-card-actions">
          {!isShared && (
            <button
              className="share-dot-btn"
              onClick={handleShareClick}
              title="Share this lead"
              aria-label="Share this lead"
            >
              <span className="material-icons">share</span>
            </button>
          )}
          <span className={`lead-status ${getStatusClass(lead.status)}`}>{lead.status}</span>
        </div>
      </div>
      {isShared && lead.shared_by_username && (
        <div className="shared-by-badge">
          <span className="material-icons">person</span>
          <span>Shared by @{lead.shared_by_username}</span>
        </div>
      )}
      <div className="lead-card-details">
        <div className="lead-detail">
          <span className="material-icons">person</span>
          <span>{lead.contact_person}</span>
        </div>
        <div className="lead-detail">
          <span className="material-icons">phone</span>
          <span>{lead.phone}</span>
        </div>
        <div className="lead-detail">
          <span className="material-icons">location_on</span>
          <span>{lead.area}</span>
        </div>
        <div className="lead-detail">
          <span className="material-icons">engineering</span>
          <span>{lead.machine_model}</span>
        </div>
      </div>
      <div className="lead-card-footer">
        <span className="lead-price">₹{formatPrice(lead.price)}</span>
        <span className="lead-date">{formattedDate} {formattedTime}</span>
      </div>
    </div>
  )
}
