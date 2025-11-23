# Quick Implementation Checklist

Use this checklist to implement the 4 Store ID workflows.

## Pre-Implementation

- [ ] Pipedream account ready (paid recommended)
- [ ] Browserless account connected
- [ ] Google Sheets account connected
- [ ] Google Sheet exists: `1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM`
- [ ] Environment variables ready: `AMAZON_EMAIL`, `AMAZON_PASSWORD`, `GOOGLE_SHEET_ID`

## Workflow 1: mula09a-20

- [ ] Create workflow: "Amazon Associates - mula09a-20"
- [ ] Add Cron trigger: `0 6 * * *`
- [ ] Add scraper step (copy `pipedream-single-store-scraper.js`)
- [ ] Set `storeId` prop: `mula09a-20`
- [ ] Connect Browserless app
- [ ] Set timeout: 180 seconds
- [ ] Add Google Sheets step (copy `pipedream-google-sheets-single-store.js`)
- [ ] Update step reference to match scraper step name
- [ ] Connect Google Sheets app
- [ ] Set environment variables
- [ ] Test workflow
- [ ] Verify data in Google Sheet tab `mula09a-20`

## Workflow 2: bm01f-20

- [ ] Create workflow: "Amazon Associates - bm01f-20"
- [ ] Add Cron trigger: `0 6 * * *`
- [ ] Add scraper step (copy `pipedream-single-store-scraper.js`)
- [ ] Set `storeId` prop: `bm01f-20`
- [ ] Connect Browserless app
- [ ] Set timeout: 180 seconds
- [ ] Add Google Sheets step (copy `pipedream-google-sheets-single-store.js`)
- [ ] Update step reference to match scraper step name
- [ ] Connect Google Sheets app
- [ ] Set environment variables
- [ ] Test workflow
- [ ] Verify data in Google Sheet tab `mula07-20`

## Workflow 3: tag0d1d-20

- [ ] Create workflow: "Amazon Associates - tag0d1d-20"
- [ ] Add Cron trigger: `0 6 * * *`
- [ ] Add scraper step (copy `pipedream-single-store-scraper.js`)
- [ ] Set `storeId` prop: `tag0d1d-20`
- [ ] Connect Browserless app
- [ ] Set timeout: 180 seconds (or 300 if needed for 6 Tracking IDs)
- [ ] Add Google Sheets step (copy `pipedream-google-sheets-single-store.js`)
- [ ] Update step reference to match scraper step name
- [ ] Connect Google Sheets app
- [ ] Set environment variables
- [ ] Test workflow
- [ ] Verify data in Google Sheet tabs:
  - [ ] `twsmm-20`
  - [ ] `stylcasterm-20`
  - [ ] `defpenm-20`
  - [ ] `swimworldm-20`
  - [ ] `britcom03-20`
  - [ ] `on3m-20`

## Workflow 4: usmagazine05-20

- [ ] Create workflow: "Amazon Associates - usmagazine05-20"
- [ ] Add Cron trigger: `0 6 * * *`
- [ ] Add scraper step (copy `pipedream-single-store-scraper.js`)
- [ ] Set `storeId` prop: `usmagazine05-20`
- [ ] Connect Browserless app
- [ ] Set timeout: 180 seconds
- [ ] Add Google Sheets step (copy `pipedream-google-sheets-single-store.js`)
- [ ] Update step reference to match scraper step name
- [ ] Connect Google Sheets app
- [ ] Set environment variables
- [ ] Test workflow
- [ ] Verify data in Google Sheet tab `mula0f-20`

## Post-Implementation

- [ ] All 4 workflows tested successfully
- [ ] All 9 Tracking IDs have data in Google Sheets
- [ ] All dates are "yesterday" (correct)
- [ ] Enable scheduling for all workflows
- [ ] Monitor first few daily runs
- [ ] Set up error notifications (optional)

## Verification

- [ ] Open Google Sheet: `1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM`
- [ ] Verify 9 tabs exist (one per Tracking ID)
- [ ] Each tab has headers in row 1
- [ ] Each tab has data row with yesterday's date
- [ ] All metrics populated (not all zeros)

## Done! 🎉

All workflows are now set up and running. The system will automatically:
- Scrape yesterday's data daily at 6am EST
- Save to Google Sheets
- Handle retroactive data changes (updates existing rows)
- Scale as you add new Tracking IDs

