# Account Data Google Sheets Setup

## mula09a-20 (Internal Mula Tracking)
**Account**: `mula09a-20` (internal Mula tracking)  
**Sheet URL**: https://docs.google.com/spreadsheets/d/1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM/edit  
**Sheet ID**: `1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM`

> **Note**: Other customer IDs will have their own separate sheets (to be added later)

## Quick Setup (2 steps)

### Step 1: Add Sheet ID to Pipedream (Optional)

The step will automatically use the default sheet for `mula09a-20`, but you can set it explicitly:

1. In your Pipedream workflow → **Settings** (gear icon)
2. **Environment Variables** → **Add**:
   - **Name**: `GOOGLE_SHEET_ID_MULA09A_20`
   - **Value**: `1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM`
3. **Save**

> **Note**: For `mula09a-20`, the step will use the default sheet even without this env var. For other customer IDs, you'll need to add `GOOGLE_SHEET_ID_CUSTOMER_ID` for each one.

### Step 2: Add Google Sheets Step to Workflow

1. In your Pipedream workflow, click **+** after your scraper step
2. Choose **"Run Node.js Code"**
3. Copy the code from `pipedream-google-sheets-step.js`
4. Paste it into the editor
5. Click **"Connect Account"** next to the `google_sheets` prop
6. Authorize with your Google account
7. **Save**

## Verify Your Sheet Headers

Make sure your sheet has these headers in **Row 1**:

| Date | Account Name | Revenue | Earnings | Clicks | Orders | Conversion Rate | Items Ordered | Items Shipped | Revenue Per Click | Last Updated |
|------|--------------|---------|----------|--------|--------|-----------------|---------------|---------------|-------------------|--------------|

If your headers are different, the step will still work, but the data might be in the wrong columns.

## Test It

1. Click **"Test"** in Pipedream
2. Check the logs - you should see:
   - `📊 Adding data to Google Sheets...`
   - `✅ Successfully added Amazon Associates data to Google Sheet!`
3. **Open your Google Sheet** - a new row should appear with today's data

## What Gets Added

Each run will add a row like this for `mula09a-20`:

| Date | Account Name | Revenue | Earnings | Clicks | Orders | Conversion Rate | Items Ordered | Items Shipped | Revenue Per Click | Last Updated |
|------|--------------|---------|----------|--------|--------|-----------------|---------------|---------------|-------------------|--------------|
| 2025-11-22 | mula09a-20 | 560058.76 | 42884.82 | 421124 | 30445 | 7.23 | 30445 | 30342 | 1.33 | 2025-11-22T23:08:12.626Z |

## Duplicate Protection

The step automatically checks for duplicates based on:
- **Date** + **Account Name**

If a row with the same date and account already exists, it will skip the insert (useful for re-runs).

## Adding More Customer IDs

When you're ready to add other customer accounts:

1. **Create a new Google Sheet** for each customer ID
2. **Add the same headers** (Date, Account Name, Revenue, etc.)
3. **Get the Sheet ID** from the URL
4. **Add environment variable** in Pipedream:
   - Name: `GOOGLE_SHEET_ID_[CUSTOMER_ID]` (uppercase, dashes become underscores)
   - Example: For customer `abc-123`, use `GOOGLE_SHEET_ID_ABC_123`
5. **Update your scraper** to use that customer ID

The same step will automatically route data to the correct sheet based on the account name!

