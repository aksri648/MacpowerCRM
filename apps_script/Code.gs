/**
 * MacpowerCRM - Google Apps Script Backend
 * Handles all CRUD operations for the CRM system
 */

// Spreadsheet ID - Replace with your actual Google Sheet ID
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const LEADS_SHEET = 'Leads';
const SETTINGS_SHEET = 'Settings';

/**
 * Creates the spreadsheet structure if it doesn't exist
 */
function setupSpreadsheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Create Leads sheet if not exists
  let leadsSheet = ss.getSheetByName(LEADS_SHEET);
  if (!leadsSheet) {
    leadsSheet = ss.insertSheet(LEADS_SHEET);
    leadsSheet.appendRow([
      'ID', 'Timestamp', 'CompanyName', 'ContactPerson', 'Phone',
      'Area', 'MachineModel', 'Price', 'Latitude', 'Longitude',
      'LocationAddress', 'Status', 'Notes'
    ]);
    // Format header row
    const headerRange = leadsSheet.getRange(1, 1, 1, 13);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1a73e8');
    headerRange.setFontColor('#ffffff');
  }
  
  // Create Settings sheet for dashboard config
  let settingsSheet = ss.getSheetByName(SETTINGS_SHEET);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SETTINGS_SHEET);
    settingsSheet.appendRow(['Key', 'Value']);
    settingsSheet.appendRow(['totalLeads', '0']);
    settingsSheet.appendRow(['totalEnquiries', '0']);
    settingsSheet.appendRow(['totalConversions', '0']);
  }
  
  return { success: true, message: 'Spreadsheet setup complete' };
}

/**
 * Handle POST requests (Create/Update operations)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch(action) {
      case 'addLead':
        return addLead(data);
      case 'updateLead':
        return updateLead(data);
      case 'deleteLead':
        return deleteLead(data);
      case 'convertLead':
        return convertLead(data);
      default:
        return jsonResponse({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    return jsonResponse({ success: false, message: error.toString() });
  }
}

/**
 * Handle GET requests (Read operations)
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    switch(action) {
      // Read operations
      case 'getLeads':
        return getLeads(e.parameter);
      case 'getDashboard':
        return getDashboard();
      case 'getLead':
        return getLead(e.parameter.id);
      case 'searchLeads':
        return searchLeads(e.parameter.query);
      
      // Write operations (via GET to avoid CORS)
      case 'addLead':
        return addLead(e.parameter);
      case 'updateLead':
        return updateLead(e.parameter);
      case 'deleteLead':
        return deleteLead(e.parameter);
      case 'convertLead':
        return convertLead(e.parameter);
      
      default:
        return jsonResponse({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    return jsonResponse({ success: false, message: error.toString() });
  }
}

/**
 * Add a new lead to the spreadsheet
 */
function addLead(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(LEADS_SHEET);
  
  // Generate unique ID
  const leadId = 'LEAD-' + new Date().getTime();
  
  // Get next empty row
  const lastRow = sheet.getLastRow() + 1;
  
  // Prepare row data
  const rowData = [
    leadId,
    new Date().toISOString(),
    data.companyName || '',
    data.contactPerson || '',
    data.phone || '',
    data.area || '',
    data.machineModel || '',
    data.price || 0,
    data.latitude || '',
    data.longitude || '',
    data.locationAddress || '',
    'New Lead',
    data.notes || ''
  ];
  
  // Insert row
  sheet.getRange(lastRow, 1, 1, rowData.length).setValues([rowData]);
  
  // Update counter
  updateCounter('totalLeads', 1);
  
  return jsonResponse({
    success: true,
    message: 'Lead added successfully',
    leadId: leadId
  });
}

/**
 * Update an existing lead
 */
function updateLead(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(LEADS_SHEET);
  const allData = sheet.getDataRange().getValues();
  
  // Find the lead by ID
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.leadId) {
      const rowNum = i + 1;
      
      // Update fields if provided
      if (data.companyName) sheet.getRange(rowNum, 3).setValue(data.companyName);
      if (data.contactPerson) sheet.getRange(rowNum, 4).setValue(data.contactPerson);
      if (data.phone) sheet.getRange(rowNum, 5).setValue(data.phone);
      if (data.area) sheet.getRange(rowNum, 6).setValue(data.area);
      if (data.machineModel) sheet.getRange(rowNum, 7).setValue(data.machineModel);
      if (data.price) sheet.getRange(rowNum, 8).setValue(data.price);
      if (data.latitude) sheet.getRange(rowNum, 9).setValue(data.latitude);
      if (data.longitude) sheet.getRange(rowNum, 10).setValue(data.longitude);
      if (data.locationAddress) sheet.getRange(rowNum, 11).setValue(data.locationAddress);
      if (data.status) sheet.getRange(rowNum, 12).setValue(data.status);
      if (data.notes) sheet.getRange(rowNum, 13).setValue(data.notes);
      
      return jsonResponse({
        success: true,
        message: 'Lead updated successfully'
      });
    }
  }
  
  return jsonResponse({ success: false, message: 'Lead not found' });
}

/**
 * Delete a lead
 */
function deleteLead(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(LEADS_SHEET);
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.leadId) {
      sheet.deleteRow(i + 1);
      
      if (allData[i][11] === 'New Lead') {
        updateCounter('totalLeads', -1);
      } else if (allData[i][11] === 'Enquiry') {
        updateCounter('totalEnquiries', -1);
      } else if (allData[i][11] === 'Converted') {
        updateCounter('totalConversions', -1);
      }
      
      return jsonResponse({
        success: true,
        message: 'Lead deleted successfully'
      });
    }
  }
  
  return jsonResponse({ success: false, message: 'Lead not found' });
}

/**
 * Convert a lead to successful conversion
 */
function convertLead(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(LEADS_SHEET);
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.leadId) {
      const rowNum = i + 1;
      const oldStatus = allData[i][11];
      
      // Update status to Converted
      sheet.getRange(rowNum, 12).setValue('Converted');
      
      // Update counters based on old status
      if (oldStatus === 'New Lead') {
        updateCounter('totalLeads', -1);
      } else if (oldStatus === 'Enquiry') {
        updateCounter('totalEnquiries', -1);
      }
      updateCounter('totalConversions', 1);
      
      return jsonResponse({
        success: true,
        message: 'Lead converted successfully'
      });
    }
  }
  
  return jsonResponse({ success: false, message: 'Lead not found' });
}

/**
 * Get all leads with optional filtering
 */
function getLeads(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(LEADS_SHEET);
  const allData = sheet.getDataRange().getValues();
  
  let leads = [];
  
  for (let i = 1; i < allData.length; i++) {
    const lead = {
      id: allData[i][0],
      timestamp: allData[i][1],
      companyName: allData[i][2],
      contactPerson: allData[i][3],
      phone: allData[i][4],
      area: allData[i][5],
      machineModel: allData[i][6],
      price: allData[i][7],
      latitude: allData[i][8],
      longitude: allData[i][9],
      locationAddress: allData[i][10],
      status: allData[i][11],
      notes: allData[i][12]
    };
    
    // Apply status filter if provided
    if (params.status && lead.status !== params.status) {
      continue;
    }
    
    leads.push(lead);
  }
  
  // Sort by timestamp (newest first)
  leads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return jsonResponse({
    success: true,
    leads: leads,
    total: leads.length
  });
}

/**
 * Get single lead by ID
 */
function getLead(leadId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(LEADS_SHEET);
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === leadId) {
      return jsonResponse({
        success: true,
        lead: {
          id: allData[i][0],
          timestamp: allData[i][1],
          companyName: allData[i][2],
          contactPerson: allData[i][3],
          phone: allData[i][4],
          area: allData[i][5],
          machineModel: allData[i][6],
          price: allData[i][7],
          latitude: allData[i][8],
          longitude: allData[i][9],
          locationAddress: allData[i][10],
          status: allData[i][11],
          notes: allData[i][12]
        }
      });
    }
  }
  
  return jsonResponse({ success: false, message: 'Lead not found' });
}

/**
 * Search leads by query
 */
function searchLeads(query) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(LEADS_SHEET);
  const allData = sheet.getDataRange().getValues();
  
  const lowerQuery = query.toLowerCase();
  let leads = [];
  
  for (let i = 1; i < allData.length; i++) {
    const searchableText = [
      allData[i][2], allData[i][3], allData[i][5],
      allData[i][6], allData[i][10]
    ].join(' ').toLowerCase();
    
    if (searchableText.includes(lowerQuery)) {
      leads.push({
        id: allData[i][0],
        timestamp: allData[i][1],
        companyName: allData[i][2],
        contactPerson: allData[i][3],
        phone: allData[i][4],
        area: allData[i][5],
        machineModel: allData[i][6],
        price: allData[i][7],
        latitude: allData[i][8],
        longitude: allData[i][9],
        locationAddress: allData[i][10],
        status: allData[i][11],
        notes: allData[i][12]
      });
    }
  }
  
  return jsonResponse({
    success: true,
    leads: leads,
    total: leads.length
  });
}

/**
 * Get dashboard statistics
 */
function getDashboard() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(LEADS_SHEET);
  const allData = sheet.getDataRange().getValues();
  
  let stats = {
    totalLeads: 0,
    totalEnquiries: 0,
    totalConversions: 0,
    conversionRate: 0,
    recentLeads: [],
    statusBreakdown: {
      'New Lead': 0,
      'Enquiry': 0,
      'Converted': 0,
      'Lost': 0
    }
  };
  
  for (let i = 1; i < allData.length; i++) {
    const status = allData[i][11];
    
    switch(status) {
      case 'New Lead':
        stats.totalLeads++;
        stats.statusBreakdown['New Lead']++;
        break;
      case 'Enquiry':
        stats.totalEnquiries++;
        stats.statusBreakdown['Enquiry']++;
        break;
      case 'Converted':
        stats.totalConversions++;
        stats.statusBreakdown['Converted']++;
        break;
      case 'Lost':
        stats.statusBreakdown['Lost']++;
        break;
    }
    
    // Add to recent leads (last 5)
    if (stats.recentLeads.length < 5) {
      stats.recentLeads.push({
        id: allData[i][0],
        companyName: allData[i][2],
        contactPerson: allData[i][3],
        status: allData[i][11],
        timestamp: allData[i][1]
      });
    }
  }
  
  // Calculate conversion rate
  const totalProcessed = stats.totalLeads + stats.totalEnquiries + stats.totalConversions;
  if (totalProcessed > 0) {
    stats.conversionRate = Math.round((stats.totalConversions / totalProcessed) * 100);
  }
  
  return jsonResponse({
    success: true,
    dashboard: stats
  });
}

/**
 * Update counter in settings
 */
function updateCounter(key, increment) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SETTINGS_SHEET);
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === key) {
      const currentValue = parseInt(allData[i][1]) || 0;
      sheet.getRange(i + 1, 2).setValue(currentValue + increment);
      return;
    }
  }
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Setup CORS - Run this once to configure
 */
function setupCORS() {
  // This is handled by the web app deployment settings
  console.log('CORS is configured via Web App deployment settings');
}
