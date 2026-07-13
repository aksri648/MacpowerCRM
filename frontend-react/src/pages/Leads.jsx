import { useState, useEffect, useContext } from 'react'
import { getLeads, deleteLead, convertLead, updateLead } from '../api'
import { SnackbarContext } from '../App'
import LeadCard from '../components/LeadCard'
import LeadModal from '../components/LeadModal'
import Loading from '../components/Loading'

export default function Leads() {
  const showSnackbar = useContext(SnackbarContext)
  const [leads, setLeads] = useState([])
  const [filtered, setFiltered] = useState([])
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadLeads() }, [])

  async function loadLeads() {
    setLoading(true)
    const res = await getLeads()
    if (res.success) {
      setLeads(res.leads)
      setFiltered(res.leads)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (filter === 'all') setFiltered(leads)
    else setFiltered(leads.filter(l => l.status === filter))
  }, [filter, leads])

  async function handleConvert(id) {
    setLoading(true)
    const res = await convertLead(id)
    if (res.success) { showSnackbar('Lead converted!'); setSelected(null); loadLeads() }
    setLoading(false)
  }

  async function handleUpdateStatus(id, status) {
    setLoading(true)
    const res = await updateLead({ leadId: id, status })
    if (res.success) { showSnackbar('Status updated'); setSelected(null); loadLeads() }
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this lead?')) return
    setLoading(true)
    const res = await deleteLead(id)
    if (res.success) { showSnackbar('Lead deleted'); setSelected(null); loadLeads() }
    setLoading(false)
  }

  return (
    <>
      <Loading show={loading} />
      <div className="filter-chips">
        {['all', 'New Lead', 'Enquiry', 'Converted'].map(f => (
          <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>
      <div className="leads-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons">inbox</span>
            <h3>No Results</h3>
          </div>
        ) : (
          filtered.map(lead => <LeadCard key={lead.id} lead={lead} onClick={setSelected} />)
        )}
      </div>
      <LeadModal lead={selected} onClose={() => setSelected(null)}
        onConvert={handleConvert} onUpdateStatus={handleUpdateStatus} onDelete={handleDelete} />
    </>
  )
}
