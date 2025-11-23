/**
 * Pipedream Workflow Template
 * Main workflow for Amazon Associates automated reporting
 * 
 * This file contains the complete Pipedream workflow code.
 * Copy each step into your Pipedream workflow builder.
 */

// ============================================================================
// STEP 0: CRON TRIGGER
// ============================================================================
// Configure in Pipedream UI:
// - Trigger: Cron Scheduler
// - Schedule: 0 6 * * * (6am EST daily)
// - Timezone: America/New_York

// ============================================================================
// STEP 1: Load Configuration
// ============================================================================
export default defineComponent({
  name: "Load Configuration",
  version: "0.0.1",
  async run({ steps, $ }) {
    console.log("Loading configuration...");
    
    // Load accounts from environment variable
    // Format: "account1,account2,account3" or JSON string
    const accountsConfig = process.env.ACCOUNTS_CONFIG || "";
    let accounts = [];
    
    try {
      // Try parsing as JSON first
      accounts = JSON.parse(accountsConfig);
    } catch (e) {
      // If not JSON, treat as comma-separated list
      accounts = accountsConfig.split(',').map((id, index) => ({
        id: id.trim(),
        name: `Account ${index + 1}`,
        sheetId: process.env[`SHEET_ID_${id.trim().toUpperCase()}`] || ''
      }));
    }
    
    // Load credentials
    const credentials = {
      email: process.env.AMAZON_EMAIL,
      password: process.env.AMAZON_PASSWORD
    };
    
    // Validate configuration
    if (!credentials.email || !credentials.password) {
      throw new Error("Amazon credentials not configured");
    }
    
    if (accounts.length === 0) {
      throw new Error("No accounts configured");
    }
    
    console.log(`Loaded ${accounts.length} account(s)`);
    
    return {
      accounts,
      credentials,
      timestamp: new Date().toISOString()
    };
  }
});

// ============================================================================
// STEP 2: Run Puppeteer Scraper
// ============================================================================
export default defineComponent({
  name: "Run Scraper",
  version: "0.0.1",
  async run({ steps, $ }) {
    console.log("Starting scraper...");
    
    // NOTE: You'll need to either:
    // 1. Bundle the scraper code and import it
    // 2. Copy the scraper code inline here
    // 3. Use an npm package (if you publish one)
    
    // For now, this is a template showing the structure
    
    const { accounts, credentials } = steps.load_configuration.$return_value;
    
    // Import scraper (adjust path as needed)
    const { scrapeAllAccounts } = require('./amazon-associates-scraper');
    
    // Run scraper
    const results = await scrapeAllAccounts(credentials, accounts);
    
    if (!results.success) {
      console.error("Scraping failed:", results.errors);
      // Optionally: throw error or send notification
      // For now, we'll continue with partial data
    }
    
    console.log(`Scraping complete. Processed ${results.data.length} accounts`);
    
    return results;
  }
});

// ============================================================================
// STEP 3: Process Data for Google Sheets
// ============================================================================
export default defineComponent({
  name: "Process Data",
  version: "0.0.1",
  async run({ steps, $ }) {
    console.log("Processing scraped data...");
    
    const scrapedData = steps.run_scraper.$return_value.data;
    
    if (!scrapedData || scrapedData.length === 0) {
      console.warn("No data to process");
      return { processedData: [] };
    }
    
    // Transform data for Google Sheets format
    const processedData = scrapedData.map(account => {
      const { overview, earnings, metadata } = account.data;
      
      // Create row array matching sheet columns
      const row = [
        metadata.date,                          // Date
        account.accountName,                    // Account Name
        overview.revenue || 0,                  // Revenue
        earnings.totalEarnings || 0,            // Earnings
        overview.clicks || 0,                   // Clicks
        overview.orders || 0,                   // Orders
        overview.conversionRate || 0,           // Conversion Rate
        overview.itemsOrdered || 0,             // Items Ordered
        overview.itemsShipped || 0,             // Items Shipped
        overview.revenuePerClick || 0,          // Revenue Per Click
        metadata.extractedAt                    // Last Updated
      ];
      
      return {
        accountId: account.accountId,
        accountName: account.accountName,
        row: row,
        sheetId: account.sheetId || '',
        rawData: account.data
      };
    });
    
    console.log(`Processed ${processedData.length} records`);
    
    return { processedData };
  }
});

// ============================================================================
// STEP 4: Check for Duplicates (for each account)
// ============================================================================
export default defineComponent({
  name: "Check Duplicates",
  version: "0.0.1",
  props: {
    google_sheets: {
      type: "app",
      app: "google_sheets",
    }
  },
  async run({ steps, $ }) {
    console.log("Checking for duplicates...");
    
    const { processedData } = steps.process_data.$return_value;
    const recordsToInsert = [];
    
    for (const accountData of processedData) {
      const { sheetId, row } = accountData;
      
      if (!sheetId) {
        console.warn(`No sheet ID for account: ${accountData.accountName}`);
        continue;
      }
      
      try {
        // Fetch last 100 rows from sheet to check for duplicates
        const response = await $.google_sheets.getValues({
          spreadsheetId: sheetId,
          range: 'A:B',  // Date and Account Name columns
        });
        
        const existingRows = response.values || [];
        
        // Check if this date + account combination already exists
        const date = row[0];
        const accountName = row[1];
        
        const isDuplicate = existingRows.some(existing => {
          return existing[0] === date && existing[1] === accountName;
        });
        
        if (isDuplicate) {
          console.log(`Duplicate detected for ${accountName} on ${date}, skipping`);
        } else {
          recordsToInsert.push(accountData);
        }
        
      } catch (error) {
        console.error(`Error checking duplicates for ${accountData.accountName}:`, error);
        // On error, add to insert list (safer to insert than skip)
        recordsToInsert.push(accountData);
      }
    }
    
    console.log(`${recordsToInsert.length} new records to insert`);
    
    return { recordsToInsert };
  }
});

// ============================================================================
// STEP 5: Update Google Sheets (for each account)
// ============================================================================
export default defineComponent({
  name: "Update Google Sheets",
  version: "0.0.1",
  props: {
    google_sheets: {
      type: "app",
      app: "google_sheets",
    }
  },
  async run({ steps, $ }) {
    console.log("Updating Google Sheets...");
    
    const { recordsToInsert } = steps.check_duplicates.$return_value;
    
    if (!recordsToInsert || recordsToInsert.length === 0) {
      console.log("No records to insert");
      return { updatedSheets: [], count: 0 };
    }
    
    const updatedSheets = [];
    const errors = [];
    
    for (const accountData of recordsToInsert) {
      try {
        const { sheetId, row, accountName } = accountData;
        
        console.log(`Appending data for: ${accountName}`);
        
        // Append row to sheet
        await $.google_sheets.appendValues({
          spreadsheetId: sheetId,
          range: 'A:K',  // Adjust based on number of columns
          values: [row],
          valueInputOption: 'USER_ENTERED'
        });
        
        updatedSheets.push(accountName);
        console.log(`✓ Updated sheet for: ${accountName}`);
        
      } catch (error) {
        console.error(`✗ Failed to update sheet for ${accountData.accountName}:`, error);
        errors.push({
          account: accountData.accountName,
          error: error.message
        });
      }
    }
    
    console.log(`Successfully updated ${updatedSheets.length} sheets`);
    
    if (errors.length > 0) {
      console.error(`Failed to update ${errors.length} sheets`);
    }
    
    return {
      updatedSheets,
      count: updatedSheets.length,
      errors
    };
  }
});

// ============================================================================
// STEP 6: Send Summary/Notification
// ============================================================================
export default defineComponent({
  name: "Send Summary",
  version: "0.0.1",
  async run({ steps, $ }) {
    console.log("Generating summary...");
    
    const { updatedSheets, count, errors } = steps.update_google_sheets.$return_value;
    const scrapingResults = steps.run_scraper.$return_value;
    
    const summary = {
      success: errors.length === 0 && scrapingResults.success,
      timestamp: new Date().toISOString(),
      accountsProcessed: scrapingResults.summary.successful,
      accountsFailed: scrapingResults.summary.failed,
      sheetsUpdated: count,
      sheetUpdateErrors: errors.length,
      details: {
        updatedSheets,
        scrapingErrors: scrapingResults.errors,
        sheetErrors: errors
      }
    };
    
    console.log("=== WORKFLOW SUMMARY ===");
    console.log(`Status: ${summary.success ? 'SUCCESS' : 'PARTIAL FAILURE'}`);
    console.log(`Accounts Processed: ${summary.accountsProcessed}/${scrapingResults.summary.total}`);
    console.log(`Sheets Updated: ${summary.sheetsUpdated}`);
    
    if (errors.length > 0) {
      console.error("Sheet Update Errors:");
      errors.forEach(err => {
        console.error(`  - ${err.account}: ${err.error}`);
      });
    }
    
    if (scrapingResults.errors.length > 0) {
      console.error("Scraping Errors:");
      scrapingResults.errors.forEach(err => {
        console.error(`  - ${err.accountName || 'Unknown'}: ${err.error || err.message}`);
      });
    }
    
    // Optional: Send email notification on errors
    if (!summary.success) {
      // Add email/Slack notification step here
      console.log("Errors detected - consider adding notification step");
    }
    
    return summary;
  }
});

// ============================================================================
// OPTIONAL STEP 7: Send Email Notification (on errors)
// ============================================================================
export default defineComponent({
  name: "Send Error Notification",
  version: "0.0.1",
  props: {
    email: {
      type: "app",
      app: "email",
    }
  },
  async run({ steps, $ }) {
    const summary = steps.send_summary.$return_value;
    
    // Only send if there were errors
    if (summary.success) {
      console.log("No errors, skipping notification");
      return { sent: false };
    }
    
    const emailBody = `
Amazon Associates Reporting - Error Report

Timestamp: ${summary.timestamp}

Summary:
- Accounts Processed: ${summary.accountsProcessed}
- Accounts Failed: ${summary.accountsFailed}
- Sheets Updated: ${summary.sheetsUpdated}
- Sheet Update Errors: ${summary.sheetUpdateErrors}

Scraping Errors:
${summary.details.scrapingErrors.map(e => `- ${e.accountName}: ${e.error}`).join('\n')}

Sheet Update Errors:
${summary.details.sheetErrors.map(e => `- ${e.account}: ${e.error}`).join('\n')}

Please check the Pipedream logs for more details.
    `.trim();
    
    await $.email.send({
      subject: `[ERROR] Amazon Associates Reporting - ${new Date().toLocaleDateString()}`,
      text: emailBody,
    });
    
    console.log("Error notification sent");
    
    return { sent: true };
  }
});

