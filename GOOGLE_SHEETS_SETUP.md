# Google Sheets Setup Guide

## Step 1: Create Your Google Sheet

1. **Go to Google Sheets**: https://sheets.google.com
2. **Create a new spreadsheet**
3. **Name it**: `Amazon Associates - mula09a-20` (or your account name)
4. **Add headers in Row 1**:

```
Date | Account Name | Revenue | Earnings | Clicks | Orders | Conversion Rate | Items Ordered | Items Shipped | Revenue Per Click | Last Updated
```

5. **Get your Sheet ID**:
   - Look at the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`
   - Copy the part between `/d/` and `/edit`
   - Example: If URL is `https://docs.google.com/spreadsheets/d/1ABC123xyz456/edit`, your Sheet ID is `1ABC123xyz456`

## Step 2: Add Sheet ID to Pipedream

1. **In your Pipedream workflow**, go to **Settings** (gear icon)
2. **Click "Environment Variables"**
3. **Add a new variable**:
   - **Name**: `GOOGLE_SHEET_ID`
   - **Value**: Paste your Sheet ID (e.g., `1ABC123xyz456`)
4. **Save**

## Step 3: Add Google Sheets Step to Workflow

1. **In your Pipedream workflow**, click the **+** button after your scraper step
2. **Choose "Run Node.js Code"**
3. **Copy the code from**: `pipedream-google-sheets-step.js`
4. **Paste it into the code editor**
5. **Click "Connect Account"** next to the `google_sheets` prop
6. **Authorize with your Google account**
7. **Make sure the step is connected to your scraper step** (it should automatically reference the previous step's output)

## Step 4: Test It

1. **Click "Test"** in Pipedream
2. **Check the logs** - you should see:
   - `📊 Adding data to Google Sheets...`
   - `✅ Successfully added data to Google Sheet!`
3. **Check your Google Sheet** - a new row should appear with today's data

## Troubleshooting

### "GOOGLE_SHEET_ID environment variable not set"
- Make sure you added the environment variable in workflow settings
- Check that the variable name is exactly `GOOGLE_SHEET_ID` (case-sensitive)

### "No scraper data found"
- Make sure the Google Sheets step comes AFTER the scraper step
- Check that the scraper step completed successfully

### "Failed to add data to Google Sheet"
- Make sure you connected your Google account in the step props
- Check that the Sheet ID is correct
- Make sure the sheet exists and you have edit permissions

### Duplicate entries
- The step automatically checks for duplicates (same Date + Account Name)
- If a duplicate is found, it will skip the insert (this is normal for re-runs)

## Sheet Format

Your sheet should look like this:

| Date | Account Name | Revenue | Earnings | Clicks | Orders | Conversion Rate | Items Ordered | Items Shipped | Revenue Per Click | Last Updated |
|------|--------------|---------|----------|--------|--------|-----------------|---------------|---------------|-------------------|--------------|
| 2025-11-22 | mula09a-20 | 560058.76 | 42884.82 | 421124 | 30445 | 7.23 | 30445 | 30342 | 1.33 | 2025-11-22T23:08:12.626Z |

## Next Steps

Once this is working, you can:
- Set up a cron trigger to run daily
- Add more accounts (create separate sheets or tabs)
- Add data visualization/charts in Google Sheets
- Set up email notifications when data is added

