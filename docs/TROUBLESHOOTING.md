# Troubleshooting Guide

Common issues and solutions for Amazon Associates Automated Reporting.

---

## Login Issues

### Problem: Login Fails

**Symptoms:**
- Error: "Login failed"
- Screenshot shows login page
- Workflow fails at authentication step

**Solutions:**

1. **Verify Credentials**
   ```bash
   # Check environment variables in Pipedream
   - AMAZON_EMAIL is correct
   - AMAZON_PASSWORD has no typos
   ```

2. **Test Manual Login**
   - Try logging in manually at https://affiliate-program.amazon.com
   - Ensure credentials work

3. **Check for 2FA**
   - This system doesn't support 2FA
   - Disable 2FA on Amazon account if enabled

4. **Session Issues**
   - Clear cookies/cache in manual test
   - Amazon may have detected unusual activity

5. **Captcha**
   - Amazon may show captcha on first login
   - Try logging in manually first to clear captcha
   - Then run automation

---

## Scraping Issues

### Problem: No Data Extracted

**Symptoms:**
- Workflow completes but returns empty data
- Console shows "0" for all metrics

**Solutions:**

1. **Check Selectors**
   - Amazon may have changed their UI
   - Open `src/scraper/config.js`
   - Update SELECTORS object with current Amazon selectors
   - Inspect Amazon dashboard with browser dev tools

2. **Wait Times**
   - Increase timeouts in config:
   ```javascript
   PAGE_LOAD_TIMEOUT: 60000,  // Try 60 seconds
   ELEMENT_TIMEOUT: 30000,    // Try 30 seconds
   ```

3. **Take Screenshots**
   - Enable screenshots in config:
   ```javascript
   TAKE_SCREENSHOTS: true
   ```
   - Check screenshots to see what page scraper sees

### Problem: Partial Data Extraction

**Symptoms:**
- Some metrics extracted, others are 0
- Inconsistent results

**Solutions:**

1. **Check Specific Selectors**
   - Review which fields are missing
   - Update those specific selectors in config

2. **Add Delays**
   - Dashboard may load progressively
   - Add wait between page navigation:
   ```javascript
   await page.waitForTimeout(5000);  // Wait 5 seconds
   ```

3. **Network Issues**
   - Slow network may timeout
   - Increase navigation timeout

---

## Google Sheets Issues

### Problem: Data Not Appearing in Sheets

**Symptoms:**
- Workflow succeeds but no data in sheets
- Error: "Permission denied"

**Solutions:**

1. **Verify Sheet IDs**
   ```bash
   # Check Sheet ID format
   Correct: 1ABC...XYZ (from URL)
   Wrong: Full URL or sheet name
   ```

2. **Check Permissions**
   - If using service account: Share sheet with service account email
   - If using Pipedream auth: Ensure proper OAuth scopes

3. **Verify Range**
   - Check range in code matches sheet structure
   - Default is 'A:K' (11 columns)
   - Adjust if you have different columns

4. **Test Manually**
   ```javascript
   // Test Google Sheets API separately
   // Use Pipedream's built-in Google Sheets test
   ```

### Problem: Duplicate Entries

**Symptoms:**
- Same date appears multiple times
- Data duplicated on each run

**Solutions:**

1. **Check Duplicate Detection**
   - Verify `isDuplicateRow` function is being called
   - Check key indexes are correct (default [0,1])

2. **Review Logic**
   - Open `src/utils/duplicate-detector.js`
   - Ensure comparison logic matches your data format

3. **Manual Cleanup**
   ```
   1. Sort sheet by Date + Account Name
   2. Remove duplicate rows
   3. Re-run workflow to verify fix
   ```

---

## Pipedream Workflow Issues

### Problem: Workflow Times Out

**Symptoms:**
- Error: "Execution timed out"
- Workflow stops mid-execution

**Solutions:**

1. **Reduce Accounts**
   - Process fewer accounts per run
   - Split into multiple workflows if needed

2. **Optimize Code**
   - Disable product extraction if not needed:
   ```javascript
   EXTRACT_PRODUCTS: false
   ```
   - Reduce MAX_PRODUCTS limit

3. **Upgrade Pipedream**
   - Free tier: 300 second timeout
   - Paid tier: Longer timeout available

### Problem: Workflow Doesn't Run

**Symptoms:**
- No execution at scheduled time
- Cron trigger inactive

**Solutions:**

1. **Check Trigger Status**
   - Trigger must be **Active** (green)
   - Verify cron expression is correct

2. **Verify Schedule**
   ```
   0 6 * * *  = 6am daily
   0 */4 * * * = Every 4 hours
   ```

3. **Check Timezone**
   - Ensure timezone is correct (America/New_York for EST)

4. **Manual Test**
   - Click "Test" to run manually
   - Verify workflow works when triggered manually

---

## Account Switching Issues

### Problem: Can't Switch Between Accounts

**Symptoms:**
- Error: "Failed to switch to account"
- Only first account processed

**Solutions:**

1. **Check Account Switcher UI**
   - Amazon's UI may have changed
   - Inspect selectors in `account-switcher.js`
   - Update `SELECTORS.accountSwitcher` in config

2. **Single Account Mode**
   - If no account switcher exists, you may have only one account
   - Remove other accounts from config

3. **Increase Wait Time**
   - Add delays after account switch:
   ```javascript
   DELAY_BETWEEN_ACCOUNTS: 5000  // Try 5 seconds
   ```

4. **Manual Navigation**
   - Try switching accounts manually to see UI
   - Update code to match manual steps

---

## Performance Issues

### Problem: Slow Execution

**Symptoms:**
- Workflow takes >10 minutes
- Frequently times out

**Solutions:**

1. **Disable Product Extraction**
   ```javascript
   EXTRACT_PRODUCTS: false
   ```

2. **Reduce Product Limit**
   ```javascript
   MAX_PRODUCTS: 50  // Instead of 100
   ```

3. **Remove Unnecessary Waits**
   - Review all `waitForTimeout` calls
   - Reduce where safe

4. **Process Fewer Accounts**
   - Split accounts across multiple workflows

---

## Error Messages

### "Element not found: .dashboard-container"

**Cause:** Amazon changed their dashboard HTML  
**Fix:** Update selector in `config.js`

### "Navigation timeout of 30000ms exceeded"

**Cause:** Slow page load or network issue  
**Fix:** Increase `NAVIGATION_TIMEOUT` in config

### "Duplicate detected, skipping insert"

**Cause:** Data for this date already exists  
**Fix:** This is normal. If incorrect, check duplicate detection logic

### "Invalid credentials"

**Cause:** Wrong email or password  
**Fix:** Update environment variables

---

## Debugging Tips

### Enable Verbose Logging

```javascript
VERBOSE_LOGGING: true
```

### Take Screenshots

```javascript
TAKE_SCREENSHOTS: true
```
Screenshots will be saved on errors for debugging

### Run Locally First

```bash
cd /Users/loganlorenz/AA\ Reporting
npm install
node src/scraper/amazon-associates-scraper.js
```

### Check Pipedream Logs

1. Open workflow
2. Click "Executions"
3. Click on specific execution
4. Review step-by-step logs

### Use Browser Dev Tools

1. Run Puppeteer non-headless:
   ```javascript
   HEADLESS: false
   ```
2. Open browser dev tools
3. Inspect elements to find correct selectors

---

## Getting Help

### Review Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Code details
- [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) - Setup steps

### Check Logs
- Pipedream execution logs
- Console output from scraper
- Error screenshots

### Common Patterns

Most issues fall into these categories:
1. **Selectors outdated** → Update config.js
2. **Timeouts** → Increase timeout values
3. **Credentials** → Verify environment variables
4. **Permissions** → Check Google Sheets access

---

**Still stuck?** Review the implementation guide for detailed code explanations.

---

**Last Updated:** November 3, 2025

