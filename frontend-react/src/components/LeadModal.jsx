function formatPrice(price) {
  if (!price && price !== 0) return ''
  return Number(price).toLocaleString('en-IN')
}

export default function LeadModal({ lead, onClose, onConvert, onUpdateStatus, onDelete }) {
  if (!lead) return null

  const details = [
    { icon: 'business', label: 'Company Name', value: lead.company_name },
    { icon: 'person', label: 'Contact Person', value: lead.contact_person },
    { icon: 'phone', label: 'Phone Number', value: lead.phone },
    { icon: 'location_on', label: 'Area', value: lead.area },
    { icon: 'engineering', label: 'Machine Model', value: lead.machine_model },
    { icon: 'currency_rupee', label: 'Price', value: `₹${formatPrice(lead.price)}` },
    { icon: 'map', label: 'Location', value: lead.location_address || 'Not captured' },
    { icon: 'info', label: 'Status', value: lead.status },
  ]
  if (lead.notes) {
    details.push({ icon: 'note', label: 'Notes', value: lead.notes })
  }

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Lead Details</h2>
          <button className="icon-btn" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="modal-body">
          {details.map((d, i) => (
            <div className="detail-item" key={i}>
              <div className="detail-icon"><span className="material-icons">{d.icon}</span></div>
              <div className="detail-content">
                <div className="detail-label">{d.label}</div>
                <div className="detail-value">{d.value}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          {lead.status !== 'Converted' && (
            <button className="btn btn-success" onClick={() => onConvert(lead.id)}>Convert</button>
          )}
          {lead.status !== 'Enquiry' && lead.status !== 'Converted' && (
            <button className="btn btn-outlined" onClick={() => onUpdateStatus(lead.id, 'Enquiry')}>Mark Enquiry</button>
          )}
          <button className="btn btn-outlined" onClick={() => onDelete(lead.id)}>Delete</button>
        </div>
      </div>
    </div>
  )
}
