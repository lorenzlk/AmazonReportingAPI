/**
 * Google Sheets Writer - tag0d1d-20
 * 
 * This step receives results from the tag0d1d-20 scraper
 * and saves them to Google Sheets (one tab per Tracking ID)
 * 
 * SETUP:
 * 1. Connect Google Sheets app in props
 * 2. Set GOOGLE_SHEET_ID environment variable
 * 3. Reference the scraper step: steps["Scraper - tag0d1d-20"]
 */

import axios from 'axios';

export default defineComponent({
  props: {
    google_sheets: {
      type: "app",
      app: "google_sheets",
    }
  },
  async run({ steps, $ }) {
    console.log('📊 Adding tag0d1d-20 data to Google Sheets...');
    
    // Debug: Log available step names
    console.log('Available steps:', Object.keys(steps));
    
    // Try multiple step name patterns to find the scraper step
    const possibleStepNames = [
      "Scraper - tag0d1d-20",
      "scraper",
      "Scraper",
      "Amazon Scraper",
      "Amazon Associates Scraper",
      "tag0d1d-20 Scraper"
    ];
    
    let scraperStep = null;
    let scraperData = null;
    
    // First, try the expected step name
    for (const stepName of possibleStepNames) {
      if (steps[stepName]) {
        console.log(`Found scraper step: ${stepName}`);
        scraperStep = steps[stepName];
        break;
      }
    }
    
    // If not found, try to find any step that has results
    if (!scraperStep) {
      console.log('⚠️ Scraper step not found by name, searching all steps...');
      for (const [stepName, stepData] of Object.entries(steps)) {
        if (stepData && (stepData.results || (stepData.$return_value && stepData.$return_value.results))) {
          console.log(`Found step with results: ${stepName}`);
          scraperStep = stepData;
          break;
        }
      }
    }
    
    // If still not found, try steps.trigger
    if (!scraperStep) {
      console.log('⚠️ Trying steps.trigger as fallback...');
      scraperStep = steps.trigger;
    }
    
    if (!scraperStep) {
      console.error('❌ Available steps:', Object.keys(steps));
      throw new Error('No scraper step found. Available steps: ' + Object.keys(steps).join(', '));
    }
    
    // Extract results from the step
    scraperData = scraperStep.results || scraperStep.$return_value || scraperStep;
    
    if (!scraperData) {
      console.error('❌ Scraper step data:', scraperStep);
      throw new Error('No data found in scraper step. Step structure: ' + JSON.stringify(Object.keys(scraperStep || {})));
    }
    
    if (!scraperData.results) {
      console.error('❌ Scraper data structure:', scraperData);
      throw new Error('No results property found. Data structure: ' + JSON.stringify(Object.keys(scraperData || {})));
    }
    
    const results = scraperData.results;
    const storeId = 'tag0d1d-20';
    
    console.log(`Found ${results.length} results from Store ID: ${storeId}`);
    
    const sheetId = process.env.GOOGLE_SHEET_ID || '1TBvJZS9KkdP6VBeZ-YZIJ6NxqAn2bAnBzjRTqK9qPWU';
    const oauthToken = this.google_sheets.$auth.oauth_access_token;
    
    if (!oauthToken) {
      throw new Error('Google Sheets OAuth token not found. Make sure Google Sheets app is connected.');
    }
    
    const headers = {
      'Authorization': `Bearer ${oauthToken}`,
      'Content-Type': 'application/json'
    };
    
    // Process each result
    for (const result of results) {
      const { trackingId, date, revenue, earnings, clicks, orders, conversionRate, itemsOrdered, itemsShipped, revenuePerClick } = result;
      
      console.log(`Processing: ${trackingId} (Store: ${storeId})`);
      
      try {
        // Use trackingId as tab name
        const tabName = trackingId;
        
        // Check if tab exists
        let tabExists = false;
        try {
          const sheetInfoResponse = await axios.get(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
            { headers }
          );
          
          const sheetInfo = sheetInfoResponse.data || sheetInfoResponse;
          const sheets = sheetInfo.sheets || [];
          tabExists = sheets.some(sheet => sheet.properties.title === tabName);
        } catch (error) {
          console.warn('⚠️ Could not check for existing tab:', error.message);
        }
        
        // Check if headers exist, add if not (for existing tabs like Sheet1)
        if (tabExists) {
          try {
            const headerCheck = await axios.get(
              `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A1:Z1`,
              { headers }
            );
            const existingHeaders = headerCheck.data?.values?.[0] || [];
            if (existingHeaders.length === 0 || !existingHeaders.includes('Date')) {
              console.log(`Adding headers to existing tab: ${tabName}`);
              await axios.put(
                `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A1:M1?valueInputOption=RAW`,
                {
                  values: [[
                    'Date',
                    'Account Name',
                    'Store ID',
                    'Tracking ID',
                    'Revenue',
                    'Earnings',
                    'Clicks',
                    'Orders',
                    'Conversion Rate',
                    'Items Ordered',
                    'Items Shipped',
                    'Revenue Per Click',
                    'Last Updated'
                  ]]
                },
                { headers }
              );
            }
          } catch (error) {
            console.warn('⚠️ Could not check/add headers:', error.message);
          }
        }
        
        // Check if row exists for this date and tracking ID
        let existingRowIndex = null;
        try {
          const readResponse = await axios.get(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A2:Z1000`,
            { headers }
          );
          
          const rows = readResponse.data?.values || [];
          existingRowIndex = rows.findIndex(row => 
            row[0] === date && row[3] === trackingId
          );
          
          if (existingRowIndex !== -1) {
            existingRowIndex += 2; // +2 because: +1 for header row, +1 for 0-based to 1-based
          } else {
            existingRowIndex = null;
          }
        } catch (error) {
          console.warn('⚠️ Could not read existing rows:', error.message);
        }
        
        // Prepare row data
        const rowData = [
          date,
          trackingId,
          storeId,
          trackingId,
          revenue,
          earnings,
          clicks,
          orders,
          conversionRate,
          itemsOrdered,
          itemsShipped,
          revenuePerClick,
          new Date().toISOString()
        ];
        
        if (existingRowIndex) {
          // Update existing row
          console.log(`Updating existing row ${existingRowIndex} for ${trackingId} on ${date}`);
          try {
            await axios.put(
              `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A${existingRowIndex}:M${existingRowIndex}?valueInputOption=RAW`,
              {
                values: [rowData]
              },
              { headers }
            );
            console.log(`✅ Updated row ${existingRowIndex} successfully`);
          } catch (error) {
            console.error(`❌ Failed to update row: ${error.message}`);
            throw error;
          }
        } else {
          // Append new row
          console.log(`Appending new row for ${trackingId} on ${date}`);
          try {
            await axios.post(
              `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!A:Z:append?valueInputOption=RAW`,
              {
                values: [rowData]
              },
              { headers }
            );
            console.log(`✅ Appended row successfully`);
          } catch (error) {
            console.error(`❌ Failed to append row: ${error.message}`);
            throw error;
          }
        }
        
        console.log(`✅ Saved data for ${trackingId}`);
      } catch (error) {
        console.error(`❌ Failed to save data for ${trackingId}: ${error.message}`);
      }
    }
    
    console.log(`✅ Saved ${results.length} out of ${results.length} Tracking IDs for Store ID: ${storeId}`);
    return {
      success: true,
      storeId: storeId,
      count: results.length,
      timestamp: new Date().toISOString()
    };
  }
});

