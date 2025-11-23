# Store ID Workflow Setup Guide

## Overview

Each Store ID now has its own workflow. This makes the system:
- **Scalable**: Add new Tracking IDs to `account-config.js` and they're automatically included
- **Reliable**: If one Store ID fails, others still run
- **Fast**: Each workflow processes 1-6 Tracking IDs (2-3 minutes max)
- **Maintainable**: Easy to debug and monitor individual Store IDs

## Current Store IDs

1. **mula09a-20** → 1 Tracking ID
2. **bm01f-20** → 1 Tracking ID
3. **tag0d1d-20** → 6 Tracking IDs
4. **usmagazine05-20** → 1 Tracking ID

## Setup Instructions

### Step 1: Create Workflows (One Per Store ID)

Create 4 separate workflows in Pipedream:

1. **Workflow: "Amazon Associates - mula09a-20"**
2. **Workflow: "Amazon Associates - bm01f-20"**
3. **Workflow: "Amazon Associates - tag0d1d-20"**
4. **Workflow: "Amazon Associates - usmagazine05-20"**

### Step 2: Add Scraper Step to Each Workflow

For each workflow:

1. **Add a Node.js code step**
2. **Copy the code from `pipedream-single-store-scraper.js`**
3. **Set the Store ID prop:**
   - Click on the step
   - Find "Props" or "Step Settings"
   - Set `storeId` to the Store ID for this workflow:
     - `mula09a-20` for workflow 1
     - `bm01f-20` for workflow 2
     - `tag0d1d-20` for workflow 3
     - `usmagazine05-20` for workflow 4

4. **Connect Browserless app** (same for all workflows)
5. **Set timeout to 3 minutes (180 seconds)** - plenty of time for 1-6 Tracking IDs

### Step 3: Add Google Sheets Step

For each workflow:

1. **Add a Node.js code step** (second step)
2. **Copy the code from `pipedream-google-sheets-all-results.js`**
3. **Reference the scraper step:**
   - In the code, update `steps.scraper_step_name` to match your scraper step name
   - Or use `steps.trigger` if it's the first step

### Step 4: Set Up Scheduling

For each workflow:

1. **Add a Cron trigger** (first step)
2. **Set schedule:** `0 6 * * *` (6am EST daily)
3. **Or stagger them:**
   - mula09a-20: `0 6 * * *` (6:00 AM)
   - bm01f-20: `0 6 * * *` (6:00 AM - can run in parallel)
   - tag0d1d-20: `0 6 * * *` (6:00 AM - can run in parallel)
   - usmagazine05-20: `0 6 * * *` (6:00 AM - can run in parallel)

All can run at the same time since they're independent!

## Adding New Tracking IDs

When you need to add new Tracking IDs:

1. **Edit `account-config.js`** (or update it in each workflow's scraper step)
2. **Add the Tracking ID to the appropriate Store ID:**
   ```javascript
   {
     storeId: 'tag0d1d-20',
     trackingIds: ['twsmm-20', 'stylcasterm-20', 'defpenm-20', 'swimworldm-20', 'britcom03-20', 'on3m-20', 'NEW-TRACKING-ID-20']
   }
   ```
3. **No workflow changes needed!** The scraper automatically picks up new Tracking IDs

## Workflow Structure

```
Workflow: "Amazon Associates - mula09a-20"
├── Step 1: Cron Trigger (6am daily)
├── Step 2: Single Store Scraper (storeId: "mula09a-20")
└── Step 3: Google Sheets Writer
```

## Timeout Settings

- **Scraper Step**: 3 minutes (180 seconds)
  - 1 Tracking ID: ~30-60 seconds
  - 6 Tracking IDs: ~2-3 minutes
  - Plenty of buffer

- **Google Sheets Step**: 1 minute (60 seconds)
  - Usually completes in 10-20 seconds

## Benefits

✅ **Scalable**: Add Tracking IDs without code changes  
✅ **Reliable**: One failure doesn't affect others  
✅ **Fast**: Parallel execution (all workflows run simultaneously)  
✅ **Maintainable**: Easy to debug individual Store IDs  
✅ **Flexible**: Can schedule different Store IDs at different times if needed

## Monitoring

Check each workflow's logs independently:
- See which Store ID failed (if any)
- Monitor performance per Store ID
- Debug issues without affecting other workflows

## Next Steps

1. Create the 4 workflows
2. Copy the scraper code to each
3. Set the Store ID prop for each
4. Add Google Sheets step to each
5. Set up scheduling
6. Test each workflow individually
7. Monitor and adjust as needed

