import { useState, useEffect, useContext } from 'react'
import { getLeads, deleteLead, convertLead, updateLead } from '../api'
import { SnackbarContext } from '../App'
import LeadCard from '../components/LeadCard'
import LeadModal from '../components/LeadModal'
import Loading from '../components/Loading'

export default function Enquiries() {
  const showSnackbar = useContext(SnackbarContext)
  const [leads, setLeads] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await getLeads('Enquiry')
    if (res.success) setLeads(res.leads)
    setLoading(false)
  }

  async function handleConvert(id) {
    setLoading(true)
    const res = await convertLead(id)
    if (res.success) { showSnackbar('Converted!'); setSelected(null); load() }
    setLoading(false)
  }

  async function handleUpdateStatus(id, status) {
    setLoading(true)
    const res = await updateLead({ leadId: id, status })
    if (res.success) { showSnackbar('Updated'); setSelected(null); load() }
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete?')) return
    setLoading(true)
    const res = await deleteLead(id)
    if (res.success) { showSnackbar('Deleted'); setSelected(null); load() }
    setLoading(false)
  }

  return (
    <>
      <Loading show={loading} />
      {leads.length === 0 && !loading ? (
        <div className="empty-state">
          <span className="material-icons">help_outline</span>
          <h3>No Enquiries Yet</h3>
        </div>
      ) : (
        <div className="leads-list">
          {leads.map(lead => <LeadCard key={lead.id} lead={lead} onClick={setSelected} />)}
        </div>
      )}
      <LeadModal lead={selected} onClose={() => setSelected(null)}
        onConvert={handleConvert} onUpdateStatus={handleUpdateStatus} onDelete={handleDelete} />
    </>
  )
}
