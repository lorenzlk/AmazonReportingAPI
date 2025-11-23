# How to Run for All Tracking IDs

## ✅ Tracking ID Switching is Now Implemented!

Based on the screenshot you provided, I've added code to switch Tracking IDs using the dropdown on the reports page.

## Two Ways to Run

### Option 1: Multi-Account Scraper (All at Once) - RECOMMENDED

**File**: `pipedream-all-accounts-scraper.js`

This will:
1. Login once
2. Loop through all 4 Store IDs
3. For each Store ID, loop through all Tracking IDs
4. Switch to each Tracking ID and scrape data
5. Return all 9 results in one array

**Pipedream Workflow Setup:**

```
Step 1: Multi-Account Scraper
  - Code: pipedream-all-accounts-scraper.js
  - Returns: { results: [...], count: 9 }

Step 2: Loop Through Results (Pipedream built-in)
  - Iterate over: steps.step_1.results

Step 3: Google Sheets Step (inside loop)
  - Code: pipedream-google-sheets-step.js
  - Input: {{ steps.step_2.item }}
  - Saves each result to its tab
```

### Option 2: Single Account (Current Setup)

**File**: `pipedream-puppeteer-native.js`

This scrapes one Store ID + Tracking ID at a time. Change these lines to switch accounts:

```javascript
const targetStoreId = 'mula09a-20';
const targetTrackingId = 'mula09a-20';
```

## Accounts That Will Be Scraped

### Store ID: mula09a-20
- ✅ Tracking ID: mula09a-20

### Store ID: bm01f-20
- ✅ Tracking ID: mula07-20

### Store ID: tag0d1d-20
- ✅ Tracking ID: twsmm-20
- ✅ Tracking ID: stylcasterm-20
- ✅ Tracking ID: defpenm-20
- ✅ Tracking ID: swimworldm-20
- ✅ Tracking ID: britcom03-20
- ✅ Tracking ID: on3m-20

### Store ID: usmagazine05-20
- ✅ Tracking ID: mula0f-20

**Total: 9 Tracking IDs**

## How Tracking ID Switching Works

1. **After switching Store ID**, the scraper navigates to the reports page
2. **Finds the Tracking ID dropdown** using selector: `#ac-dropdown-displayreport-trackingIds`
3. **Clicks the dropdown** to open the menu
4. **Searches for the Tracking ID** in the dropdown options
5. **Clicks the matching option**
6. **Waits for the page to filter** (2.5 seconds)
7. **Scrapes the filtered data**

## Testing

1. **Test with single account first**: Use `pipedream-puppeteer-native.js` with a Store ID that has multiple Tracking IDs (e.g., `tag0d1d-20`)
2. **Verify Tracking ID switching works**: Check logs to see if it successfully switches
3. **Then run multi-account**: Use `pipedream-all-accounts-scraper.js` to process all accounts

## Troubleshooting

If Tracking ID switching fails:
- Check logs for: `⚠️ Could not find Tracking ID option`
- The dropdown structure might be different - we may need to adjust selectors
- Take a screenshot of the dropdown when it's open and share it

## Next Steps

1. ✅ Tracking ID switching code added
2. ⬜ Test with `tag0d1d-20` (has 6 Tracking IDs)
3. ⬜ Set up Pipedream workflow with loop step
4. ⬜ Run full multi-account scrape

