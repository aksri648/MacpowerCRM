import { useState, useEffect } from 'react'
import { getLeadShares, unshareLead } from '../api'

function formatPrice(price) {
  if (!price && price !== 0) return ''
  return Number(price).toLocaleString('en-IN')
}

export default function LeadModal({ lead, onClose, onConvert, onUpdateStatus, onDelete, isShared }) {
  const [shares, setShares] = useState([])
  const [loadingShares, setLoadingShares] = useState(false)

  useEffect(() => {
    if (lead && !isShared) {
      loadShares()
    } else {
      setShares([])
    }
  }, [lead])

  async function loadShares() {
    if (!lead) return
    setLoadingShares(true)
    try {
      const res = await getLeadShares(lead.id)
      if (res.success) setShares(res.shares || [])
    } catch {}
    setLoadingShares(false)
  }

  async function handleUnshare(shareWithUserId) {
    if (!confirm('Remove sharing for this user?')) return
    const res = await unshareLead(lead.id, shareWithUserId)
    if (res.success) loadShares()
  }

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
          {/* Shared by info for shared leads */}
          {isShared && lead.shared_by_username && (
            <div className="shared-info-banner">
              <span className="material-icons">person</span>
              <span>Shared by <strong>@{lead.shared_by_username}</strong> {lead.shared_by_name ? `(${lead.shared_by_name})` : ''}</span>
            </div>
          )}

          {details.map((d, i) => (
            <div className="detail-item" key={i}>
              <div className="detail-icon"><span className="material-icons">{d.icon}</span></div>
              <div className="detail-content">
                <div className="detail-label">{d.label}</div>
                <div className="detail-value">{d.value}</div>
              </div>
            </div>
          ))}

          {/* Shared with section (only for owned leads) */}
          {!isShared && shares.length > 0 && (
            <div className="shared-with-section">
              <h4 className="shared-with-title">
                <span className="material-icons">group</span>
                Shared with ({shares.length})
              </h4>
              {shares.map(share => (
                <div key={share.share_id} className="shared-user-row">
                  <div className="shared-user-details">
                    <span className="shared-user-name">@{share.username}</span>
                    <span className="shared-user-meta">{share.full_name || share.email}</span>
                  </div>
                  <button
                    className="btn-icon-small btn-danger-icon"
                    onClick={() => handleUnshare(share.username)}
                    title="Remove sharing"
                  >
                    <span className="material-icons">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          {!isShared && loadingShares && (
            <div className="shared-loading">
              <span className="material-icons spinning">sync</span>
              Loading shares...
            </div>
          )}
        </div>

        {/* Actions only for owned leads */}
        {!isShared && (
          <div className="modal-actions">
            {lead.status !== 'Converted' && (
              <button className="btn btn-success" onClick={() => onConvert(lead.id)}>Convert</button>
            )}
            {lead.status !== 'Enquiry' && lead.status !== 'Converted' && (
              <button className="btn btn-outlined" onClick={() => onUpdateStatus(lead.id, 'Enquiry')}>Mark Enquiry</button>
            )}
            <button className="btn btn-outlined" onClick={() => onDelete(lead.id)}>Delete</button>
          </div>
        )}
      </div>
    </div>
  )
}
