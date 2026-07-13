import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboard, convertLead, deleteLead, updateLead } from '../api'
import LeadCard from '../components/LeadCard'
import LeadModal from '../components/LeadModal'
import Loading from '../components/Loading'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    const res = await getDashboard()
    if (res.success) setStats(res.dashboard)
    setLoading(false)
  }

  async function handleConvert(id) {
    await convertLead(id)
    setSelectedLead(null)
    loadDashboard()
  }

  async function handleUpdateStatus(id, status) {
    await updateLead(id, { status })
    setSelectedLead(null)
    loadDashboard()
  }

  async function handleDelete(id) {
    await deleteLead(id)
    setSelectedLead(null)
    loadDashboard()
  }

  return (
    <>
      <Loading show={loading} />
      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card leads">
              <div className="stat-icon"><span className="material-icons">people</span></div>
              <div className="stat-info"><h3>{stats.totalLeads}</h3><p>Total Leads</p></div>
            </div>
            <div className="stat-card enquiries">
              <div className="stat-icon"><span className="material-icons">help_outline</span></div>
              <div className="stat-info"><h3>{stats.totalEnquiries}</h3><p>Enquiries</p></div>
            </div>
            <div className="stat-card conversions">
              <div className="stat-icon"><span className="material-icons">check_circle</span></div>
              <div className="stat-info"><h3>{stats.totalConversions}</h3><p>Conversions</p></div>
            </div>
            <div className="stat-card rate">
              <div className="stat-icon"><span className="material-icons">trending_up</span></div>
              <div className="stat-info"><h3>{stats.conversionRate}%</h3><p>Conversion Rate</p></div>
            </div>
          </div>

          <div className="section-header">
            <h2>Recent Leads</h2>
            <button className="text-btn" onClick={() => navigate('/leads')}>View All</button>
          </div>
          <div className="recent-leads-list">
            {stats.recentLeads.length === 0 ? (
              <div className="empty-state">
                <span className="material-icons">people</span>
                <h3>No Leads Yet</h3>
                <p>Add your first lead to get started</p>
              </div>
            ) : (
              stats.recentLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} onClick={setSelectedLead} />
              ))
            )}
          </div>
        </>
      )}

      <LeadModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onConvert={handleConvert}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDelete}
      />
    </>
  )
}
