# System Patterns - Amazon Associates Automated Reporting

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PIPEDREAM WORKFLOW                    │
│                  (Orchestration Layer)                   │
└──────────────┬──────────────────────────────────────────┘
               │
               ├─ Cron Trigger (6am EST daily)
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│                   SCRAPING LAYER                         │
│                  (Puppeteer Browser)                     │
└──────────────┬──────────────────────────────────────────┘
               │
               ├─ Login & Authentication
               ├─ Account Switching
               ├─ Data Extraction
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│                  PROCESSING LAYER                        │
│              (Data Normalization & Validation)           │
└──────────────┬──────────────────────────────────────────┘
               │
               ├─ Normalize data format
               ├─ Duplicate detection
               ├─ Error handling
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│                   STORAGE LAYER                          │
│                   (Google Sheets)                        │
└─────────────────────────────────────────────────────────┘
```

### Component Relationships

```
amazon-associates-scraper.js
    ├─ Orchestrates entire scraping process
    ├─ Uses: account-switcher.js
    ├─ Uses: data-extractors.js
    ├─ Uses: config.js
    └─ Returns: Structured data for all accounts

account-switcher.js
    ├─ Handles navigation between accounts
    ├─ Detects current account
    ├─ Switches to target account
    └─ Returns: Success/failure status

data-extractors.js
    ├─ Extracts overview metrics
    ├─ Extracts product data (optional)
    ├─ Extracts earnings data
    ├─ Returns: Normalized data objects
    └─ Uses: config.js for selectors

workflow-template.js (Pipedream)
    ├─ Step 1: Load configuration
    ├─ Step 2: Run scraper
    ├─ Step 3: Process data
    ├─ Step 4: Check duplicates
    ├─ Step 5: Update Google Sheets
    └─ Step 6: Send notifications

google-sheets-updater.js
    ├─ Initializes Google Sheets client
    ├─ Fetches existing rows
    ├─ Appends new rows
    ├─ Uses: duplicate-detector.js
    └─ Returns: Update results

duplicate-detector.js
    ├─ Compares date + account combinations
    ├─ Filters duplicate rows
    ├─ Creates unique keys
    └─ Returns: Boolean or filtered arrays

date-utils.js
    ├─ Formats dates consistently
    ├─ Provides date helpers
    └─ Returns: Formatted date strings
```

---

## Key Technical Decisions

### 1. Browser Automation with Puppeteer

**Decision:** Use Puppeteer for scraping  
**Rationale:**
- Amazon has no reporting API
- Dashboard is JavaScript-heavy (requires full browser)
- Puppeteer is mature, well-documented
- Good support in Pipedream environment
- Can handle authentication, navigation, and data extraction

**Alternatives Considered:**
- Playwright: More modern but less mature Pipedream support
- Selenium: Heavier, more complex setup
- Simple HTTP requests: Won't work with JavaScript-rendered content

**Trade-offs:**
- Pro: Reliable, can handle complex UIs
- Con: Slower than API calls
- Con: More brittle (UI changes break it)
- Con: Higher resource usage

### 2. Pipedream for Orchestration

**Decision:** Use Pipedream workflows  
**Rationale:**
- $0/month on free tier
- Built-in scheduling (cron)
- Environment variable management
- Pre-built integrations (Google Sheets)
- Consistent with other projects (TWSN, Board Pulse)

**Alternatives Considered:**
- AWS Lambda: More powerful but complex, costs money
- Custom Node.js server: Requires hosting, maintenance
- GitHub Actions: Good for CI/CD, awkward for scheduled scraping

**Trade-offs:**
- Pro: Simple, managed, free
- Con: 300-second timeout on free tier
- Con: Vendor lock-in

### 3. Google Sheets for Storage

**Decision:** Store data in Google Sheets (one per account)  
**Rationale:**
- Familiar interface for users
- No database setup/hosting
- Built-in visualization capabilities
- Easy sharing and collaboration
- Free (within generous limits)

**Alternatives Considered:**
- PostgreSQL/MySQL: More powerful but requires hosting
- Airtable: Good but costs money
- CSV files in GitHub: Awkward, no UI

**Trade-offs:**
- Pro: Simple, visual, free, shareable
- Con: API rate limits (100 requests per 100 seconds)
- Con: Not ideal for huge datasets
- Con: Limited query capabilities

### 4. Sequential Account Processing

**Decision:** Process accounts one at a time (sequentially)  
**Rationale:**
- Avoid triggering rate limits
- Simpler error handling
- Lower memory usage
- Prevents session conflicts

**Alternatives Considered:**
- Parallel processing: Faster but riskier

**Trade-offs:**
- Pro: Safer, more predictable
- Con: Slower (3+ seconds per account overhead)
- Note: Can parallelize later if needed

### 5. Duplicate Detection Strategy

**Decision:** Check last N rows for date + account match  
**Rationale:**
- Simple and efficient
- Catches accidental reruns
- No external database needed
- Works with Google Sheets API

**Alternatives Considered:**
- SHA hash of entire row: Overkill for this use case
- External tracking database: Adds complexity

**Implementation:**
```javascript
// Composite key: date + accountId
const isDuplicate = existingRows.some(row => {
  return row[0] === date && row[1] === accountId;
});
```

---

## Design Patterns in Use

### 1. Retry Pattern

**Used in:** Login, account switching, data extraction

```javascript
async function withRetry(fn, maxRetries = 3, delay = 5000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await sleep(delay);
      }
    }
  }
  throw lastError;
}
```

**Why:** Network issues and timing problems are common in scraping; retries improve reliability.

### 2. Fail Gracefully Pattern

**Used in:** Account processing loop

```javascript
for (const account of accounts) {
  try {
    const data = await scrapeAccount(account);
    results.push(data);
  } catch (error) {
    errors.push({ account, error });
    continue; // Don't stop entire workflow
  }
}
```

**Why:** One account failure shouldn't stop other accounts from processing.

### 3. Configuration Injection Pattern

**Used in:** Throughout codebase

```javascript
// config.js defines all settings
const config = require('./config');

// Components use config
await page.waitForSelector(config.SELECTORS.dashboard);
```

**Why:** Centralized configuration makes updates easier (especially selector updates).

### 4. Safe Navigation Pattern

**Used in:** Element selection

```javascript
const element = await page.$(selector);
if (!element) {
  console.warn(`Element not found: ${selector}`);
  return defaultValue;
}
```

**Why:** Gracefully handle missing elements instead of crashing.

### 5. Normalize-Transform-Load (NTL) Pattern

**Data Flow:**
```javascript
// Extract (raw data from page)
const rawData = await page.evaluate(() => { ... });

// Normalize (parse and structure)
const normalized = {
  revenue: parseCurrency(rawData.revenue),
  clicks: parseInteger(rawData.clicks)
};

// Load (insert into sheets)
await appendToSheet(normalized);
```

**Why:** Separation of concerns; easier to debug and maintain.

---

## Critical Implementation Paths

### Path 1: Login Flow

```
Start
  ↓
Navigate to login URL
  ↓
Enter email → Click continue
  ↓
Enter password → Click sign in
  ↓
Wait for dashboard indicator
  ↓
Verify login success
  ↓
[Ready for scraping]
```

**Critical Points:**
- Email and password selectors must be accurate
- Navigation waits must be sufficient
- Dashboard indicator confirms success

**Failure Points:**
- Incorrect credentials → Retry won't help (fail fast)
- Captcha appears → May need manual intervention
- Timeout → Retry may help

### Path 2: Account Switching Flow

```
Check if switcher exists
  ↓
Get current account
  ↓
If already on target → Skip
  ↓
Click switcher dropdown
  ↓
Select target account
  ↓
Wait for page reload
  ↓
Verify switch success
  ↓
[Ready to scrape account]
```

**Critical Points:**
- Account switcher selector must be found
- Dropdown must load before selecting
- Page reload detection is important

**Failure Points:**
- No account switcher (single account) → Not an error
- Account not in dropdown → Configuration error
- Switch appears to fail → May be timing issue (retry)

### Path 3: Data Extraction Flow

```
For each data source:
  ↓
Navigate to report page
  ↓
Wait for data to load
  ↓
Execute page.evaluate() to extract
  ↓
Parse and normalize data
  ↓
Return structured object
```

**Critical Points:**
- Correct URLs for each report section
- Selectors match actual Amazon UI
- Wait times account for slow loading

**Failure Points:**
- Page doesn't load → Retry
- Selector doesn't match → Update config
- Data format unexpected → Add validation

### Path 4: Duplicate Detection & Storage Flow

```
Fetch last N rows from sheet
  ↓
Check if date + account exists
  ↓
If duplicate → Skip, log warning
  ↓
If new → Append to sheet
  ↓
Return success status
```

**Critical Points:**
- Sheet ID must be correct
- Composite key (date + account) is reliable
- Append operation is atomic

**Failure Points:**
- Sheet not found → Configuration error
- Permission denied → Auth issue
- API rate limit → Batch operations, retry

---

## Data Flow Details

### Input Data Sources

1. **Environment Variables (Pipedream)**
   ```
   AMAZON_EMAIL
   AMAZON_PASSWORD
   ACCOUNTS_CONFIG
   SHEET_ID_ACCOUNT-1
   SHEET_ID_ACCOUNT-2
   ...
   ```

2. **Configuration Files**
   ```
   config/accounts.json
   config/sheets-mapping.json
   src/scraper/config.js
   ```

3. **Amazon Associates Dashboard**
   ```
   HTML elements containing metrics
   Report tables with data
   Account switcher UI
   ```

### Data Transformation Pipeline

```
Amazon HTML
    ↓ [page.evaluate]
Raw Strings
    ↓ [parseCurrency, parseInteger, parsePercentage]
Typed Numbers
    ↓ [normalize into objects]
Structured Data Objects
    ↓ [format for sheets]
Array of Row Values
    ↓ [duplicate check]
Filtered New Rows
    ↓ [append to sheets]
Persisted Data
```

### Output Data Format

**Google Sheets Row:**
```javascript
[
  "2025-11-03",           // Date
  "Account Name",         // Account Name
  1234.56,                // Revenue
  123.45,                 // Earnings
  5000,                   // Clicks
  150,                    // Orders
  3.0,                    // Conversion Rate
  200,                    // Items Ordered
  195,                    // Items Shipped
  0.25,                   // Revenue Per Click
  "2025-11-03T06:00:00Z"  // Last Updated
]
```

---

## Error Handling Architecture

### Error Categories

1. **Fatal Errors** (Stop entire workflow)
   - Invalid credentials
   - Missing configuration
   - Pipedream infrastructure failure

2. **Recoverable Errors** (Retry)
   - Network timeout
   - Page load failure
   - Temporary rate limit

3. **Account-Level Errors** (Skip account, continue)
   - Account switch failure
   - Data extraction failure for one account
   - Sheet update failure for one account

4. **Warnings** (Log and continue)
   - Duplicate entry detected
   - Optional data missing
   - Screenshot save failure

### Error Handling Strategy

```
Try Operation
  ↓
[Success] → Continue
  ↓
[Failure] → Classify Error
  ↓
├─ Fatal → Stop workflow, notify
├─ Recoverable → Retry with backoff
├─ Account-level → Log, skip account
└─ Warning → Log, continue
```

---

## Performance Considerations

### Bottlenecks

1. **Browser Operations** (Slowest)
   - Page loads: 2-5 seconds each
   - Element selection: 100-500ms each
   - Mitigation: Increase timeouts, optimize navigation

2. **Google Sheets API** (Medium)
   - Read operations: 1-2 seconds
   - Write operations: 1-2 seconds
   - Mitigation: Batch operations, cache reads

3. **Account Switching** (Medium)
   - Navigation delay: 3 seconds (intentional)
   - Mitigation: Can reduce if no rate limiting observed

### Optimization Strategies

**Current:**
- Sequential processing (safer)
- Delays between accounts (3 seconds)
- Single batch append per account

**Future Optimizations (if needed):**
- Parallel account processing
- Reduce delays if safe
- Disable product extraction
- Reduce max products limit
- Cache Google Sheets data

### Expected Performance

**Per Account:**
- Login: ~10 seconds (once per workflow)
- Account switch: ~5 seconds
- Data extraction: ~30-60 seconds
- Sheets update: ~5 seconds

**Total for 5 Accounts:**
- 10 + (5 * 5) + (5 * 45) + (5 * 5) = 10 + 25 + 225 + 25 = **~285 seconds (~5 minutes)**

**Within 300-second Pipedream limit.**

---

## Security Patterns

### Credential Management

**DO:**
- Store in environment variables
- Use HTTPS for all connections
- Never log credentials
- Rotate periodically

**DON'T:**
- Hardcode in files
- Commit to git
- Log in error messages
- Share in documentation

### Data Privacy

**Sensitive Data:**
- Amazon credentials
- Google API keys
- Account revenue numbers

**Protection:**
- Environment variables in Pipedream
- .gitignore for local config files
- Private Google Sheets
- Secure Pipedream logs (no credential logging)

---

## Monitoring & Observability

### What to Monitor

1. **Success Rate:** % of successful workflow runs
2. **Execution Time:** Total time per run
3. **Error Rate:** % of accounts failing
4. **Data Completeness:** All accounts have data for today

### Logging Strategy

**Levels:**
```javascript
console.log('✓ Success')    // Success operations
console.warn('⚠ Warning')    // Non-critical issues
console.error('✗ Error')     // Failures
console.debug('🔍 Debug')    // Detailed info (if enabled)
```

**Structured Logs:**
```javascript
{
  timestamp: ISO8601,
  level: 'info|warn|error',
  component: 'scraper|sheets|workflow',
  account: 'account-id',
  message: 'Human-readable message',
  data: { ... }
}
```

### Alerting

**Immediate (Email):**
- All accounts failed
- Login failure
- Critical errors

**Daily Digest:**
- Summary of runs
- Partial failures
- Performance metrics

---

## Scalability Considerations

### Current Limits

- **Accounts:** ~10-15 (based on 300-second timeout)
- **Data Volume:** Unlimited (Google Sheets handles it)
- **Frequency:** Daily (can increase if needed)

### Scaling Strategies

**More Accounts:**
- Split across multiple workflows
- Upgrade Pipedream tier (longer timeout)
- Optimize extraction time

**Higher Frequency:**
- Change cron schedule
- May need to handle "no new data" scenario

**More Data Points:**
- Selective extraction (disable products)
- Pagination for product data
- Parallel extraction of different metrics

---

## Testing Strategy

### Manual Testing

1. **Local Testing:**
   ```bash
   node src/scraper/amazon-associates-scraper.js
   ```

2. **Pipedream Testing:**
   - Click "Test" button
   - Review execution logs
   - Verify sheet updates

### Validation Checks

- ✅ Login succeeds
- ✅ All accounts processed
- ✅ Data appears in sheets
- ✅ No duplicates created
- ✅ Error notifications work
- ✅ Execution time acceptable

### Edge Cases

- Single account (no switcher needed)
- All accounts fail (notification sent)
- Network timeout (retry works)
- Duplicate run (skips correctly)
- Missing optional data (graceful degradation)

