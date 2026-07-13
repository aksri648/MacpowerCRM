const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiCall(action, params = {}) {
  const url = new URL(API_BASE);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== '') {
      url.searchParams.set(key, val);
    }
  });
  const res = await fetch(url.toString());
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
