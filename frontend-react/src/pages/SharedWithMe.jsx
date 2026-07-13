import { useState, useEffect } from 'react'
import { getSharedWithMe } from '../api'
import LeadCard from '../components/LeadCard'
import LeadModal from '../components/LeadModal'
import Loading from '../components/Loading'

export default function SharedWithMe() {
  const [leads, setLeads] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadShared() }, [])

  async function loadShared() {
    setLoading(true)
    const res = await getSharedWithMe()
    if (res.success) {
      setLeads(res.leads)
    }
    setLoading(false)
  }

  return (
    <>
      <Loading show={loading} />
      <div className="leads-list">
        {leads.length === 0 && !loading ? (
          <div className="empty-state">
            <span className="material-icons">share</span>
            <h3>No Shared Leads</h3>
            <p>When someone shares a lead with you, it will appear here.</p>
          </div>
        ) : (
          leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={setSelected}
              isShared={true}
            />
          ))
        )}
      </div>
      <LeadModal
        lead={selected}
        onClose={() => setSelected(null)}
        onConvert={() => {}}
        onUpdateStatus={() => {}}
        onDelete={() => {}}
        isShared={true}
      />
    </>
  )
}
