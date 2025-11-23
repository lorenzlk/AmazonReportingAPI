# Amazon Associates Reporting - System Architecture

**Version**: 1.0  
**Date**: November 3, 2025

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         PIPEDREAM WORKFLOW                       │
│                     (Runs Daily via Cron)                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 1: Configuration                         │
│  - Load account list                                             │
│  - Load credentials from env vars                                │
│  - Load Google Sheets mapping                                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                STEP 2: Puppeteer Browser Launch                  │
│  - Launch headless browser                                       │
│  - Set up request interception (optional)                        │
│  - Configure timeouts                                            │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  STEP 3: Authentication                          │
│  - Navigate to Amazon Associates login                           │
│  - Enter credentials                                             │
│  - Handle any security checks                                    │
│  - Wait for dashboard load                                       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│          STEP 4: Multi-Account Data Extraction Loop              │
│  FOR EACH ACCOUNT:                                               │
│    ├─ Switch to account (if not current)                         │
│    ├─ Navigate to reports section                                │
│    ├─ Extract all available metrics                              │
│    ├─ Capture product-level data                                 │
│    └─ Store in temporary data structure                          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 5: Data Processing                       │
│  - Normalize data format                                         │
│  - Add timestamps                                                │
│  - Calculate derived metrics                                     │
│  - Prepare for sheet insertion                                   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│               STEP 6: Duplicate Detection                        │
│  FOR EACH ACCOUNT'S DATA:                                        │
│    ├─ Fetch last N rows from Google Sheet                        │
│    ├─ Check if date+account already exists                       │
│    └─ Flag as new or duplicate                                   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│            STEP 7: Google Sheets Update                          │
│  FOR EACH ACCOUNT:                                               │
│    ├─ Connect to account-specific sheet                          │
│    ├─ Append new rows (skip duplicates)                          │
│    └─ Log results                                                │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                STEP 8: Cleanup & Notification                    │
│  - Close browser                                                 │
│  - Log summary statistics                                        │
│  - Send error notifications (if any)                             │
│  - Return success status                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Core Components

```
src/
├── scraper/
│   ├── amazon-associates-scraper.js    # Main scraper orchestrator
│   ├── account-switcher.js             # Account navigation logic
│   ├── data-extractors.js              # Metric extraction utilities
│   └── config.js                       # Scraper configuration
├── pipedream/
│   ├── workflow-template.js            # Main Pipedream workflow
│   └── google-sheets-updater.js        # Sheets integration
└── utils/
    ├── duplicate-detector.js           # Duplicate detection logic
    └── date-utils.js                   # Date formatting utilities
```

### 2.2 Component Descriptions

#### **amazon-associates-scraper.js**
- Main entry point for scraping logic
- Orchestrates browser launch, login, and data extraction
- Exports: `scrapeAllAccounts(credentials, accountList)`
- Returns: `{ success: boolean, data: Array, errors: Array }`

#### **account-switcher.js**
- Handles navigation between accounts
- Detects current account
- Switches to target account
- Exports: `switchToAccount(page, accountId)`

#### **data-extractors.js**
- Contains extraction functions for each metric
- Handles different report sections
- Exports: `extractOverviewData()`, `extractProductData()`, etc.

#### **duplicate-detector.js**
- Checks for existing records
- Implements duplicate detection logic
- Exports: `isDuplicate(newRecord, existingRecords)`

#### **google-sheets-updater.js**
- Google Sheets API integration
- Batch append operations
- Sheet creation if needed
- Exports: `appendToSheet(sheetId, data)`

---

## 3. Data Flow

### 3.1 Input Data

```javascript
// Environment Variables (Pipedream)
{
  "AMAZON_EMAIL": "your-email@example.com",
  "AMAZON_PASSWORD": "your-password",
  "GOOGLE_SHEETS_API_KEY": "...",
  "ACCOUNTS_CONFIG": "account1,account2,account3"
}
```

### 3.2 Scraped Data Structure

```javascript
{
  "date": "2025-11-03",
  "accountId": "account-123",
  "accountName": "My Store Name",
  "metrics": {
    "revenue": 1234.56,
    "earnings": 123.45,
    "clicks": 5000,
    "orders": 150,
    "conversionRate": 3.0,
    "itemsOrdered": 200,
    "itemsShipped": 195,
    "revenuePerClick": 0.25
  },
  "products": [
    {
      "asin": "B08XYZ1234",
      "name": "Product Name",
      "clicks": 100,
      "orders": 5,
      "revenue": 125.00
    }
    // ... more products
  ],
  "timestamp": "2025-11-03T06:00:00Z"
}
```

### 3.3 Google Sheets Output Format

**Summary Sheet** (per account):
```
| Date       | Account Name | Revenue | Earnings | Clicks | Orders | Conv Rate | Items Ordered | Items Shipped | Rev/Click | Last Updated |
|------------|--------------|---------|----------|--------|--------|-----------|---------------|---------------|-----------|--------------|
| 2025-11-03 | My Store     | 1234.56 | 123.45   | 5000   | 150    | 3.0%      | 200           | 195           | 0.25      | 2025-11-03T06:00:00Z |
```

**Product Detail Sheet** (optional, per account):
```
| Date       | ASIN        | Product Name | Clicks | Orders | Revenue | Last Updated |
|------------|-------------|--------------|--------|--------|---------|--------------|
| 2025-11-03 | B08XYZ1234  | Product Name | 100    | 5      | 125.00  | 2025-11-03T06:00:00Z |
```

---

## 4. Technical Decisions

### 4.1 Why Puppeteer?
- **Pros**:
  - Full browser automation
  - Handles JavaScript-heavy sites
  - Can capture screenshots for debugging
  - Free and open-source
- **Cons**:
  - Higher resource usage
  - Slower than API calls
  - More brittle (UI changes break it)

**Decision**: Use Puppeteer as Amazon doesn't provide an API

### 4.2 Why Pipedream?
- **Pros**:
  - Built-in scheduling
  - Environment variable management
  - Pre-built Google Sheets integration
  - Free tier sufficient for daily runs
  - Easy monitoring and logging
- **Cons**:
  - Execution time limits (may need to optimize)
  - Memory constraints on free tier

**Decision**: Use Pipedream for consistency with other projects (TWSN, Board Pulse)

### 4.3 Why Google Sheets?
- **Pros**:
  - Familiar interface
  - Easy sharing and collaboration
  - Built-in visualization
  - No database setup needed
- **Cons**:
  - API rate limits
  - Not ideal for huge datasets

**Decision**: Google Sheets for simplicity and ease of use

### 4.4 Sequential vs. Parallel Account Processing
**Decision**: Process accounts sequentially to:
- Avoid rate limiting
- Simplify error handling
- Reduce memory usage
- Prevent session conflicts

---

## 5. Error Handling Strategy

### 5.1 Retry Logic

```javascript
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function scrapeWithRetry(fn, retries = MAX_RETRIES) {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY);
      return scrapeWithRetry(fn, retries - 1);
    }
    throw error;
  }
}
```

### 5.2 Error Types & Handling

| Error Type | Handling Strategy |
|------------|-------------------|
| Login failure | Retry 3x, then notify admin |
| Account switch failure | Skip account, log error, continue |
| Data extraction failure | Use partial data, log warning |
| Google Sheets API error | Retry with exponential backoff |
| Timeout | Increase timeout, retry once |
| Network error | Retry 3x with backoff |

---

## 6. Performance Considerations

### 6.1 Optimization Strategies
1. **Minimize page loads**: Stay on same page when possible
2. **Batch Google Sheets operations**: Append all rows at once
3. **Cache selectors**: Don't re-query DOM unnecessarily
4. **Parallel data extraction**: Extract multiple metrics simultaneously
5. **Early termination**: Stop if critical error occurs

### 6.2 Expected Performance
- Login: ~10 seconds
- Per-account scraping: ~30-60 seconds
- Google Sheets update: ~5 seconds per account
- **Total for 5 accounts**: ~5-7 minutes

---

## 7. Security Considerations

### 7.1 Credential Management
- Store credentials in Pipedream environment variables
- Never log credentials
- Use secure HTTPS connections
- Rotate credentials periodically

### 7.2 Data Privacy
- No sensitive data in logs
- Minimize data retention
- Secure Google Sheets access (private sharing only)

---

## 8. Monitoring & Logging

### 8.1 What to Log
- Workflow start/end times
- Accounts processed
- Records added per account
- Errors and warnings
- Performance metrics

### 8.2 Success Metrics
- Daily successful runs: Target 100%
- Data completeness: Target 100%
- Average runtime: Target <10 minutes
- Error rate: Target <1%

---

## 9. Scalability

### 9.1 Current Limitations
- Pipedream execution time: 300 seconds (free tier)
- Google Sheets API: 100 requests per 100 seconds
- Puppeteer memory: ~100-200MB per browser instance

### 9.2 Scaling Strategies (if needed)
1. Split accounts across multiple workflows
2. Upgrade Pipedream tier for longer execution
3. Use Google Sheets batch API
4. Implement database backend for high-volume accounts

---

## 10. Deployment Architecture

```
Developer                  Pipedream               Amazon          Google
   │                          │                      │               │
   │  1. Deploy Workflow      │                      │               │
   ├─────────────────────────>│                      │               │
   │                          │                      │               │
   │                          │  2. Cron Trigger     │               │
   │                          │  (Daily 6am EST)     │               │
   │                          │                      │               │
   │                          │  3. Login            │               │
   │                          ├─────────────────────>│               │
   │                          │                      │               │
   │                          │  4. Scrape Data      │               │
   │                          │<─────────────────────│               │
   │                          │                      │               │
   │                          │  5. Store Data       │               │
   │                          ├──────────────────────────────────────>│
   │                          │                      │               │
   │  6. Monitor Logs         │                      │               │
   │<─────────────────────────│                      │               │
```

---

**Next Steps**: Review [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for deployment instructions

