const API_BASE = import.meta.env.VITE_API_URL || 'https://macpower-crm-api.akshatsri648.workers.dev';

// Token getter function - set by useApiToken hook
let _getToken = null

export function setTokenGetter(fn) {
  _getToken = fn
}

async function apiCall(action, params = {}) {
  const url = new URL(API_BASE);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== '') {
      url.searchParams.set(key, val);
    }
  });

  const headers = {}
  if (_getToken) {
    try {
      const token = await _getToken()
      if (token) headers['Authorization'] = `Bearer ${token}`
    } catch (err) {
      console.error('Failed to get auth token:', err)
    }
  }

  const res = await fetch(url.toString(), { headers });
  return res.json();
}

export function getDashboard() {
  return apiCall('getDashboard');
}

export function getLeads(status) {
  return apiCall('getLeads', status ? { status } : {});
}

export function getLead(id) {
  return apiCall('getLead', { id });
}

export function addLead(data) {
  return apiCall('addLead', data);
}

export function updateLead(leadId, data) {
  return apiCall('updateLead', { leadId, ...data });
}

export function deleteLead(leadId) {
  return apiCall('deleteLead', { leadId });
}

export function convertLead(leadId) {
  return apiCall('convertLead', { leadId });
}

export function searchLeads(query) {
  return apiCall('searchLeads', { query });
}

// Sharing APIs
export function shareLead(leadId, shareWith) {
  return apiCall('shareLead', { leadId, shareWith });
}

export function getSharedWithMe() {
  return apiCall('getSharedWithMe');
}

export function getLeadShares(leadId) {
  return apiCall('getLeadShares', { leadId });
}

export function unshareLead(leadId, shareWithUserId) {
  return apiCall('unshareLead', { leadId, shareWithUserId });
}

// User search (for share autocomplete)
export function searchUsers(query) {
  return apiCall('searchUsers', { query });
}
