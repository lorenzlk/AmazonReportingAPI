# Complete Multi-Account Setup Guide

## Overview

You need to track **9 Tracking IDs** across **4 Store IDs**. Each Tracking ID gets its own Google Sheet.

## Account Structure

### Store ID: mula09a-20
- **Tracking ID**: mula09a-20
- **Sheet**: "Amazon Associates Reporting" ✅ (EXISTS)
- **Sheet ID**: `1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM`

### Store ID: bm01f-20
- **Tracking ID**: mula07-20
- **Sheet**: "Amazon Associates - mula07-20" (CREATE)

### Store ID: tag0d1d-20 (6 Tracking IDs)
- **Tracking IDs**:
  1. twsmm-20 → Sheet: "Amazon Associates - twsmm-20"
  2. stylcasterm-20 → Sheet: "Amazon Associates - stylcasterm-20"
  3. defpenm-20 → Sheet: "Amazon Associates - defpenm-20"
  4. swimworldm-20 → Sheet: "Amazon Associates - swimworldm-20"
  5. britcom03-20 → Sheet: "Amazon Associates - britcom03-20"
  6. on3m-20 → Sheet: "Amazon Associates - on3m-20"

### Store ID: usmagazine05-20
- **Tracking ID**: mula0f-20
- **Sheet**: "Amazon Associates - mula0f-20" (CREATE)

## Step 1: Create Google Sheets (8 sheets needed)

For each Tracking ID (except mula09a-20 which exists):

1. **Create new Google Sheet**
2. **Name it**: `Amazon Associates - [TRACKING_ID]`
   - Example: "Amazon Associates - mula07-20"
3. **Add headers in Row 1**:
   ```
   Date | Store ID | Tracking ID | Revenue | Earnings | Clicks | Orders | Conversion Rate | Items Ordered | Items Shipped | Revenue Per Click | Scraped Date | Last Updated
   ```
4. **Copy Sheet ID** from URL
5. **Save the Sheet ID** for Step 2

## Step 2: Add Sheet IDs to Pipedream

In your Pipedream workflow → **Settings** → **Environment Variables**, add:

```
GOOGLE_SHEET_ID_MULA07_20 = paste-sheet-id-here
GOOGLE_SHEET_ID_TWSMM_20 = paste-sheet-id-here
GOOGLE_SHEET_ID_STYLCASTERM_20 = paste-sheet-id-here
GOOGLE_SHEET_ID_DEFPENM_20 = paste-sheet-id-here
GOOGLE_SHEET_ID_SWIMWORLDM_20 = paste-sheet-id-here
GOOGLE_SHEET_ID_BRITCOM03_20 = paste-sheet-id-here
GOOGLE_SHEET_ID_ON3M_20 = paste-sheet-id-here
GOOGLE_SHEET_ID_MULA0F_20 = paste-sheet-id-here
```

## Step 3: Update Main Sheet Headers

Update your existing "Amazon Associates Reporting" sheet to have these headers:

```
Date | Store ID | Tracking ID | Revenue | Earnings | Clicks | Orders | Conversion Rate | Items Ordered | Items Shipped | Revenue Per Click | Scraped Date | Last Updated
```

## Step 4: Find Tracking ID Selector

**CRITICAL**: We need to find how to switch Tracking IDs on the reports page.

1. Log into Amazon Associates
2. Go to: https://affiliate-program.amazon.com/p/reporting/earnings
3. Switch to Store ID `tag0d1d-20` (has 6 Tracking IDs)
4. Look for a **Tracking ID filter/dropdown** on the page
5. **Inspect it** (F12 → Elements tab)
6. **Find the selector** (might be a dropdown, filter, or button)
7. **Share the selector** so we can add it to the scraper

## Step 5: Update Workflow

Once we have the Tracking ID selector, we'll:
1. Update the scraper to loop through all Store IDs
2. For each Store ID, loop through all Tracking IDs
3. Switch to each Tracking ID and scrape data
4. Save each to its respective sheet

## Current Status

- ✅ Single account scraper working (mula09a-20)
- ✅ Google Sheets integration working
- ✅ Sheet structure updated (Store ID + Tracking ID columns)
- ⚠️ **NEED**: Tracking ID selector to enable multi-account scraping

## Next Steps

1. **Create the 8 missing sheets** (see Step 1)
2. **Add Sheet IDs to Pipedream** (see Step 2)
3. **Find Tracking ID selector** (see Step 4) - **THIS IS CRITICAL**
4. Once we have the selector, we'll update the scraper to handle all accounts

