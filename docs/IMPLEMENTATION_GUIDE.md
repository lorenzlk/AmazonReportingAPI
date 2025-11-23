# Amazon Associates Reporting - Implementation Guide

Detailed guide for implementing the Amazon Associates automated reporting system.

---

## Table of Contents

1. [Architecture Recap](#architecture-recap)
2. [Component Implementation](#component-implementation)
3. [Puppeteer Scraper](#puppeteer-scraper)
4. [Pipedream Workflow](#pipedream-workflow)
5. [Google Sheets Integration](#google-sheets-integration)
6. [Testing Strategy](#testing-strategy)
7. [Deployment](#deployment)

---

## Architecture Recap

The system consists of three main layers:

1. **Scraping Layer**: Puppeteer-based browser automation
2. **Orchestration Layer**: Pipedream workflow management
3. **Storage Layer**: Google Sheets data persistence

```
Pipedream (Orchestrator)
    ↓
Puppeteer (Scraper) → Amazon Associates
    ↓
Data Processing
    ↓
Google Sheets (Storage)
```

---

## Component Implementation

### File Structure

```
/AA Reporting
├── src/
│   ├── scraper/
│   │   ├── amazon-associates-scraper.js     # Main scraper
│   │   ├── account-switcher.js              # Account navigation
│   │   ├── data-extractors.js               # Data extraction
│   │   └── config.js                        # Configuration
│   ├── pipedream/
│   │   ├── workflow-template.js             # Main workflow
│   │   └── google-sheets-updater.js         # Sheets integration
│   └── utils/
│       ├── duplicate-detector.js            # Duplicate detection
│       └── date-utils.js                    # Date utilities
├── config/
│   ├── accounts.json                        # Account configuration
│   └── sheets-mapping.json                  # Sheet mapping
└── package.json
```

---

## Puppeteer Scraper

### Core Scraper: `amazon-associates-scraper.js`

This is the main entry point for scraping logic.

**Key Functions**:

1. **`initBrowser()`**: Launch Puppeteer browser
2. **`login(page, email, password)`**: Authenticate with Amazon
3. **`scrapeAccount(page, accountId)`**: Extract data for one account
4. **`scrapeAllAccounts(accounts)`**: Orchestrate multi-account scraping
5. **`closeBrowser()`**: Clean up resources

**Implementation Pattern**:

```javascript
// High-level flow
async function scrapeAllAccounts(credentials, accountList) {
  const browser = await initBrowser();
  const page = await browser.newPage();
  
  try {
    // Login once
    await login(page, credentials.email, credentials.password);
    
    const results = [];
    
    // Process each account
    for (const account of accountList) {
      console.log(`Processing account: ${account.name}`);
      
      // Switch to account
      await switchToAccount(page, account.id);
      
      // Extract data
      const data = await scrapeAccount(page, account.id);
      
      results.push({
        accountId: account.id,
        accountName: account.name,
        data: data,
        timestamp: new Date().toISOString()
      });
    }
    
    return { success: true, data: results, errors: [] };
    
  } catch (error) {
    console.error('Scraping failed:', error);
    return { success: false, data: [], errors: [error.message] };
  } finally {
    await closeBrowser(browser);
  }
}
```

### Account Switcher: `account-switcher.js`

Handles navigation between accounts.

**Key Challenge**: Amazon's account switcher UI may vary. We need to:
1. Locate the account switcher dropdown
2. Click to open it
3. Find the target account
4. Click to switch
5. Wait for page reload

**Implementation**:

```javascript
async function switchToAccount(page, targetAccountId) {
  try {
    // Wait for account switcher to be available
    await page.waitForSelector('#sc-account-switcher', { timeout: 10000 });
    
    // Click account switcher
    await page.click('#sc-account-switcher');
    
    // Wait for dropdown to appear
    await page.waitForSelector('.account-switcher-dropdown', { timeout: 5000 });
    
    // Find and click target account
    const accountSelector = `[data-account-id="${targetAccountId}"]`;
    await page.click(accountSelector);
    
    // Wait for page to reload/update
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log(`Switched to account: ${targetAccountId}`);
    return true;
    
  } catch (error) {
    console.error(`Failed to switch to account ${targetAccountId}:`, error);
    throw error;
  }
}

async function getCurrentAccount(page) {
  try {
    // Extract current account name from UI
    const accountName = await page.$eval(
      '#current-account-name',
      el => el.textContent.trim()
    );
    return accountName;
  } catch (error) {
    console.error('Failed to get current account:', error);
    return null;
  }
}
```

### Data Extractors: `data-extractors.js`

Contains specialized functions for extracting different metrics.

**Key Functions**:

```javascript
// Extract overview metrics (revenue, clicks, orders)
async function extractOverviewData(page) {
  await page.goto('https://affiliate-program.amazon.com/home/reports', {
    waitUntil: 'networkidle2'
  });
  
  // Wait for data to load
  await page.waitForSelector('.dashboard-metrics', { timeout: 10000 });
  
  const data = await page.evaluate(() => {
    return {
      revenue: parseFloat(
        document.querySelector('.metric-revenue')?.textContent || '0'
      ),
      clicks: parseInt(
        document.querySelector('.metric-clicks')?.textContent || '0'
      ),
      orders: parseInt(
        document.querySelector('.metric-orders')?.textContent || '0'
      ),
      // ... more metrics
    };
  });
  
  return data;
}

// Extract product-level data
async function extractProductData(page) {
  await page.goto('https://affiliate-program.amazon.com/home/reports/products', {
    waitUntil: 'networkidle2'
  });
  
  await page.waitForSelector('.product-table', { timeout: 10000 });
  
  const products = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.product-row'));
    
    return rows.map(row => ({
      asin: row.querySelector('.asin')?.textContent.trim(),
      name: row.querySelector('.product-name')?.textContent.trim(),
      clicks: parseInt(row.querySelector('.clicks')?.textContent || '0'),
      orders: parseInt(row.querySelector('.orders')?.textContent || '0'),
      revenue: parseFloat(row.querySelector('.revenue')?.textContent || '0')
    }));
  });
  
  return products;
}

// Extract earnings data
async function extractEarningsData(page) {
  // Navigate to earnings report
  await page.goto('https://affiliate-program.amazon.com/home/reports/earnings', {
    waitUntil: 'networkidle2'
  });
  
  await page.waitForSelector('.earnings-summary', { timeout: 10000 });
  
  const earnings = await page.evaluate(() => {
    return {
      totalEarnings: parseFloat(
        document.querySelector('.total-earnings')?.textContent || '0'
      ),
      pendingEarnings: parseFloat(
        document.querySelector('.pending-earnings')?.textContent || '0'
      ),
      // ... more metrics
    };
  });
  
  return earnings;
}

// Main extraction orchestrator
async function extractAllData(page) {
  console.log('Extracting all data...');
  
  const overview = await extractOverviewData(page);
  const products = await extractProductData(page);
  const earnings = await extractEarningsData(page);
  
  return {
    overview,
    products,
    earnings,
    extractedAt: new Date().toISOString()
  };
}

module.exports = {
  extractOverviewData,
  extractProductData,
  extractEarningsData,
  extractAllData
};
```

**Important Notes**:
- Selectors (`.metric-revenue`, etc.) are placeholders
- Need to inspect actual Amazon dashboard to get real selectors
- Consider using data attributes if available
- Add retry logic for flaky selectors

---

## Pipedream Workflow

### Main Workflow: `workflow-template.js`

**Pipedream Structure**:

```javascript
// Step 1: Cron Trigger (configured in Pipedream UI)
// Runs daily at 6am EST

// Step 2: Load Configuration
export default defineComponent({
  async run({ steps, $ }) {
    const accounts = JSON.parse(process.env.ACCOUNTS_CONFIG);
    const credentials = {
      email: process.env.AMAZON_EMAIL,
      password: process.env.AMAZON_PASSWORD
    };
    
    return { accounts, credentials };
  }
});

// Step 3: Run Puppeteer Scraper
export default defineComponent({
  async run({ steps, $ }) {
    // Import scraper (need to bundle or use npm package)
    const scraper = require('./amazon-associates-scraper');
    
    const { accounts, credentials } = steps.load_config;
    
    // Run scraper
    const results = await scraper.scrapeAllAccounts(
      credentials,
      accounts
    );
    
    if (!results.success) {
      throw new Error(`Scraping failed: ${results.errors.join(', ')}`);
    }
    
    return results.data;
  }
});

// Step 4: Process Data for Sheets
export default defineComponent({
  async run({ steps, $ }) {
    const scrapedData = steps.run_scraper;
    
    // Transform data for Google Sheets format
    const processedData = scrapedData.map(account => {
      const { overview, earnings } = account.data;
      
      return {
        accountId: account.accountId,
        accountName: account.accountName,
        row: [
          new Date().toISOString().split('T')[0], // Date
          account.accountName,                     // Account Name
          overview.revenue || 0,                   // Revenue
          earnings.totalEarnings || 0,            // Earnings
          overview.clicks || 0,                   // Clicks
          overview.orders || 0,                   // Orders
          overview.conversionRate || 0,           // Conversion Rate
          overview.itemsOrdered || 0,             // Items Ordered
          overview.itemsShipped || 0,             // Items Shipped
          overview.revenuePerClick || 0,          // Revenue Per Click
          new Date().toISOString()                // Last Updated
        ]
      };
    });
    
    return processedData;
  }
});

// Step 5: Update Google Sheets (loop for each account)
export default defineComponent({
  async run({ steps, $ }) {
    const sheetsData = steps.process_data;
    const updatedSheets = [];
    
    for (const accountData of sheetsData) {
      // Get sheet ID for this account
      const sheetId = process.env[`SHEET_ID_${accountData.accountId.toUpperCase()}`];
      
      if (!sheetId) {
        console.warn(`No sheet ID for account: ${accountData.accountId}`);
        continue;
      }
      
      // Check for duplicates
      const isDupe = await checkForDuplicate(sheetId, accountData.row[0]);
      
      if (isDupe) {
        console.log(`Duplicate detected for ${accountData.accountName}, skipping`);
        continue;
      }
      
      // Append row using Pipedream's Google Sheets integration
      await $.send.http({
        method: 'POST',
        url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:K:append`,
        headers: {
          'Authorization': `Bearer ${auth.access_token}`
        },
        params: {
          valueInputOption: 'USER_ENTERED'
        },
        data: {
          values: [accountData.row]
        }
      });
      
      updatedSheets.push(accountData.accountName);
    }
    
    return { updatedSheets, count: updatedSheets.length };
  }
});

// Step 6: Send Summary (optional)
export default defineComponent({
  async run({ steps, $ }) {
    const { updatedSheets, count } = steps.update_sheets;
    
    console.log(`Successfully updated ${count} sheets: ${updatedSheets.join(', ')}`);
    
    // Optional: Send email summary
    // Use Pipedream's email action here
    
    return { success: true, updatedCount: count };
  }
});
```

---

## Google Sheets Integration

### Duplicate Detection: `duplicate-detector.js`

```javascript
async function checkForDuplicate(sheetsAPI, sheetId, date, accountId) {
  try {
    // Fetch last 100 rows
    const response = await sheetsAPI.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:B', // Date and Account Name columns
    });
    
    const rows = response.data.values || [];
    
    // Check if combination of date + account exists
    const exists = rows.some(row => {
      return row[0] === date && row[1] === accountId;
    });
    
    return exists;
    
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return false; // Assume not duplicate on error (safer to insert)
  }
}

module.exports = { checkForDuplicate };
```

### Sheets Updater: `google-sheets-updater.js`

```javascript
const { google } = require('googleapis');

async function appendToSheet(sheetId, tabName, rowData) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: './credentials.json', // Or use env var
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    const range = `${tabName}!A:K`;
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData]
      }
    });
    
    console.log(`Appended row to sheet: ${sheetId}`);
    return response.data;
    
  } catch (error) {
    console.error('Error appending to sheet:', error);
    throw error;
  }
}

module.exports = { appendToSheet };
```

---

## Testing Strategy

### 1. Unit Tests

Test individual functions:

```javascript
// test/scraper.test.js
const { extractOverviewData } = require('../src/scraper/data-extractors');

describe('Data Extractors', () => {
  it('should extract overview data', async () => {
    // Mock page object
    const mockPage = {
      goto: jest.fn(),
      waitForSelector: jest.fn(),
      evaluate: jest.fn().mockResolvedValue({
        revenue: 1000,
        clicks: 500
      })
    };
    
    const result = await extractOverviewData(mockPage);
    
    expect(result.revenue).toBe(1000);
    expect(result.clicks).toBe(500);
  });
});
```

### 2. Integration Tests

Test end-to-end flow locally:

```javascript
// test/integration.test.js
const scraper = require('../src/scraper/amazon-associates-scraper');

describe('Full Scraping Flow', () => {
  it('should scrape all accounts', async () => {
    const credentials = {
      email: process.env.TEST_EMAIL,
      password: process.env.TEST_PASSWORD
    };
    
    const accounts = [{ id: 'test-account', name: 'Test' }];
    
    const results = await scraper.scrapeAllAccounts(credentials, accounts);
    
    expect(results.success).toBe(true);
    expect(results.data.length).toBe(1);
  }, 60000); // 60 second timeout
});
```

### 3. Manual Testing

1. Run scraper locally with real credentials
2. Check console output for errors
3. Verify data structure
4. Test with multiple accounts
5. Test duplicate detection
6. Test Google Sheets update

---

## Deployment

### Step 1: Prepare Pipedream

1. Create new workflow
2. Add cron trigger (6am EST daily)
3. Add environment variables
4. Configure Google Sheets auth

### Step 2: Deploy Code

**Option A: Copy-Paste** (Simplest)
- Copy each code step directly into Pipedream

**Option B: NPM Package** (Better for complex projects)
- Bundle code into npm package
- Import in Pipedream

**Option C: GitHub Integration** (Best)
- Push code to GitHub
- Use Pipedream's GitHub integration

### Step 3: Test Deployment

1. Click "Test" in Pipedream
2. Monitor execution logs
3. Check for errors
4. Verify data in Google Sheets

### Step 4: Enable Schedule

1. Activate cron trigger
2. Wait for first scheduled run
3. Monitor for 7 days

---

## Next Steps

1. Review [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) for deployment
2. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
3. See [API_REFERENCE.md](./API_REFERENCE.md) for code documentation

---

**Version**: 1.0  
**Last Updated**: November 3, 2025

