export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      const action = url.searchParams.get('action')

      // Public action: register user (called after Clerk sign-up)
      if (action === 'registerUser') {
        const userId = await verifyAuth(request, env)
        if (!userId) return unauthorized(corsHeaders)
        const result = await registerUser(env, url.searchParams, userId)
        return jsonResponse(result, corsHeaders)
      }

      // Public action: check if user is registered in our DB
      if (action === 'getMe') {
        const userId = await verifyAuth(request, env)
        if (!userId) return unauthorized(corsHeaders)
        const result = await getMe(env, userId)
        return jsonResponse(result, corsHeaders)
      }

      // All other actions require auth
      const userId = await verifyAuth(request, env)
      if (!userId) return unauthorized(corsHeaders)

      let result

      switch (action) {
        case 'getDashboard':
          result = await getDashboard(env, userId)
          break
        case 'getLeads':
          result = await getLeads(env, url.searchParams, userId)
          break
        case 'getLead':
          result = await getLead(env, url.searchParams.get('id'), userId)
          break
        case 'addLead':
          result = await addLead(env, url.searchParams, userId)
          break
        case 'updateLead':
          result = await updateLead(env, url.searchParams, userId)
          break
        case 'deleteLead':
          result = await deleteLead(env, url.searchParams.get('leadId'), userId)
          break
        case 'convertLead':
          result = await convertLead(env, url.searchParams.get('leadId'), userId)
          break
        case 'searchLeads':
          result = await searchLeads(env, url.searchParams.get('query'), userId)
          break
        // Sharing endpoints
        case 'shareLead':
          result = await shareLead(env, url.searchParams, userId)
          break
        case 'getSharedWithMe':
          result = await getSharedWithMe(env, userId)
          break
        case 'getLeadShares':
          result = await getLeadShares(env, url.searchParams.get('leadId'), userId)
          break
        case 'unshareLead':
          result = await unshareLead(env, url.searchParams, userId)
          break
        // User lookup for sharing
        case 'searchUsers':
          result = await searchUsers(env, url.searchParams.get('query'), userId)
          break
        default:
          result = { success: false, message: 'Invalid action' }
      }

      return jsonResponse(result, corsHeaders)
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

function jsonResponse(data, corsHeaders) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function unauthorized(corsHeaders) {
  return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// ==================== Auth Verification ====================

async function verifyAuth(request, env) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)

  try {
    // Decode JWT and verify with Clerk's JWKS
    const payload = await verifyClerkJWT(token, env)
    return payload?.sub || null
  } catch (err) {
    console.error('Auth verification failed:', err.message)
    return null
  }
}

async function verifyClerkJWT(token, env) {
  // Decode header to get kid
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT')

  const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')))
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))

  // Check expiration
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp < now) throw new Error('Token expired')

  // Fetch Clerk JWKS
  const jwksUrl = `https://${env.CLERK_ISSUER_DOMAIN}/.well-known/jwks.json`
  const jwksResponse = await fetch(jwksUrl)
  const jwks = await jwksResponse.json()

  // Find the matching key
  const key = jwks.keys.find(k => k.kid === header.kid)
  if (!key) throw new Error('Key not found in JWKS')

  // Import the key and verify signature
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    key,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const signatureBytes = base64UrlDecode(parts[2])
  const dataBytes = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)

  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    signatureBytes,
    dataBytes
  )

  if (!valid) throw new Error('Invalid signature')

  return payload
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = str.length % 4
  if (pad) str += '='.repeat(4 - pad)
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// ==================== User Management ====================

async function registerUser(env, params, clerkUserId) {
  const username = (params.get('username') || '').trim().toLowerCase()
  const email = (params.get('email') || '').trim().toLowerCase()
  const fullName = params.get('fullName') || ''

  if (!username || !email) {
    return { success: false, message: 'Username and email are required' }
  }

  // Validate username format (alphanumeric, underscores, hyphens, 3-30 chars)
  if (!/^[a-z0-9_\-]{3,30}$/.test(username)) {
    return { success: false, message: 'Username must be 3-30 characters, lowercase letters, numbers, underscores, and hyphens only' }
  }

  // Check if user already registered
  const existing = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(clerkUserId).first()
  if (existing) {
    return { success: true, message: 'User already registered', user: existing }
  }

  // Check username uniqueness
  const usernameCheck = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()
  if (usernameCheck) {
    return { success: false, message: 'Username already taken' }
  }

  // Check email uniqueness
  const emailCheck = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (emailCheck) {
    return { success: false, message: 'Email already registered' }
  }

  const timestamp = getISTTimestamp()

  await env.DB.prepare(
    'INSERT INTO users (id, username, email, full_name, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(clerkUserId, username, email, fullName, timestamp).run()

  return { success: true, message: 'User registered successfully', user: { id: clerkUserId, username, email, full_name: fullName } }
}

async function getMe(env, userId) {
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!user) return { success: false, message: 'User not registered', registered: false }
  return { success: true, registered: true, user }
}

async function searchUsers(env, query, currentUserId) {
  if (!query || query.length < 2) {
    return { success: false, message: 'Search query must be at least 2 characters' }
  }

  const q = `%${query.toLowerCase()}%`
  const { results } = await env.DB.prepare(
    'SELECT id, username, email, full_name FROM users WHERE (username LIKE ? OR email LIKE ?) AND id != ? LIMIT 10'
  ).bind(q, q, currentUserId).all()

  return { success: true, users: results }
}

// ==================== Helpers ====================

function generateId() {
  return 'LEAD-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

function generateShareId() {
  return 'SHARE-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
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

// ==================== Lead CRUD (User-Scoped) ====================

async function getDashboard(env, userId) {
  // Stats for user's own leads + shared leads
  const { results } = await env.DB.prepare(
    `SELECT status, COUNT(*) as count FROM leads WHERE user_id = ? GROUP BY status`
  ).bind(userId).all()

  const stats = { totalLeads: 0, totalEnquiries: 0, totalConversions: 0, conversionRate: 0 }
  results.forEach(r => {
    if (r.status === 'New Lead') stats.totalLeads = r.count
    else if (r.status === 'Enquiry') stats.totalEnquiries = r.count
    else if (r.status === 'Converted') stats.totalConversions = r.count
  })

  const total = stats.totalLeads + stats.totalEnquiries + stats.totalConversions
  if (total > 0) stats.conversionRate = Math.round((stats.totalConversions / total) * 100)

  const { results: recent } = await env.DB.prepare(
    'SELECT * FROM leads WHERE user_id = ? ORDER BY created_at DESC LIMIT 5'
  ).bind(userId).all()

  // Count shared with me
  const sharedCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM lead_shares WHERE shared_with_user_id = ?'
  ).bind(userId).first()

  return { success: true, dashboard: { ...stats, recentLeads: recent, sharedWithMeCount: sharedCount?.count || 0 } }
}

async function getLeads(env, params, userId) {
  let query = 'SELECT * FROM leads WHERE user_id = ?'
  const binds = [userId]
  if (params.get('status')) {
    query += ' AND status = ?'
    binds.push(params.get('status'))
  }
  query += ' ORDER BY created_at DESC'

  const { results } = await env.DB.prepare(query).bind(...binds).all()
  return { success: true, leads: results, total: results.length }
}

async function getLead(env, id, userId) {
  // Allow access if owner or shared with user
  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first()
  if (!lead) return { success: false, message: 'Lead not found' }

  if (lead.user_id !== userId) {
    // Check if shared with user
    const share = await env.DB.prepare(
      'SELECT id FROM lead_shares WHERE lead_id = ? AND shared_with_user_id = ?'
    ).bind(id, userId).first()
    if (!share) return { success: false, message: 'Access denied' }
  }

  return { success: true, lead }
}

async function addLead(env, params, userId) {
  const id = generateId()
  const timestamp = getISTTimestamp()

  await env.DB.prepare(
    `INSERT INTO leads (id, user_id, company_name, contact_person, phone, area, machine_model, price, latitude, longitude, location_address, status, notes, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New Lead', ?, ?, ?, 0)`
  ).bind(
    id,
    userId,
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

async function updateLead(env, params, userId) {
  const leadId = params.get('leadId')
  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').bind(leadId, userId).first()
  if (!lead) return { success: false, message: 'Lead not found or access denied' }

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

async function deleteLead(env, leadId, userId) {
  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').bind(leadId, userId).first()
  if (!lead) return { success: false, message: 'Lead not found or access denied' }

  // Delete shares for this lead
  await env.DB.prepare('DELETE FROM lead_shares WHERE lead_id = ?').bind(leadId).run()
  // Delete the lead
  await env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(leadId).run()
  return { success: true, message: 'Lead deleted successfully' }
}

async function convertLead(env, leadId, userId) {
  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').bind(leadId, userId).first()
  if (!lead) return { success: false, message: 'Lead not found or access denied' }

  await env.DB.prepare(
    "UPDATE leads SET status = 'Converted', updated_at = ?, synced = 0 WHERE id = ?"
  ).bind(getISTTimestamp(), leadId).run()

  return { success: true, message: 'Lead converted successfully' }
}

async function searchLeads(env, query, userId) {
  const q = `%${query}%`
  const { results } = await env.DB.prepare(
    `SELECT * FROM leads WHERE user_id = ? AND (company_name LIKE ? OR contact_person LIKE ? OR area LIKE ? OR machine_model LIKE ?) ORDER BY created_at DESC`
  ).bind(userId, q, q, q, q).all()

  return { success: true, leads: results, total: results.length }
}

// ==================== Lead Sharing ====================

async function shareLead(env, params, userId) {
  const leadId = params.get('leadId')
  const shareWith = (params.get('shareWith') || '').trim().toLowerCase() // username or email

  if (!leadId || !shareWith) {
    return { success: false, message: 'leadId and shareWith (username or email) are required' }
  }

  // Verify lead ownership
  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').bind(leadId, userId).first()
  if (!lead) return { success: false, message: 'Lead not found or you do not own this lead' }

  // Find the target user by username or email
  const targetUser = await env.DB.prepare(
    'SELECT id, username, email, full_name FROM users WHERE username = ? OR email = ?'
  ).bind(shareWith, shareWith).first()

  if (!targetUser) return { success: false, message: 'User not found. Check the username or email.' }
  if (targetUser.id === userId) return { success: false, message: 'Cannot share a lead with yourself' }

  // Check if already shared
  const existingShare = await env.DB.prepare(
    'SELECT id FROM lead_shares WHERE lead_id = ? AND shared_with_user_id = ?'
  ).bind(leadId, targetUser.id).first()

  if (existingShare) return { success: false, message: `Lead already shared with ${targetUser.username}` }

  // Create the share
  const shareId = generateShareId()
  const timestamp = getISTTimestamp()

  await env.DB.prepare(
    'INSERT INTO lead_shares (id, lead_id, shared_by_user_id, shared_with_user_id, shared_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(shareId, leadId, userId, targetUser.id, timestamp).run()

  return { success: true, message: `Lead shared with ${targetUser.username}`, sharedWith: targetUser }
}

async function getSharedWithMe(env, userId) {
  const { results } = await env.DB.prepare(
    `SELECT l.*, ls.shared_at, ls.shared_by_user_id, u.username as shared_by_username, u.full_name as shared_by_name
     FROM lead_shares ls
     JOIN leads l ON ls.lead_id = l.id
     JOIN users u ON ls.shared_by_user_id = u.id
     WHERE ls.shared_with_user_id = ?
     ORDER BY ls.shared_at DESC`
  ).bind(userId).all()

  return { success: true, leads: results, total: results.length }
}

async function getLeadShares(env, leadId, userId) {
  // Only owner can see who the lead is shared with
  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').bind(leadId, userId).first()
  if (!lead) return { success: false, message: 'Lead not found or access denied' }

  const { results } = await env.DB.prepare(
    `SELECT ls.id as share_id, ls.shared_at, u.username, u.email, u.full_name
     FROM lead_shares ls
     JOIN users u ON ls.shared_with_user_id = u.id
     WHERE ls.lead_id = ?
     ORDER BY ls.shared_at DESC`
  ).bind(leadId).all()

  return { success: true, shares: results }
}

async function unshareLead(env, params, userId) {
  const leadId = params.get('leadId')
  const shareWithUserId = params.get('shareWithUserId')

  if (!leadId || !shareWithUserId) {
    return { success: false, message: 'leadId and shareWithUserId are required' }
  }

  // Verify lead ownership
  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').bind(leadId, userId).first()
  if (!lead) return { success: false, message: 'Lead not found or access denied' }

  await env.DB.prepare(
    'DELETE FROM lead_shares WHERE lead_id = ? AND shared_with_user_id = ?'
  ).bind(leadId, shareWithUserId).run()

  return { success: true, message: 'Lead unshared successfully' }
}

// ==================== Sync to Google Sheets ====================

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
