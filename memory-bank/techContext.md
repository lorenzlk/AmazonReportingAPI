# Tech Context - Amazon Associates Automated Reporting

## Technology Stack

### Core Technologies

**Runtime:**
- Node.js 18+ (provided by Pipedream)
- JavaScript (ES6+)

**Browser Automation:**
- Puppeteer 21.5.0
  - Headless Chromium browser
  - Full DOM access and JavaScript execution
  - Screenshot capabilities for debugging
  - Used for: Amazon Associates dashboard scraping

**Workflow Orchestration:**
- Pipedream (Cloud platform)
  - Cron scheduler
  - Environment variable management
  - Built-in integrations
  - Free tier: 300-second execution limit

**Data Storage:**
- Google Sheets API (googleapis 128.0.0)
  - Sheets v4 API
  - Service account authentication
  - Batch operations support
  - Used for: Historical data storage

**Utilities:**
- dotenv 16.3.1 (local environment variables)

---

## Development Setup

### Local Development

**Prerequisites:**
```bash
- Node.js 18.0.0 or higher
- npm (comes with Node.js)
- Git
- Text editor (VSCode recommended)
```

**Installation:**
```bash
# Navigate to project
cd "/Users/loganlorenz/AA Reporting"

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit .env with your credentials
# (Never commit .env to git)
```

**Environment Variables:**
```bash
# .env file
AMAZON_EMAIL=your-email@example.com
AMAZON_PASSWORD=your-password
ACCOUNTS_CONFIG=account-1,account-2,account-3
SHEET_ID_ACCOUNT-1=your-sheet-id
SHEET_ID_ACCOUNT-2=your-sheet-id
SHEET_ID_ACCOUNT-3=your-sheet-id
HEADLESS=true
EXTRACT_PRODUCTS=true
```

### Local Testing

**Run Scraper:**
```bash
node src/scraper/amazon-associates-scraper.js
```

**Run with Debug:**
```bash
HEADLESS=false VERBOSE_LOGGING=true node src/scraper/amazon-associates-scraper.js
```

**Test Individual Components:**
```bash
# Test data extractors
node -e "const { parseCurrency } = require('./src/scraper/data-extractors'); console.log(parseCurrency('$1,234.56'));"

# Test date utilities
node -e "const { formatDate, getToday } = require('./src/utils/date-utils'); console.log(getToday());"
```

---

## Pipedream Production Setup

### Account & Project

**Platform:** Pipedream (https://pipedream.com)  
**Tier:** Free (sufficient for this project)  
**Workspace:** Logan's workspace

### Workflow Configuration

**Trigger:**
- Type: Cron Scheduler
- Schedule: `0 6 * * *` (6am EST daily)
- Timezone: `America/New_York`

**Environment Variables:**
```
AMAZON_EMAIL
AMAZON_PASSWORD
ACCOUNTS_CONFIG
SHEET_ID_ACCOUNT-1
SHEET_ID_ACCOUNT-2
SHEET_ID_ACCOUNT-3
```

**Connected Services:**
- Google Sheets (OAuth connection)

**Workflow Structure:**
1. Cron Trigger
2. Load Configuration (Node.js step)
3. Run Scraper (Node.js step)
4. Process Data (Node.js step)
5. Check Duplicates (Node.js + Google Sheets step)
6. Update Sheets (Google Sheets action)
7. Send Summary (Node.js step)
8. Error Notification (Email/Slack step - conditional)

---

## Technical Constraints

### Pipedream Limitations

**Free Tier:**
- Execution timeout: 300 seconds (5 minutes)
- Memory: Limited (exact limit not documented)
- Concurrent executions: 1 per workflow
- Workflow invocations: Unlimited

**Implications:**
- Must complete scraping within 5 minutes
- Sequential processing required (no parallelism)
- ~10-15 accounts maximum with current implementation

**Mitigation Strategies:**
- Optimize scraping (disable product extraction if needed)
- Split accounts across multiple workflows if needed
- Upgrade to paid tier if necessary ($20/month for longer timeout)

### Google Sheets API Limits

**Quotas:**
- Read requests: 100 per 100 seconds per user
- Write requests: 100 per 100 seconds per user
- Cells updated per request: 5,000,000

**Implications:**
- One read and one write per account is well within limits
- Batch operations preferred over individual calls

**Current Usage:**
- 1 read per account (check duplicates)
- 1 write per account (append row)
- Total: ~10-20 API calls per run

**Mitigation:**
- Batch operations where possible
- Cache reads when safe
- Add retry with exponential backoff

### Browser Automation Constraints

**Puppeteer Limitations:**
- Slower than API calls (page loads take seconds)
- Memory intensive (100-200MB per browser instance)
- Brittle to UI changes (selectors must be updated)

**Amazon-Specific Risks:**
- Captchas may appear on suspicious activity
- Rate limiting may trigger with aggressive scraping
- Session timeouts on slow connections
- UI changes break scraper

**Mitigation:**
- Human-like delays between actions
- Realistic user agent
- Sequential processing with delays
- Retry logic for transient failures
- Screenshots for debugging

### Network & Timing

**Dependencies:**
- Reliable internet connection
- Amazon Associates uptime
- Google Sheets API availability
- Pipedream infrastructure

**Timeouts (Configured):**
- Page load: 30 seconds
- Element wait: 15 seconds
- Navigation: 30 seconds
- Delay between accounts: 3 seconds

---

## Dependencies

### Production Dependencies

```json
{
  "puppeteer": "^21.5.0",
  "googleapis": "^128.0.0",
  "dotenv": "^16.3.1"
}
```

**Puppeteer (21.5.0):**
- Purpose: Headless browser automation
- Bundles Chromium (~170MB)
- Used for: Scraping Amazon Associates
- License: Apache 2.0

**googleapis (128.0.0):**
- Purpose: Google APIs client library
- Includes: Sheets API v4
- Used for: Reading/writing Google Sheets
- License: Apache 2.0

**dotenv (16.3.1):**
- Purpose: Load environment variables from .env
- Used for: Local development only
- License: BSD-2-Clause

### Development Dependencies

```json
{
  "jest": "^29.7.0",
  "eslint": "^8.54.0"
}
```

**jest (29.7.0):**
- Purpose: Testing framework
- Used for: Unit tests (not yet implemented)
- License: MIT

**eslint (8.54.0):**
- Purpose: Code linting
- Used for: Code quality (not yet configured)
- License: MIT

### Installation

**Local:**
```bash
npm install
```

**Pipedream:**
- Dependencies automatically installed from package.json
- Or specify inline in workflow steps

---

## Tool Usage Patterns

### Puppeteer Usage

**Browser Launch:**
```javascript
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu'
  ]
});
```

**Page Navigation:**
```javascript
await page.goto(url, {
  waitUntil: 'networkidle2',
  timeout: 30000
});
```

**Element Selection:**
```javascript
// Wait for element
await page.waitForSelector(selector, { timeout: 15000 });

// Get element
const element = await page.$(selector);

// Extract data
const data = await page.evaluate((sel) => {
  return document.querySelector(sel).textContent;
}, selector);
```

**Typing (Human-like):**
```javascript
await page.type(selector, text, { delay: 100 });
```

### Google Sheets API Usage

**Authentication:**
```javascript
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
```

**Read Data:**
```javascript
const response = await sheets.spreadsheets.values.get({
  spreadsheetId: sheetId,
  range: 'A:K',
});
const rows = response.data.values || [];
```

**Append Data:**
```javascript
await sheets.spreadsheets.values.append({
  spreadsheetId: sheetId,
  range: 'A:K',
  valueInputOption: 'USER_ENTERED',
  requestBody: {
    values: [rowData]
  }
});
```

### Environment Variable Access

**Node.js:**
```javascript
const email = process.env.AMAZON_EMAIL;
const password = process.env.AMAZON_PASSWORD;
```

**Pipedream:**
```javascript
// Same as Node.js
const email = process.env.AMAZON_EMAIL;
```

---

## Configuration Management

### Configuration Files

**src/scraper/config.js:**
- Centralized configuration
- Browser settings
- Timeouts and delays
- Amazon URLs
- **CSS Selectors (MUST UPDATE)**
- Feature flags

**config/accounts.json:**
- Account list
- Account names and IDs
- Sheet IDs per account
- Account-specific settings

**config/sheets-mapping.json:**
- Sheet ID to account mapping
- Column headers
- Tab names

**env / .env:**
- Credentials (never commit)
- API keys
- Environment-specific overrides

### Configuration Loading Priority

```
1. Environment Variables (highest priority)
2. config/accounts.json
3. src/scraper/config.js (defaults)
```

Example:
```javascript
const headless = process.env.HEADLESS !== 'false'; // Env var overrides
const timeout = config.PAGE_LOAD_TIMEOUT; // Default from config.js
```

---

## API Reference

### Amazon Associates URLs

**Login:**
```
https://affiliate-program.amazon.com/signin
```

**Dashboard/Home:**
```
https://affiliate-program.amazon.com/home
```

**Reports Overview:**
```
https://affiliate-program.amazon.com/home/reports
```

**Product Reports:**
```
https://affiliate-program.amazon.com/home/reports/products
```

**Earnings Reports:**
```
https://affiliate-program.amazon.com/home/reports/earnings
```

Note: URLs may change; verify current URLs in Amazon dashboard.

### Google Sheets API Endpoints

**Read Values:**
```
GET https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}
```

**Append Values:**
```
POST https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}:append
```

**Update Values:**
```
PUT https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}
```

---

## Debugging Tools

### Local Debugging

**Headless Mode Off:**
```bash
HEADLESS=false node src/scraper/amazon-associates-scraper.js
```
Launches visible browser for observation.

**Verbose Logging:**
```bash
VERBOSE_LOGGING=true node src/scraper/amazon-associates-scraper.js
```
Detailed console output.

**Screenshots:**
- Automatically taken on errors
- Saved to project root
- File names: `login-error.png`, `scrape-error-{accountId}.png`, etc.

**Chrome DevTools:**
```javascript
// Add to code for debugging
await page.evaluate(() => { debugger; });
```

### Pipedream Debugging

**Execution Logs:**
- View in Pipedream UI
- Each step shows console output
- Expand steps to see details

**Test Button:**
- Run workflow manually
- Doesn't wait for cron schedule
- Useful for immediate testing

**Export Workflow:**
- Download workflow JSON
- Version control
- Restore if needed

---

## Version Control

### Git Configuration

**Repository Structure:**
```
.git/
.gitignore
src/
docs/
config/
memory-bank/
README.md
package.json
```

**Ignored Files (.gitignore):**
```
node_modules/
.env
config/accounts.json
config/sheets-mapping.json
*.log
*.png
```

**Committed Files:**
- All source code
- Documentation
- Example configuration files
- package.json
- README

**Not Committed:**
- Credentials
- API keys
- Actual account configuration
- Screenshots
- Logs

---

## Security Considerations

### Credential Storage

**Local Development:**
- `.env` file (gitignored)
- Never committed to repository

**Production (Pipedream):**
- Environment variables in Pipedream UI
- Encrypted at rest
- Not visible in logs

### Authentication Flow

**Amazon:**
- Username/password authentication
- No 2FA support (limitation)
- Session cookies managed by Puppeteer

**Google:**
- OAuth 2.0 (Pipedream managed)
- Or service account JSON (for local)
- Scopes: `spreadsheets` only

### Data Security

**In Transit:**
- HTTPS for all connections
- Puppeteer uses secure protocols

**At Rest:**
- Google Sheets: Google's encryption
- Pipedream env vars: Pipedream's encryption
- Local .env: File system permissions

**Access Control:**
- Google Sheets: Private by default
- Pipedream workspace: User-controlled
- Amazon account: User's credentials

---

## Deployment Process

### Initial Deployment

1. **Prepare Configuration:**
   - Update selectors in `config.js`
   - Create `config/accounts.json`
   - Create `config/sheets-mapping.json`

2. **Set Up Google Sheets:**
   - Create sheets
   - Add headers
   - Note Sheet IDs

3. **Deploy to Pipedream:**
   - Create workflow
   - Add environment variables
   - Copy code from `workflow-template.js`
   - Connect Google Sheets
   - Test manually

4. **Enable Schedule:**
   - Activate cron trigger
   - Monitor first runs

### Updates & Maintenance

**Code Updates:**
1. Update local files
2. Test locally
3. Copy to Pipedream workflow
4. Test in Pipedream
5. Deploy (save workflow)

**Selector Updates:**
1. Inspect Amazon dashboard
2. Update `config.js`
3. Test locally
4. Deploy to Pipedream

**Configuration Changes:**
1. Update environment variables
2. Test manually
3. Verify in next scheduled run

---

## Performance Monitoring

### Metrics to Track

**Execution Metrics:**
- Total runtime (target: <300 seconds)
- Per-account time (target: <60 seconds)
- Success rate (target: >98%)

**Resource Metrics:**
- Memory usage
- API calls to Google Sheets
- Network bandwidth

**Data Metrics:**
- Rows inserted per day
- Duplicate rate (target: 0%)
- Missing fields (target: 0%)

### Monitoring Tools

**Pipedream:**
- Built-in execution history
- Step-by-step timing
- Error rates

**Google Sheets:**
- Manual inspection
- Data completeness checks
- Date continuity

**Custom Logging:**
- Console logs in workflow
- Summary statistics per run
- Error notifications via email

---

## Troubleshooting Tools

### Common Commands

**Check Node Version:**
```bash
node --version  # Should be 18+
```

**Install Dependencies:**
```bash
npm install
```

**Clear Node Modules:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Test Environment Variables:**
```bash
node -e "console.log(process.env.AMAZON_EMAIL)"
```

### Diagnostic Scripts

**Test Puppeteer:**
```javascript
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  console.log(await page.title());
  await browser.close();
})();
```

**Test Google Sheets:**
```javascript
const { google } = require('googleapis');
// ... auth setup ...
const sheets = google.sheets({ version: 'v4', auth });
const response = await sheets.spreadsheets.get({
  spreadsheetId: 'YOUR_SHEET_ID'
});
console.log(response.data.properties.title);
```

---

## External Resources

### Documentation

- **Puppeteer:** https://pptr.dev
- **Google Sheets API:** https://developers.google.com/sheets/api
- **Pipedream:** https://pipedream.com/docs
- **Node.js:** https://nodejs.org/docs

### Community

- **Puppeteer GitHub:** https://github.com/puppeteer/puppeteer
- **Pipedream Community:** https://pipedream.com/community
- **Stack Overflow:** Tag questions with `puppeteer`, `google-sheets-api`, `pipedream`

### Tools

- **Chrome DevTools:** For inspecting Amazon dashboard
- **Postman:** For testing Google Sheets API
- **VSCode:** Recommended editor with extensions:
  - ESLint
  - Prettier
  - JavaScript (ES6) code snippets

