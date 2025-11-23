# Multi-Account Setup Guide

## Account Structure

You have **Store IDs** (accounts) that contain **Tracking IDs** (sub-accounts). We need to scrape data for each Tracking ID separately.

## Account Mapping

### Store ID: mula09a-20
- **Tracking ID**: mula09a-20
- **Sheet**: "Amazon Associates Reporting" (main sheet)
- **Sheet ID**: `1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM`

### Store ID: bm01f-20
- **Tracking ID**: mula07-20
- **Sheet**: "Amazon Associates - mula07-20" (needs to be created)

### Store ID: tag0d1d-20
- **Tracking IDs**:
  - twsmm-20
  - stylcasterm-20
  - defpenm-20
  - swimworldm-20
  - britcom03-20
  - on3m-20
- **Sheets**: One sheet per Tracking ID (need to be created)

### Store ID: usmagazine05-20
- **Tracking ID**: mula0f-20
- **Sheet**: "Amazon Associates - mula0f-20" (needs to be created)

## Setup Steps

### Step 1: Create Google Sheets for Each Tracking ID

For each Tracking ID (except mula09a-20 which already exists):

1. Create a new Google Sheet
2. Name it: `Amazon Associates - [TRACKING_ID]`
3. Add headers in Row 1:
   ```
   Date | Account Name | Tracking ID | Revenue | Earnings | Clicks | Orders | Conversion Rate | Items Ordered | Items Shipped | Revenue Per Click | Scraped Date | Last Updated
   ```
4. Copy the Sheet ID from the URL
5. Add it to the configuration (see Step 2)

### Step 2: Update Configuration

Add Sheet IDs to `account-config.js` or as environment variables:

**Environment Variables** (in Pipedream):
```
GOOGLE_SHEET_ID_MULA07_20 = your-sheet-id-here
GOOGLE_SHEET_ID_TWSMM_20 = your-sheet-id-here
GOOGLE_SHEET_ID_STYLCASTERM_20 = your-sheet-id-here
GOOGLE_SHEET_ID_DEFPENM_20 = your-sheet-id-here
GOOGLE_SHEET_ID_SWIMWORLDM_20 = your-sheet-id-here
GOOGLE_SHEET_ID_BRITCOM03_20 = your-sheet-id-here
GOOGLE_SHEET_ID_ON3M_20 = your-sheet-id-here
GOOGLE_SHEET_ID_MULA0F_20 = your-sheet-id-here
```

### Step 3: Update Scraper

The scraper needs to:
1. Switch to Store ID (account switcher)
2. Switch to Tracking ID (within that Store ID)
3. Scrape data for that Tracking ID
4. Save to the appropriate sheet

This will require updating the scraper to handle Tracking ID selection.

## Total Sheets Needed

- ✅ Amazon Associates Reporting (mula09a-20) - **EXISTS**
- ⬜ Amazon Associates - mula07-20
- ⬜ Amazon Associates - twsmm-20
- ⬜ Amazon Associates - stylcasterm-20
- ⬜ Amazon Associates - defpenm-20
- ⬜ Amazon Associates - swimworldm-20
- ⬜ Amazon Associates - britcom03-20
- ⬜ Amazon Associates - on3m-20
- ⬜ Amazon Associates - mula0f-20

**Total: 9 sheets** (1 exists, 8 need to be created)

