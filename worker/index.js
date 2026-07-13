export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      const action = url.searchParams.get('action')
      let result

      switch (action) {
        case 'getDashboard':
          result = await getDashboard(env)
          break
        case 'getLeads':
          result = await getLeads(env, url.searchParams)
          break
        case 'getLead':
          result = await getLead(env, url.searchParams.get('id'))
          break
        case 'addLead':
          result = await addLead(env, url.searchParams)
          break
        case 'updateLead':
          result = await updateLead(env, url.searchParams)
          break
        case 'deleteLead':
          result = await deleteLead(env, url.searchParams.get('leadId'))
          break
        case 'convertLead':
          result = await convertLead(env, url.searchParams.get('leadId'))
          break
        case 'searchLeads':
          result = await searchLeads(env, url.searchParams.get('query'))
          break
        default:
          result = { success: false, message: 'Invalid action' }
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (err) {
      return new Response(JSON.stringify({ success: false, message: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  },

  // Cron trigger for syncing D1 to Google Sheets
  async scheduled(event, env) {
    await syncToSheets(env)
  }
}

function generateId() {
  return 'LEAD-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

function getISTTimestamp() {
  const now = new Date()
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
  const y = ist.getFullYear()
  const m = String(ist.getMonth() + 1).padStart(2, '0')
  const d = String(ist.getDate()).padStart(2, '0')
  const h = String(ist.getHours()).padStart(2, '0')
  const min = String(ist.getMinutes()).padStart(2, '0')
  const s = String(ist.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

async function getDashboard(env) {
  const { results } = await env.DB.prepare(
    'SELECT status, COUNT(*) as count FROM leads GROUP BY status'
  ).all()

  const stats = { totalLeads: 0, totalEnquiries: 0, totalConversions: 0, conversionRate: 0 }
  results.forEach(r => {
    if (r.status === 'New Lead') stats.totalLeads = r.count
    else if (r.status === 'Enquiry') stats.totalEnquiries = r.count
    else if (r.status === 'Converted') stats.totalConversions = r.count
  })

  const total = stats.totalLeads + stats.totalEnquiries + stats.totalConversions
  if (total > 0) stats.conversionRate = Math.round((stats.totalConversions / total) * 100)

  const { results: recent } = await env.DB.prepare(
    'SELECT * FROM leads ORDER BY created_at DESC LIMIT 5'
  ).all()

  return { success: true, dashboard: { ...stats, recentLeads: recent } }
}

async function getLeads(env, params) {
  let query = 'SELECT * FROM leads'
  const binds = []
  if (params.get('status')) {
    query += ' WHERE status = ?'
    binds.push(params.get('status'))
  }
  query += ' ORDER BY created_at DESC'

  const { results } = binds.length
    ? await env.DB.prepare(query).bind(...binds).all()
    : await env.DB.prepare(query).all()

  return { success: true, leads: results, total: results.length }
}

async function getLead(env, id) {
  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first()
  if (!lead) return { success: false, message: 'Lead not found' }
  return { success: true, lead }
}

async function addLead(env, params) {
  const id = generateId()
  const timestamp = getISTTimestamp()

  await env.DB.prepare(
    `INSERT INTO leads (id, company_name, contact_person, phone, area, machine_model, price, latitude, longitude, location_address, status, notes, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New Lead', ?, ?, ?, 0)`
  ).bind(
    id,
    params.get('companyName') || '',
    params.get('contactPerson') || '',
    params.get('phone') || '',
    params.get('area') || '',
    params.get('machineModel') || '',
    parseInt(params.get('price')) || 0,
    params.get('latitude') || '',
    params.get('longitude') || '',
    params.get('locationAddress') || '',
    params.get('notes') || '',
    timestamp,
    timestamp
  ).run()

  return { success: true, message: 'Lead added successfully', leadId: id }
}

async function updateLead(env, params) {
  const leadId = params.get('leadId')
  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId).first()
  if (!lead) return { success: false, message: 'Lead not found' }

  const updates = []
  const binds = []

  const fields = {
    company_name: 'companyName', contact_person: 'contactPerson', phone: 'phone',
    area: 'area', machine_model: 'machineModel', price: 'price',
    latitude: 'latitude', longitude: 'longitude', location_address: 'locationAddress',
    status: 'status', notes: 'notes'
  }

  for (const [col, param] of Object.entries(fields)) {
    const val = params.get(param)
    if (val !== null && val !== undefined && val !== '') {
      updates.push(`${col} = ?`)
      binds.push(col === 'price' ? parseInt(val) : val)
    }
  }

  if (updates.length === 0) return { success: false, message: 'No fields to update' }

  updates.push('updated_at = ?', 'synced = 0')
  binds.push(getISTTimestamp(), leadId)

  await env.DB.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).bind(...binds).run()
  return { success: true, message: 'Lead updated successfully' }
}

async function deleteLead(env, leadId) {
  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId).first()
  if (!lead) return { success: false, message: 'Lead not found' }

  await env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(leadId).run()
  return { success: true, message: 'Lead deleted successfully' }
}

async function convertLead(env, leadId) {
  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId).first()
  if (!lead) return { success: false, message: 'Lead not found' }

  await env.DB.prepare(
    "UPDATE leads SET status = 'Converted', updated_at = ?, synced = 0 WHERE id = ?"
  ).bind(getISTTimestamp(), leadId).run()

  return { success: true, message: 'Lead converted successfully' }
}

async function searchLeads(env, query) {
  const q = `%${query}%`
  const { results } = await env.DB.prepare(
    `SELECT * FROM leads WHERE company_name LIKE ? OR contact_person LIKE ? OR area LIKE ? OR machine_model LIKE ? ORDER BY created_at DESC`
  ).bind(q, q, q, q).all()

  return { success: true, leads: results, total: results.length }
}

// Sync unsynced leads to Google Sheets
async function syncToSheets(env) {
  if (!env.APPS_SCRIPT_URL) return

  const { results } = await env.DB.prepare(
    'SELECT * FROM leads WHERE synced = 0 LIMIT 50'
  ).all()

  if (results.length === 0) return

  for (const lead of results) {
    try {
      const params = new URLSearchParams({
        action: 'addLead',
        companyName: lead.company_name,
        contactPerson: lead.contact_person,
        phone: lead.phone,
        area: lead.area,
        machineModel: lead.machine_model,
        price: lead.price,
        latitude: lead.latitude || '',
        longitude: lead.longitude || '',
        locationAddress: lead.location_address || '',
        notes: lead.notes || '',
      })

      const res = await fetch(`${env.APPS_SCRIPT_URL}?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        await env.DB.prepare('UPDATE leads SET synced = 1 WHERE id = ?').bind(lead.id).run()
      }
    } catch (err) {
      console.error(`Sync failed for ${lead.id}:`, err.message)
    }
  }
}
