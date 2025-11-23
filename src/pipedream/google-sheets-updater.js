/**
 * Google Sheets Updater
 * Functions for updating Google Sheets with scraped data
 * 
 * @module google-sheets-updater
 */

const { google } = require('googleapis');
const { isDuplicateRow } = require('../utils/duplicate-detector');

/**
 * Initialize Google Sheets API client
 * @param {Object} credentials - Google API credentials
 * @returns {Object} Sheets API client
 */
async function initSheetsClient(credentials) {
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  
  return sheets;
}

/**
 * Get existing rows from sheet
 * @param {Object} sheets - Sheets API client
 * @param {string} sheetId - Sheet ID
 * @param {string} range - Range to fetch (e.g., 'A:K')
 * @returns {Promise<Array>} Existing rows
 */
async function getExistingRows(sheets, sheetId, range = 'A:K') {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });
    
    return response.data.values || [];
  } catch (error) {
    console.error('Error fetching existing rows:', error.message);
    throw error;
  }
}

/**
 * Append rows to sheet
 * @param {Object} sheets - Sheets API client
 * @param {string} sheetId - Sheet ID
 * @param {Array} rows - Rows to append
 * @param {string} range - Range to append to (e.g., 'A:K')
 * @returns {Promise<Object>} API response
 */
async function appendRows(sheets, sheetId, rows, range = 'A:K') {
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows
      }
    });
    
    console.log(`Appended ${rows.length} row(s) to sheet`);
    return response.data;
  } catch (error) {
    console.error('Error appending rows:', error.message);
    throw error;
  }
}

/**
 * Update existing row in sheet
 * @param {Object} sheets - Sheets API client
 * @param {string} sheetId - Sheet ID
 * @param {number} rowIndex - Row index (0-based)
 * @param {Array} rowData - New row data
 * @param {string} sheetName - Sheet name/tab
 * @returns {Promise<Object>} API response
 */
async function updateRow(sheets, sheetId, rowIndex, rowData, sheetName = 'Sheet1') {
  try {
    const range = `${sheetName}!A${rowIndex + 1}:K${rowIndex + 1}`;
    
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData]
      }
    });
    
    console.log(`Updated row ${rowIndex + 1}`);
    return response.data;
  } catch (error) {
    console.error('Error updating row:', error.message);
    throw error;
  }
}

/**
 * Append row with duplicate check
 * @param {Object} sheets - Sheets API client
 * @param {string} sheetId - Sheet ID
 * @param {Array} newRow - Row to append
 * @param {Array} keyIndexes - Column indexes for duplicate check
 * @returns {Promise<Object>} Result object
 */
async function appendRowSafe(sheets, sheetId, newRow, keyIndexes = [0, 1]) {
  try {
    // Fetch existing rows
    const existingRows = await getExistingRows(sheets, sheetId);
    
    // Check for duplicates
    const isDupe = isDuplicateRow(newRow, existingRows, keyIndexes);
    
    if (isDupe) {
      console.log('Duplicate detected, skipping insert');
      return {
        inserted: false,
        reason: 'duplicate',
        row: newRow
      };
    }
    
    // Append row
    await appendRows(sheets, sheetId, [newRow]);
    
    return {
      inserted: true,
      row: newRow
    };
  } catch (error) {
    console.error('Error in appendRowSafe:', error.message);
    throw error;
  }
}

/**
 * Batch append rows with duplicate check
 * @param {Object} sheets - Sheets API client
 * @param {string} sheetId - Sheet ID
 * @param {Array} newRows - Rows to append
 * @param {Array} keyIndexes - Column indexes for duplicate check
 * @returns {Promise<Object>} Result object
 */
async function batchAppendSafe(sheets, sheetId, newRows, keyIndexes = [0, 1]) {
  try {
    // Fetch existing rows once
    const existingRows = await getExistingRows(sheets, sheetId);
    
    // Filter out duplicates
    const rowsToInsert = newRows.filter(newRow => {
      return !isDuplicateRow(newRow, existingRows, keyIndexes);
    });
    
    if (rowsToInsert.length === 0) {
      console.log('All rows are duplicates, nothing to insert');
      return {
        inserted: 0,
        duplicates: newRows.length,
        total: newRows.length
      };
    }
    
    // Batch append
    await appendRows(sheets, sheetId, rowsToInsert);
    
    return {
      inserted: rowsToInsert.length,
      duplicates: newRows.length - rowsToInsert.length,
      total: newRows.length
    };
  } catch (error) {
    console.error('Error in batchAppendSafe:', error.message);
    throw error;
  }
}

/**
 * Create new sheet if it doesn't exist
 * @param {Object} sheets - Sheets API client
 * @param {string} sheetId - Sheet ID
 * @param {string} sheetName - Name for new sheet/tab
 * @param {Array} headers - Column headers
 * @returns {Promise<boolean>} True if created
 */
async function createSheetIfNotExists(sheets, sheetId, sheetName, headers) {
  try {
    // Check if sheet exists
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId
    });
    
    const sheetExists = spreadsheet.data.sheets.some(
      sheet => sheet.properties.title === sheetName
    );
    
    if (sheetExists) {
      console.log(`Sheet "${sheetName}" already exists`);
      return false;
    }
    
    // Create new sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }
        ]
      }
    });
    
    // Add headers
    if (headers && headers.length > 0) {
      await appendRows(sheets, sheetId, [headers], `${sheetName}!A:Z`);
    }
    
    console.log(`Created new sheet: "${sheetName}"`);
    return true;
  } catch (error) {
    console.error('Error creating sheet:', error.message);
    throw error;
  }
}

/**
 * Update multiple accounts' sheets
 * @param {Object} sheets - Sheets API client
 * @param {Array} accountsData - Array of account data objects
 * @returns {Promise<Object>} Summary of updates
 */
async function updateMultipleSheets(sheets, accountsData) {
  const results = {
    successful: [],
    failed: [],
    duplicates: []
  };
  
  for (const accountData of accountsData) {
    try {
      const { sheetId, row, accountName } = accountData;
      
      console.log(`Updating sheet for: ${accountName}`);
      
      const result = await appendRowSafe(sheets, sheetId, row);
      
      if (result.inserted) {
        results.successful.push(accountName);
      } else {
        results.duplicates.push(accountName);
      }
    } catch (error) {
      console.error(`Failed to update ${accountData.accountName}:`, error.message);
      results.failed.push({
        accountName: accountData.accountName,
        error: error.message
      });
    }
  }
  
  return results;
}

module.exports = {
  initSheetsClient,
  getExistingRows,
  appendRows,
  updateRow,
  appendRowSafe,
  batchAppendSafe,
  createSheetIfNotExists,
  updateMultipleSheets
};

