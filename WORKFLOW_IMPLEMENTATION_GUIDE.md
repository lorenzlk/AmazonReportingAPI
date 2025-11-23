# Workflow Implementation Guide

## Overview

This guide walks you through creating 4 separate Pipedream workflows, one for each Store ID. Each workflow is independent, scalable, and reliable.

## Prerequisites

- ✅ Pipedream account (paid recommended for longer timeouts)
- ✅ Browserless account connected
- ✅ Google Sheets account connected
- ✅ Google Sheet created: `1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM`
- ✅ Environment variables set: `AMAZON_EMAIL`, `AMAZON_PASSWORD`, `GOOGLE_SHEET_ID`

## Store IDs to Create

1. **mula09a-20** → 1 Tracking ID
2. **bm01f-20** → 1 Tracking ID
3. **tag0d1d-20** → 6 Tracking IDs
4. **usmagazine05-20** → 1 Tracking ID

## Step-by-Step Implementation

### Step 1: Create First Workflow (mula09a-20)

1. **Create New Workflow**
   - Go to Pipedream dashboard
   - Click "New Workflow"
   - Name it: `Amazon Associates - mula09a-20`

2. **Add Cron Trigger**
   - Click "+" to add step
   - Search for "Cron"
   - Select "Schedule" trigger
   - Set schedule: `0 6 * * *` (6am EST daily)
   - Click "Save"

3. **Add Scraper Step**
   - Click "+" after trigger
   - Select "Code" → "Node.js"
   - Name it: `Scraper - mula09a-20`
   - Copy entire contents of `pipedream-single-store-scraper.js`
   - Paste into the code editor
   - **Set Props:**
     - Click "Props" tab
     - Find `storeId` prop
     - Set value: `mula09a-20`
     - Find `reportDate` prop (should default to "yesterday")
     - **Connect Browserless:**
       - Find `browserless` prop
       - Click "Connect" or select existing Browserless connection
   - **Set Timeout:**
     - Click gear icon ⚙️ on step
     - Find "Timeout" setting
     - Set to: `180` seconds (3 minutes)
   - Click "Save"

4. **Add Google Sheets Step**
   - Click "+" after scraper step
   - Select "Code" → "Node.js"
   - Name it: `Save to Google Sheets`
   - Copy entire contents of `pipedream-google-sheets-single-store.js`
   - Paste into the code editor
   - **Update Step Reference:**
     - Find line with `steps.scraper` or `steps.trigger`
     - Change to match your scraper step name (e.g., `steps["Scraper - mula09a-20"]`)
   - **Connect Google Sheets:**
     - Click "Props" tab
     - Find `google_sheets` prop
     - Click "Connect" or select existing Google Sheets connection
   - **Set Timeout:**
     - Click gear icon ⚙️
     - Set timeout to: `60` seconds (1 minute)
   - Click "Save"

5. **Set Environment Variables**
   - Click workflow settings (gear icon at top)
   - Go to "Environment Variables"
   - Add:
     - `AMAZON_EMAIL` = your Amazon email
     - `AMAZON_PASSWORD` = your Amazon password
     - `GOOGLE_SHEET_ID` = `1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM`

6. **Test First Workflow**
   - Click "Test" button
   - Watch logs for errors
   - Check Google Sheet for data in `mula09a-20` tab
   - Verify date is yesterday

### Step 2: Create Remaining 3 Workflows

Repeat Step 1 for each Store ID:

**For bm01f-20:**
- Workflow name: `Amazon Associates - bm01f-20`
- Store ID prop: `bm01f-20`
- Same timeout and settings

**For tag0d1d-20:**
- Workflow name: `Amazon Associates - tag0d1d-20`
- Store ID prop: `tag0d1d-20`
- Same timeout and settings
- This one processes 6 Tracking IDs (will take ~2-3 minutes)

**For usmagazine05-20:**
- Workflow name: `Amazon Associates - usmagazine05-20`
- Store ID prop: `usmagazine05-20`
- Same timeout and settings

### Step 3: Verify All Workflows

1. **Test Each Workflow**
   - Run manual test for each
   - Check logs for errors
   - Verify data in Google Sheets

2. **Check Google Sheet Tabs**
   - Open: `https://docs.google.com/spreadsheets/d/1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM`
   - Verify tabs exist:
     - `mula09a-20`
     - `mula07-20`
     - `twsmm-20`
     - `stylcasterm-20`
     - `defpenm-20`
     - `swimworldm-20`
     - `britcom03-20`
     - `on3m-20`
     - `mula0f-20`

3. **Verify Data**
   - Check that each tab has:
     - Headers in row 1
     - Data row with yesterday's date
     - Correct metrics (revenue, earnings, clicks, etc.)

### Step 4: Enable Scheduling

1. **Enable Cron Triggers**
   - For each workflow, ensure Cron trigger is enabled
   - All can run at same time (6am EST)
   - Or stagger them if preferred

2. **Monitor First Runs**
   - Watch logs for each workflow
   - Check for errors
   - Verify data appears correctly

## Troubleshooting

### Workflow Times Out
- Increase timeout to 5 minutes (300 seconds)
- Check logs to see which step is slow
- Consider reducing delays in scraper code

### No Data in Sheets
- Check scraper logs for errors
- Verify Store ID prop is set correctly
- Check Google Sheets connection
- Verify environment variables are set

### Date is Wrong
- Check `reportDate` prop (should be "yesterday")
- Verify date picker is working (may need selector updates)
- Check logs for date-related warnings

### Connection Errors
- Check Browserless connection
- Verify Browserless token is valid
- Check for rate limiting
- Increase delays between operations

## Adding New Tracking IDs

When you need to add new Tracking IDs:

1. **Edit Scraper Code in Each Workflow**
   - Find the `ACCOUNTS` array in the scraper step
   - Add new Tracking ID to the appropriate Store ID:
   ```javascript
   {
     storeId: 'tag0d1d-20',
     trackingIds: ['twsmm-20', 'stylcasterm-20', 'NEW-ID-20']
   }
   ```
2. **No Other Changes Needed**
   - Workflow automatically processes new Tracking IDs
   - Google Sheets automatically creates new tab
   - No workflow configuration changes required

## Workflow Summary

| Workflow | Store ID | Tracking IDs | Timeout | Schedule |
|----------|----------|--------------|---------|----------|
| Amazon Associates - mula09a-20 | mula09a-20 | 1 | 3 min | 6am EST |
| Amazon Associates - bm01f-20 | bm01f-20 | 1 | 3 min | 6am EST |
| Amazon Associates - tag0d1d-20 | tag0d1d-20 | 6 | 3 min | 6am EST |
| Amazon Associates - usmagazine05-20 | usmagazine05-20 | 1 | 3 min | 6am EST |

## Next Steps After Implementation

1. ✅ All workflows created and tested
2. ✅ Scheduling enabled
3. ✅ Monitor first few daily runs
4. ✅ Adjust timeouts if needed
5. ✅ Add email notifications on failures (optional)

## Support

If you encounter issues:
1. Check workflow logs
2. Review `STORE_ID_WORKFLOW_SETUP.md`
3. Check `TROUBLESHOOTING.md` in docs folder
4. Verify all connections and environment variables

