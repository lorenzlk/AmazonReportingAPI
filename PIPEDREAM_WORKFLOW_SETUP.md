# Pipedream Workflow Setup - Multi-Account Scraper

## Overview

This workflow will scrape **all 9 Tracking IDs** across **4 Store IDs** and save each to its respective tab in Google Sheets.

## Workflow Structure

```
Step 1: Multi-Account Scraper
  ↓ Returns: { results: [...9 results...], count: 9 }
  
Step 2: Loop Through Results (Pipedream built-in)
  ↓ Iterates: steps.step_1.results
  
Step 3: Google Sheets Step (inside loop)
  ↓ Processes: steps.step_2.item
  ↓ Saves to appropriate tab
```

## Step-by-Step Setup

### Step 1: Create New Workflow

1. Go to Pipedream dashboard
2. Click **"New Workflow"**
3. Name it: **"Amazon Associates Multi-Account Scraper"**

### Step 2: Add Multi-Account Scraper

1. Click **"Add Step"**
2. Search for **"Code"** or **"Node.js"**
3. Select **"Run Node.js code"**
4. **Name**: `Multi-Account Scraper`
5. **Paste the code** from `pipedream-all-accounts-scraper.js`
6. **Connect Browserless app**:
   - Click **"Connect account"** next to `browserless` prop
   - Select your Browserless account
7. **Add environment variables** (if not already set):
   - `AMAZON_EMAIL` = your Amazon email
   - `AMAZON_PASSWORD` = your Amazon password
8. **Test the step** - it should return:
   ```json
   {
     "results": [
       { "date": "...", "storeId": "...", "trackingId": "...", ... },
       ...
     ],
     "count": 9,
     "timestamp": "..."
   }
   ```

### Step 3: Add Loop Step

1. Click **"Add Step"** after Step 1
2. Search for **"Loop"** or **"For Each"**
3. Select **"Loop Over Items"** (or similar)
4. **Name**: `Loop Through Results`
5. **Items to loop over**: `{{ steps.multi_account_scraper.results }}`
   - Or use the step reference: `{{ steps.step_1.results }}`
6. **Item variable name**: `result` (or `item`)

### Step 4: Add Google Sheets Step (Inside Loop)

1. Click **"Add Step"** inside the loop
2. Search for **"Code"** or **"Node.js"**
3. Select **"Run Node.js code"**
4. **Name**: `Save to Google Sheets`
5. **Paste the code** from `pipedream-google-sheets-step.js`
6. **Connect Google Sheets app**:
   - Click **"Connect account"** next to `google_sheets` prop
   - Authorize with your Google account
7. **Input data**: `{{ steps.loop_through_results.item }}`
   - Or: `{{ steps.step_2.item }}`
   - This passes each result from the loop to the Google Sheets step

### Step 5: Test the Workflow

1. Click **"Test"** button
2. Watch the logs:
   - Step 1 should scrape all 9 Tracking IDs
   - Step 2 should loop 9 times
   - Step 3 should save each to its tab
3. Check your Google Sheet - each tab should have new data

## Expected Output

### Step 1 Output
```json
{
  "results": [
    {
      "date": "2025-01-15",
      "storeId": "mula09a-20",
      "trackingId": "mula09a-20",
      "accountName": "mula09a-20",
      "revenue": 1234.56,
      "earnings": 123.45,
      "clicks": 1000,
      "orders": 50,
      ...
    },
    ...8 more results...
  ],
  "count": 9,
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

### Step 2 (Loop)
- Runs 9 times
- Each iteration processes one result

### Step 3 (Google Sheets)
- Saves each result to its tab:
  - `mula09a-20` → tab "mula09a-20"
  - `mula07-20` → tab "mula07-20"
  - `twsmm-20` → tab "twsmm-20"
  - etc.

## Accounts Being Scraped

| Store ID | Tracking IDs | Tab Name |
|----------|--------------|----------|
| mula09a-20 | mula09a-20 | mula09a-20 |
| bm01f-20 | mula07-20 | mula07-20 |
| tag0d1d-20 | twsmm-20 | twsmm-20 |
| tag0d1d-20 | stylcasterm-20 | stylcasterm-20 |
| tag0d1d-20 | defpenm-20 | defpenm-20 |
| tag0d1d-20 | swimworldm-20 | swimworldm-20 |
| tag0d1d-20 | britcom03-20 | britcom03-20 |
| tag0d1d-20 | on3m-20 | on3m-20 |
| usmagazine05-20 | mula0f-20 | mula0f-20 |

**Total: 9 Tracking IDs**

## Troubleshooting

### Issue: Step 1 returns empty results
- **Check**: Amazon login credentials
- **Check**: Browserless connection
- **Check**: Logs for errors during scraping

### Issue: Loop doesn't iterate
- **Check**: Step 1 output structure - should have `results` array
- **Check**: Loop items path - should be `{{ steps.step_1.results }}`

### Issue: Google Sheets step fails
- **Check**: Google Sheets app is connected
- **Check**: Sheet ID is correct
- **Check**: Tab names match Tracking IDs exactly
- **Check**: Headers are in Row 1

### Issue: Tracking ID switching fails
- **Check**: Logs for `⚠️ Could not find Tracking ID option`
- **Check**: Dropdown selector might need adjustment
- **Workaround**: For now, single-Tracking-ID accounts will still work

## Scheduling

Once tested, you can schedule this workflow:

1. Click **"Schedule"** tab
2. Set to run **daily** (e.g., 6:00 AM)
3. The workflow will:
   - Scrape all 9 Tracking IDs
   - Update existing rows (if same date) or add new rows
   - Handle retroactive changes from Amazon

## Next Steps

1. ✅ Set up the workflow (Steps 1-4 above)
2. ✅ Test with a single run
3. ✅ Verify data in Google Sheets
4. ✅ Schedule for daily runs
5. ✅ Monitor logs for any issues

## Files Needed

- `pipedream-all-accounts-scraper.js` - Step 1 code
- `pipedream-google-sheets-step.js` - Step 3 code

Both files are ready to use!

