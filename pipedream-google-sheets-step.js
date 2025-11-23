/**
 * Pipedream Step: Add Account Data to Google Sheets
 * 
 * This step should be added AFTER the scraper step.
 * It takes the scraper results and appends them to the appropriate Google Sheet
 * based on the account name.
 * 
 * SHEET STRUCTURE:
 * - Main Sheet: "Amazon Associates Reporting" (ID: 1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM)
 * - Each Tracking ID has its own TAB within this sheet
 * - Tab names: mula09a-20, mula07-20, twsmm-20, stylcasterm-20, defpenm-20, swimworldm-20, britcom03-20, on3m-20, mula0f-20
 * 
 * SETUP:
 * 1. Main sheet ID is hardcoded (1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM)
 * 2. Each Tracking ID uses a tab with the same name as the Tracking ID
 * 
 * 2. Connect your Google account in this step's props
 * 
 * 3. Make sure your sheet has these headers in row 1:
 *    Date | Store ID | Tracking ID | Revenue | Earnings | Clicks | Orders | Conversion Rate | Items Ordered | Items Shipped | Revenue Per Click | Scraped Date | Last Updated
 * 
 * NOTE: Amazon data can change retroactively (returns, cancellations, adjustments).
 * This step will UPDATE existing rows for the same date instead of creating duplicates,
 * so you always have the latest values for each day.
 */

export default defineComponent({
  name: "Add Account Data to Google Sheets",
  version: "0.0.1",
  props: {
    google_sheets: {
      type: "app",
      app: "google_sheets",
    },
  },
  async run({ steps, $ }) {
    console.log('📊 Adding data to Google Sheets...');
    
    // Get the scraper results from the previous step
    // Get scraper data - works when called directly or from a loop
    // If called from loop: data is in the loop item
    // If called directly: data is in previous step's return value
    let scraperData;
    
    // First, try to get from loop item (if called from loop step)
    const loopSteps = Object.keys(steps).filter(key => 
      steps[key].item && steps[key].item.accountName
    );
    if (loopSteps.length > 0) {
      scraperData = steps[loopSteps[0]].item;
      console.log('Using data from loop step:', loopSteps[0]);
    } else {
      // Otherwise, try to find in previous step's return value
      scraperData = steps[Object.keys(steps).find(key => 
        steps[key].$return_value && 
        steps[key].$return_value.accountName
      )]?.$return_value;
    }
    
    if (!scraperData) {
      throw new Error('No scraper data found. Make sure the scraper step ran successfully or you are passing data from a loop step.');
    }
    
    console.log('Scraper data:', scraperData);
    
    // Get Sheet ID and Tab Name
    const trackingId = scraperData.accountName || scraperData.trackingId;
    const storeId = scraperData.storeId;
    
    // All Tracking IDs use the same main sheet, but different tabs
    const sheetId = '1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM'; // "Amazon Associates Reporting" sheet
    const tabName = trackingId; // Tab name = Tracking ID (e.g., "mula09a-20")
    
    console.log(`Using Google Sheet "Amazon Associates Reporting" (${sheetId}), Tab "${tabName}" for Tracking ID "${trackingId}" (Store ID: ${storeId})`);
    
    // Format the row data to match sheet headers:
    // Date | Store ID | Tracking ID | Revenue | Earnings | Clicks | Orders | Conversion Rate | Items Ordered | Items Shipped | Revenue Per Click | Scraped Date | Last Updated
    const scrapedDate = new Date().toISOString().split('T')[0]; // Today's date when scraping
    const rowData = [
      scraperData.date,           // Data date (what period this represents)
      storeId || 'N/A',           // Store ID
      trackingId,                 // Tracking ID (this is the account name)
      scraperData.revenue,
      scraperData.earnings,
      scraperData.clicks,
      scraperData.orders,
      scraperData.conversionRate,
      scraperData.itemsOrdered,
      scraperData.itemsShipped,
      scraperData.revenuePerClick,
      scrapedDate,                // When we scraped this data
      scraperData.lastUpdated     // Timestamp of when data was last updated
    ];
    
    console.log('Row data to insert/update:', rowData);
    
    // Check if row exists for this date + account (Amazon data can change, so we update)
    // Use Google Sheets API directly via HTTP since Pipedream app methods may vary
    const accessToken = this.google_sheets.$auth.oauth_access_token;
    
    if (!accessToken) {
      throw new Error('Google Sheets OAuth token not found. Please reconnect your Google account in the step props.');
    }
    
    try {
      // Get existing data to check for existing row using Google Sheets API
      // Use tab name in the range: 'TabName!A:M'
      const existingDataResponse = await $.send.http({
        method: 'GET',
        url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A:M`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const existingRows = existingDataResponse.values || [];
      
      // Skip header row if it exists
      const dataRows = existingRows.length > 0 && existingRows[0][0] === 'Date' 
        ? existingRows.slice(1) 
        : existingRows;
      
      // Find row index for this date + tracking ID (0-indexed, but +1 for header, +1 for 1-based Sheets API)
      const existingRowIndex = dataRows.findIndex(row => 
        row[0] === scraperData.date && 
        row[2] === trackingId  // Tracking ID is now in column C (index 2)
      );
      
      if (existingRowIndex >= 0) {
        // Row exists - UPDATE it (Amazon data can change retroactively)
        const sheetRowNumber = existingRowIndex + 2; // +1 for header, +1 for 1-based indexing
        console.log(`📝 Updating existing row ${sheetRowNumber} for ${scraperData.date} (Amazon data may have changed)`);
        
        // Update existing row using Google Sheets API directly
        // Use tab name in the range: 'TabName!A{row}:M{row}'
        await $.send.http({
          method: 'PUT',
          url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A${sheetRowNumber}:M${sheetRowNumber}?valueInputOption=USER_ENTERED`,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            values: [rowData]
          }
        });
        
        console.log(`✅ Successfully updated data for "${accountName}" on ${scraperData.date}!`);
        console.log(`📊 Sheet: https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
        
        return {
          inserted: false,
          updated: true,
          rowNumber: sheetRowNumber,
          data: scraperData,
          sheetId: sheetId,
          sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
          reason: 'updated_existing_row'
        };
      }
    } catch (error) {
      console.warn('Could not check for existing row (sheet might be empty or error):', error.message);
      // Continue with insert if check fails
    }
    
    // No existing row found - APPEND new row using Google Sheets API directly
    try {
      await $.send.http({
        method: 'POST',
        url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A:M:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          values: [rowData]
        }
      });
      
      console.log(`✅ Successfully added NEW data for "${accountName}" to Google Sheet!`);
      console.log(`📊 Sheet: https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
      
      return {
        inserted: true,
        updated: false,
        data: scraperData,
        sheetId: sheetId,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
      };
      
    } catch (error) {
      console.error('❌ Failed to add data to Google Sheet:', error.message);
      throw new Error(`Failed to add data to Google Sheet: ${error.message}`);
    }
  }
});

