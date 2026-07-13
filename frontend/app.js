/**
 * MacpowerCRM - Frontend JavaScript
 * Handles all client-side functionality
 */

// ==================== Configuration ====================
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbwUnvDK2g1_lA8kufwSrkjJvTXAGkddnIpJwhJ5wWa1oWs4zWI-LEFFHGPuIFLw2M6CDQ/exec',
  STORAGE_KEY: 'macpower_crm_data'
};

// ==================== State Management ====================
const state = {
  currentPage: 'dashboard',
  leads: [],
  filteredLeads: [],
  currentFilter: 'all',
  location: {
    latitude: null,
    longitude: null,
    address: ''
  }
};

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
  // Hide splash screen after delay
  setTimeout(() => {
    document.getElementById('splash-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
  }, 1800);

  initializeEventListeners();
  loadDashboard();
});

function initializeEventListeners() {
  // Menu button
  document.getElementById('menuBtn').addEventListener('click', toggleDrawer);
  document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);

  // Drawer items
  document.querySelectorAll('.drawer-item').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.page);
      closeDrawer();
    });
  });

  // Bottom navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.page);
    });
  });

  // Search functionality
  document.getElementById('searchBtn').addEventListener('click', toggleSearch);
  document.getElementById('closeSearchBtn').addEventListener('click', toggleSearch);
  document.getElementById('searchInput').addEventListener('input', handleSearch);

  // Filter chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.currentFilter = chip.dataset.filter;
      filterLeads();
    });
  });

  // Form submission
  document.getElementById('leadForm').addEventListener('submit', handleFormSubmit);

  // Location button
  document.getElementById('getLocationBtn').addEventListener('click', getCurrentLocation);

  // Show API endpoint in settings
  document.getElementById('apiEndpoint').textContent = CONFIG.API_URL;
}

// ==================== Navigation ====================
function navigateTo(page) {
  state.currentPage = page;

  // Update pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`${page}Page`).classList.add('active');

  // Update title
  const titles = {
    dashboard: 'Dashboard',
    addLead: 'Add New Lead',
    leads: 'All Leads',
    enquiries: 'Enquiries',
    conversions: 'Conversions',
    settings: 'Settings'
  };
  document.getElementById('pageTitle').textContent = titles[page] || 'MacpowerCRM';

  // Update bottom nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Update FAB visibility
  document.getElementById('fabBtn').style.display = page === 'addLead' ? 'none' : 'flex';

  // Load data for the page
  switch(page) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'leads':
      loadLeads();
      break;
    case 'enquiries':
      loadEnquiries();
      break;
    case 'conversions':
      loadConversions();
      break;
  }
}

// ==================== Drawer ====================
function toggleDrawer() {
  const drawer = document.getElementById('sideDrawer');
  const overlay = document.getElementById('drawerOverlay');
  drawer.classList.toggle('open');
  overlay.classList.toggle('visible');
}

function closeDrawer() {
  document.getElementById('sideDrawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('visible');
}

// ==================== Search ====================
function toggleSearch() {
  const searchBar = document.getElementById('searchBar');
  const isVisible = searchBar.style.display !== 'none';
  searchBar.style.display = isVisible ? 'none' : 'flex';
  if (!isVisible) {
    document.getElementById('searchInput').focus();
  }
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  if (!query) {
    state.filteredLeads = [...state.leads];
  } else {
    state.filteredLeads = state.leads.filter(lead =>
      lead.companyName.toLowerCase().includes(query) ||
      lead.contactPerson.toLowerCase().includes(query) ||
      lead.area.toLowerCase().includes(query) ||
      lead.machineModel.toLowerCase().includes(query)
    );
  }
  renderLeadsList('leadsList', state.filteredLeads);
}

// ==================== API Functions ====================
async function apiCall(action, method = 'GET', data = null) {
  if (!CONFIG.API_URL) {
    showSnackbar('Please configure API URL first');
    return null;
  }

  try {
    let url = `${CONFIG.API_URL}?action=${action}`;
    
    // Add data as query params (avoids CORS issues with Apps Script)
    if (data) {
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          url += `&${key}=${encodeURIComponent(data[key])}`;
        }
      });
    }

    const response = await fetch(url);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API Error:', error);
    showSnackbar('Network error. Please try again.');
    return null;
  }
}

// ==================== Dashboard ====================
async function loadDashboard() {
  showLoading();

  const result = await apiCall('getDashboard');

  if (result && result.success) {
    const dashboard = result.dashboard;

    // Animate counter animation
    animateCounter('leadsCount', dashboard.totalLeads);
    animateCounter('enquiriesCount', dashboard.totalEnquiries);
    animateCounter('conversionsCount', dashboard.totalConversions);
    document.getElementById('conversionRate').textContent = `${dashboard.conversionRate}%`;

    // Render recent leads
    renderRecentLeads(dashboard.recentLeads);
  } else {
    // Use local data if API fails
    loadLocalData();
  }

  hideLoading();
}

function animateCounter(elementId, targetValue) {
  const element = document.getElementById(elementId);
  const startValue = parseInt(element.textContent) || 0;
  const duration = 500;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentValue = Math.round(startValue + (targetValue - startValue) * progress);
    element.textContent = currentValue;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function renderRecentLeads(leads) {
  const container = document.getElementById('recentLeadsList');

  if (!leads || leads.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">people</span>
        <h3>No Leads Yet</h3>
        <p>Add your first lead to get started</p>
      </div>
    `;
    return;
  }

  container.innerHTML = leads.map(lead => createLeadCard(lead)).join('');
}

// ==================== Leads ====================
async function loadLeads() {
  showLoading();

  const result = await apiCall('getLeads');

  if (result && result.success) {
    state.leads = result.leads;
    filterLeads();
  } else {
    loadLocalData();
  }

  hideLoading();
}

async function loadEnquiries() {
  showLoading();

  const result = await apiCall('getLeads&status=Enquiry');

  if (result && result.success) {
    renderLeadsList('enquiriesList', result.leads);
    document.getElementById('enquiriesEmpty').style.display = result.leads.length ? 'none' : 'block';
  }

  hideLoading();
}

async function loadConversions() {
  showLoading();

  const result = await apiCall('getLeads&status=Converted');

  if (result && result.success) {
    renderLeadsList('conversionsList', result.leads);
    document.getElementById('conversionsEmpty').style.display = result.leads.length ? 'none' : 'block';
  }

  hideLoading();
}

function filterLeads() {
  if (state.currentFilter === 'all') {
    state.filteredLeads = [...state.leads];
  } else {
    state.filteredLeads = state.leads.filter(lead => lead.status === state.currentFilter);
  }
  renderLeadsList('leadsList', state.filteredLeads);
}

function renderLeadsList(containerId, leads) {
  const container = document.getElementById(containerId);

  if (!leads || leads.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">inbox</span>
        <h3>No Results</h3>
        <p>No leads found</p>
      </div>
    `;
    return;
  }

  container.innerHTML = leads.map(lead => createLeadCard(lead)).join('');
}

function createLeadCard(lead) {
  const statusClass = getStatusClass(lead.status);
  const date = new Date(lead.timestamp);
  const formattedDate = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return `
    <div class="lead-card" onclick="openLeadModal('${lead.id}')">
      <div class="lead-card-header">
        <span class="lead-card-title">${escapeHtml(lead.companyName)}</span>
        <span class="lead-status ${statusClass}">${lead.status}</span>
      </div>
      <div class="lead-card-details">
        <div class="lead-detail">
          <span class="material-icons">person</span>
          <span>${escapeHtml(lead.contactPerson)}</span>
        </div>
        <div class="lead-detail">
          <span class="material-icons">phone</span>
          <span>${escapeHtml(lead.phone)}</span>
        </div>
        <div class="lead-detail">
          <span class="material-icons">location_on</span>
          <span>${escapeHtml(lead.area)}</span>
        </div>
        <div class="lead-detail">
          <span class="material-icons">engineering</span>
          <span>${escapeHtml(lead.machineModel)}</span>
        </div>
      </div>
      <div class="lead-card-footer">
        <span class="lead-price">₹${formatPrice(lead.price)}</span>
        <span class="lead-date">${formattedDate} ${formattedTime}</span>
      </div>
    </div>
  `;
}

function getStatusClass(status) {
  switch(status) {
    case 'New Lead': return 'new';
    case 'Enquiry': return 'enquiry';
    case 'Converted': return 'converted';
    case 'Lost': return 'lost';
    default: return 'new';
  }
}

function formatPrice(price) {
  return Number(price).toLocaleString('en-IN');
}

// ==================== Lead Modal ====================
async function openLeadModal(leadId) {
  showLoading();

  const result = await apiCall(`getLead&id=${leadId}`);

  if (result && result.success) {
    const lead = result.lead;
    const modal = document.getElementById('leadModal');
    const modalBody = document.getElementById('modalBody');
    const modalActions = document.getElementById('modalActions');

    modalBody.innerHTML = `
      <div class="detail-item">
        <div class="detail-icon"><span class="material-icons">business</span></div>
        <div class="detail-content">
          <div class="detail-label">Company Name</div>
          <div class="detail-value">${escapeHtml(lead.companyName)}</div>
        </div>
      </div>
      <div class="detail-item">
        <div class="detail-icon"><span class="material-icons">person</span></div>
        <div class="detail-content">
          <div class="detail-label">Contact Person</div>
          <div class="detail-value">${escapeHtml(lead.contactPerson)}</div>
        </div>
      </div>
      <div class="detail-item">
        <div class="detail-icon"><span class="material-icons">phone</span></div>
        <div class="detail-content">
          <div class="detail-label">Phone Number</div>
          <div class="detail-value">${escapeHtml(lead.phone)}</div>
        </div>
      </div>
      <div class="detail-item">
        <div class="detail-icon"><span class="material-icons">location_on</span></div>
        <div class="detail-content">
          <div class="detail-label">Area</div>
          <div class="detail-value">${escapeHtml(lead.area)}</div>
        </div>
      </div>
      <div class="detail-item">
        <div class="detail-icon"><span class="material-icons">engineering</span></div>
        <div class="detail-content">
          <div class="detail-label">Machine Model</div>
          <div class="detail-value">${escapeHtml(lead.machineModel)}</div>
        </div>
      </div>
      <div class="detail-item">
        <div class="detail-icon"><span class="material-icons">currency_rupee</span></div>
        <div class="detail-content">
          <div class="detail-label">Price</div>
          <div class="detail-value">₹${formatPrice(lead.price)}</div>
        </div>
      </div>
      <div class="detail-item">
        <div class="detail-icon"><span class="material-icons">map</span></div>
        <div class="detail-content">
          <div class="detail-label">Location</div>
          <div class="detail-value">${lead.locationAddress || 'Not captured'}</div>
        </div>
      </div>
      <div class="detail-item">
        <div class="detail-icon"><span class="material-icons">info</span></div>
        <div class="detail-content">
          <div class="detail-label">Status</div>
          <div class="detail-value">${lead.status}</div>
        </div>
      </div>
      ${lead.notes ? `
      <div class="detail-item">
        <div class="detail-icon"><span class="material-icons">note</span></div>
        <div class="detail-content">
          <div class="detail-label">Notes</div>
          <div class="detail-value">${escapeHtml(lead.notes)}</div>
        </div>
      </div>
      ` : ''}
    `;

    // Action buttons based on status
    let actionsHTML = '';
    if (lead.status !== 'Converted') {
      actionsHTML += `<button class="btn btn-success" onclick="convertLead('${lead.id}')">Convert</button>`;
    }
    if (lead.status !== 'Enquiry' && lead.status !== 'Converted') {
      actionsHTML += `<button class="btn btn-outlined" onclick="updateLeadStatus('${lead.id}', 'Enquiry')">Mark Enquiry</button>`;
    }
    actionsHTML += `<button class="btn btn-outlined" onclick="deleteLead('${lead.id}')">Delete</button>`;
    modalActions.innerHTML = actionsHTML;

    modal.style.display = 'flex';
  }

  hideLoading();
}

function closeModal() {
  document.getElementById('leadModal').style.display = 'none';
}

async function convertLead(leadId) {
  showLoading();

  const result = await apiCall('convertLead', 'GET', { leadId });

  if (result && result.success) {
    showSnackbar('Lead converted successfully!');
    closeModal();
    loadDashboard();
    if (state.currentPage === 'leads') loadLeads();
  }

  hideLoading();
}

async function updateLeadStatus(leadId, status) {
  showLoading();

  const result = await apiCall('updateLead', 'GET', { leadId, status });

  if (result && result.success) {
    showSnackbar('Lead status updated!');
    closeModal();
    if (state.currentPage === 'leads') loadLeads();
    if (state.currentPage === 'enquiries') loadEnquiries();
  }

  hideLoading();
}

async function deleteLead(leadId) {
  if (!confirm('Are you sure you want to delete this lead?')) return;

  showLoading();

  const result = await apiCall('deleteLead', 'GET', { leadId });

  if (result && result.success) {
    showSnackbar('Lead deleted');
    closeModal();
    loadDashboard();
    if (state.currentPage === 'leads') loadLeads();
  }

  hideLoading();
}

// ==================== Location ====================
function getCurrentLocation() {
  const locationCard = document.getElementById('locationCard');
  const statusText = document.getElementById('locationStatus');
  const coordsText = document.getElementById('locationCoords');
  const btn = document.getElementById('getLocationBtn');

  if (!navigator.geolocation) {
    showSnackbar('Geolocation is not supported by your browser');
    return;
  }

  statusText.textContent = 'Getting location...';
  btn.disabled = true;
  btn.innerHTML = '<span class="material-icons">hourglass_empty</span> Loading...';

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      state.location.latitude = latitude;
      state.location.longitude = longitude;

      document.getElementById('latitude').value = latitude;
      document.getElementById('longitude').value = longitude;

      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        state.location.address = data.display_name || `${latitude}, ${longitude}`;
        document.getElementById('locationAddress').value = state.location.address;
        statusText.textContent = 'Location captured!';
        coordsText.textContent = state.location.address;
      } catch (error) {
        state.location.address = `${latitude}, ${longitude}`;
        document.getElementById('locationAddress').value = state.location.address;
        statusText.textContent = 'Location captured!';
        coordsText.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }

      locationCard.classList.add('success');
      btn.innerHTML = '<span class="material-icons">check</span> Done';
      btn.disabled = false;

      showSnackbar('Location captured successfully');
    },
    (error) => {
      let message = 'Unable to get location';
      switch(error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location permission denied. Please enable in settings.';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Location information unavailable';
          break;
        case error.TIMEOUT:
          message = 'Location request timed out';
          break;
      }
      statusText.textContent = 'Tap to get your location';
      btn.innerHTML = '<span class="material-icons">gps_fixed</span> Get Location';
      btn.disabled = false;
      showSnackbar(message);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// ==================== Form Handling ====================
async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = {
    companyName: document.getElementById('companyName').value.trim(),
    contactPerson: document.getElementById('contactPerson').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    area: document.getElementById('area').value.trim(),
    machineModel: document.getElementById('machineModel').value.trim(),
    price: parseInt(document.getElementById('price').value) || 0,
    latitude: state.location.latitude,
    longitude: state.location.longitude,
    locationAddress: state.location.address,
    notes: document.getElementById('notes').value.trim()
  };

  // Validation
  if (!formData.companyName || !formData.contactPerson || !formData.phone) {
    showSnackbar('Please fill in all required fields');
    return;
  }

  showLoading();

  const result = await apiCall('addLead', 'GET', formData);

  if (result && result.success) {
    showSnackbar('Lead added successfully!');
    resetForm();
    navigateTo('dashboard');
  } else {
    showSnackbar('Failed to add lead. Please try again.');
  }

  hideLoading();
}

function resetForm() {
  document.getElementById('leadForm').reset();
  state.location = { latitude: null, longitude: null, address: '' };
  document.getElementById('locationStatus').textContent = 'Tap to get your location';
  document.getElementById('locationCoords').textContent = '';
  document.getElementById('locationCard').classList.remove('success');
  document.getElementById('getLocationBtn').innerHTML = '<span class="material-icons">gps_fixed</span> Get Location';
}

// ==================== Local Data ====================
function loadLocalData() {
  const localData = localStorage.getItem(CONFIG.STORAGE_KEY);
  if (localData) {
    const data = JSON.parse(localData);
    state.leads = data.leads || [];
    filterLeads();
  }
}

function saveLocalData() {
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
    leads: state.leads
  }));
}

// ==================== Utility Functions ====================
function showSnackbar(message) {
  const snackbar = document.getElementById('snackbar');
  document.getElementById('snackbarText').textContent = message;
  snackbar.classList.add('visible');

  setTimeout(() => {
    snackbar.classList.remove('visible');
  }, 3000);
}

function hideSnackbar() {
  document.getElementById('snackbar').classList.remove('visible');
}

function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function refreshData() {
  showSnackbar('Refreshing data...');
  await loadDashboard();
  showSnackbar('Data refreshed');
}

// Make functions available globally
window.navigateTo = navigateTo;
window.openLeadModal = openLeadModal;
window.closeModal = closeModal;
window.convertLead = convertLead;
window.updateLeadStatus = updateLeadStatus;
window.deleteLead = deleteLead;
window.resetForm = resetForm;
window.refreshData = refreshData;
