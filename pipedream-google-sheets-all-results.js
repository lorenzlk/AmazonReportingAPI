/**
 * Pipedream Step: Add All Account Data to Google Sheets
 * 
 * This step processes ALL results from the multi-account scraper at once.
 * No loop step needed - it handles all Tracking IDs in one go.
 * 
 * SHEET STRUCTURE:
 * - Main Sheet: "Amazon Associates Reporting" (ID: 1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM)
 * - Each Tracking ID has its own TAB within this sheet
 * - Tab names: mula09a-20, mula07-20, twsmm-20, stylcasterm-20, defpenm-20, swimworldm-20, britcom03-20, on3m-20, mula0f-20
 * 
 * SETUP:
 * 1. Connect your Google account in this step's props
 * 2. Make sure your sheet has these headers in row 1:
 *    Date | Store ID | Tracking ID | Revenue | Earnings | Clicks | Orders | Conversion Rate | Items Ordered | Items Shipped | Revenue Per Click | Scraped Date | Last Updated
 * 
 * NOTE: Amazon data can change retroactively (returns, cancellations, adjustments).
 * This step will UPDATE existing rows for the same date instead of creating duplicates,
 * so you always have the latest values for each day.
 */

import axios from 'axios';

export default defineComponent({
  name: "Add All Account Data to Google Sheets",
  version: "0.0.1",
  props: {
    google_sheets: {
      type: "app",
      app: "google_sheets",
    },
  },
  async run({ steps, $ }) {
    console.log('📊 Adding all account data to Google Sheets...');
    
    // Get the scraper results from the previous step
    // Look for the step that returned results array
    let scraperResults;
    const scraperStep = Object.keys(steps).find(key => 
      steps[key].$return_value && 
      steps[key].$return_value.results &&
      Array.isArray(steps[key].$return_value.results)
    );
    
    if (scraperStep) {
      scraperResults = steps[scraperStep].$return_value.results;
      console.log(`Found ${scraperResults.length} results from step: ${scraperStep}`);
    } else {
      throw new Error('No scraper results found. Make sure the scraper step ran successfully and returned a results array.');
    }
    
    if (!scraperResults || scraperResults.length === 0) {
      console.warn('⚠️ No results to save');
      return { saved: 0, errors: [] };
    }
    
    const sheetId = '1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM'; // "Amazon Associates Reporting" sheet
    const oauthToken = this.google_sheets.$auth.oauth_access_token;
    const saved = [];
    const errors = [];
    
    // Process each result
    for (const scraperData of scraperResults) {
      try {
        const trackingId = scraperData.accountName || scraperData.trackingId;
        const storeId = scraperData.storeId;
        const tabName = trackingId; // Tab name = Tracking ID
        
        console.log(`Processing: ${trackingId} (Store: ${storeId})`);
        
        // Check if tab exists, create if it doesn't
        try {
          const sheetInfoResponse = await $.send.http({
            method: 'GET',
            url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
            headers: {
              'Authorization': `Bearer ${oauthToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Handle different response formats
          const sheetInfo = sheetInfoResponse.data || sheetInfoResponse;
          const sheets = sheetInfo.sheets || [];
          const existingTabs = sheets.map(s => (s.properties || s).title);
          
          if (!existingTabs.includes(tabName)) {
            console.log(`  Creating new tab: ${tabName}`);
            // Create the tab
            await axios.post(
              `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
              {
                requests: [{
                  addSheet: {
                    properties: {
                      title: tabName
                    }
                  }
                }]
              },
              {
                headers: {
                  'Authorization': `Bearer ${oauthToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            // Wait a moment for tab to be created
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Add headers to the new tab
            const headers = [
              'Date', 'Store ID', 'Tracking ID', 'Revenue', 'Earnings', 'Clicks', 'Orders', 
              'Conversion Rate', 'Items Ordered', 'Items Shipped', 'Revenue Per Click', 
              'Scraped Date', 'Last Updated'
            ];
            const headerResponse = await axios.put(
              `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A1:M1?valueInputOption=USER_ENTERED`,
              {
                values: [headers]
              },
              {
                headers: {
                  'Authorization': `Bearer ${oauthToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            console.log(`  ✅ Created tab "${tabName}" with headers`);
            if (headerResponse && typeof headerResponse === 'object') {
              console.log(`  Header response:`, JSON.stringify(headerResponse).substring(0, 200));
            }
          } else {
            console.log(`  Tab "${tabName}" already exists`);
          }
        } catch (tabError) {
          console.warn(`  ⚠️ Could not check/create tab: ${tabError.message}`);
          // Try to continue - tab might already exist or we'll get a clearer error when writing
        }
        
        // Format the row data
        const scrapedDate = new Date().toISOString().split('T')[0];
        const lastUpdated = new Date().toISOString();
        const rowData = [
          scraperData.date,           // Data date
          storeId,                    // Store ID
          trackingId,                 // Tracking ID
          scraperData.revenue || 0,   // Revenue
          scraperData.earnings || 0,  // Earnings
          scraperData.clicks || 0,    // Clicks
          scraperData.orders || 0,    // Orders
          scraperData.conversionRate || 0, // Conversion Rate
          scraperData.itemsOrdered || 0,   // Items Ordered
          scraperData.itemsShipped || 0,   // Items Shipped
          scraperData.revenuePerClick || 0, // Revenue Per Click
          scrapedDate,                // Scraped Date
          lastUpdated                 // Last Updated
        ];
        
        // Get existing data to check for duplicates
        let existingRows = [];
        try {
          const existingDataResponse = await axios.get(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A:M`,
            {
              headers: {
                'Authorization': `Bearer ${oauthToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          existingRows = existingDataResponse.data.values || [];
        } catch (getError) {
          // If tab doesn't exist or is empty, that's okay - we'll append
          console.warn(`  ⚠️ Could not get existing data: ${getError.message}`);
          existingRows = [];
        }
        const headers = existingRows[0] || [];
        
        // Find existing row with same date and tracking ID
        let existingRowIndex = -1;
        if (existingRows.length > 1) {
          for (let i = 1; i < existingRows.length; i++) {
            const row = existingRows[i];
            if (row[0] === scraperData.date && row[2] === trackingId) {
              existingRowIndex = i + 1; // +1 because sheets are 1-indexed
              break;
            }
          }
        }
        
        if (existingRowIndex > 0) {
          // Update existing row
          console.log(`  Updating existing row ${existingRowIndex} for ${trackingId} on ${scraperData.date}`);
          await axios.put(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A${existingRowIndex}:M${existingRowIndex}?valueInputOption=USER_ENTERED`,
            {
              values: [rowData]
            },
            {
              headers: {
                'Authorization': `Bearer ${oauthToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          console.log(`  ✅ Updated row ${existingRowIndex} successfully`);
          saved.push({ trackingId, action: 'updated', row: existingRowIndex });
        } else {
          // Append new row using Pipedream Google Sheets app
          console.log(`  Adding new row for ${trackingId} on ${scraperData.date}`);
          console.log(`  Row data:`, rowData);
          
          try {
            // Use axios for more reliable HTTP calls
            const appendResponse = await axios.post(
              `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A:M:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
              {
                values: [rowData]
              },
              {
                headers: {
                  'Authorization': `Bearer ${oauthToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            // Log the actual response structure
            if (appendResponse.data && appendResponse.data.updates) {
              console.log(`  ✅ Append successful: ${appendResponse.data.updates.updatedRows} row(s) updated`);
            } else {
              console.log(`  ⚠️ Unexpected response format:`, JSON.stringify(appendResponse.data).substring(0, 200));
            }
            
            // Verify the write by reading back
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait a moment for write to complete
            try {
              const verifyResponse = await axios.get(
                `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A:M`,
                {
                  headers: {
                    'Authorization': `Bearer ${oauthToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              const rows = verifyResponse.data.values || [];
              
              console.log(`  Verification: Found ${rows.length} rows in ${tabName}`);
              console.log(`  First row (headers):`, rows[0]);
              console.log(`  All rows:`, JSON.stringify(rows).substring(0, 500));
              
              if (rows.length > 1) {
                const lastRow = rows[rows.length - 1];
                if (lastRow && lastRow[0] === scraperData.date && lastRow[2] === trackingId) {
                  console.log(`  ✅ Verified: Data written successfully to ${tabName}`);
                  console.log(`  Last row in sheet:`, lastRow.slice(0, 5).join(', '), '...');
                } else {
                  console.warn(`  ⚠️ Verification: Last row doesn't match expected data`);
                  console.warn(`  Expected date: ${scraperData.date}, Tracking ID: ${trackingId}`);
                  console.warn(`  Last row:`, lastRow);
                  console.warn(`  Full response:`, JSON.stringify(verifyResponse).substring(0, 500));
                }
              } else {
                console.warn(`  ⚠️ Verification: Sheet only has ${rows.length} row(s) (expected at least 2: headers + data)`);
                console.warn(`  Response structure:`, JSON.stringify(verifyResponse).substring(0, 500));
              }
            } catch (verifyError) {
              console.warn(`  ⚠️ Could not verify write: ${verifyError.message}`);
              if (verifyError.response) {
                console.warn(`  Response status: ${verifyError.response.status}`);
                console.warn(`  Response body:`, JSON.stringify(verifyError.response.body || verifyError.response.data).substring(0, 500));
              }
            }
            
            saved.push({ trackingId, action: 'added' });
          } catch (httpError) {
            const errorMsg = httpError.message || String(httpError);
            console.error(`  ❌ HTTP append failed: ${errorMsg}`);
            if (httpError.response) {
              console.error(`  Response status: ${httpError.response.status}`);
              console.error(`  Response body:`, JSON.stringify(httpError.response.body || httpError.response.data).substring(0, 300));
            }
            throw new Error(`Failed to append data: ${errorMsg}`);
          }
        }
        
        console.log(`  ✅ Saved data for ${trackingId}`);
        
      } catch (error) {
        const errorMsg = error.message || String(error);
        console.error(`  ❌ Failed to save data for ${scraperData.trackingId || 'unknown'}:`, errorMsg);
        errors.push({
          trackingId: scraperData.trackingId || 'unknown',
          error: errorMsg
        });
      }
    }
    
    console.log(`\n✅ Saved ${saved.length} out of ${scraperResults.length} Tracking IDs`);
    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} errors occurred`);
    }
    
    return {
      saved: saved.length,
      total: scraperResults.length,
      errors: errors.length,
      details: saved,
      errorDetails: errors
    };
  }
});

