# Amazon Associates Reporting - Quick Start Guide

Get up and running in 15 minutes!

---

## Prerequisites

- ✅ Amazon Associates account (email & password ready)
- ✅ Google account
- ✅ Pipedream account (free tier: https://pipedream.com)

---

## Step 1: Google Sheets Setup (5 minutes)

### Create Sheets

For each Amazon Associates account:

1. Create a new Google Sheet
2. Name it: `Amazon Associates - [Account Name]`
3. Add these headers in row 1:

```
Date | Account Name | Revenue | Earnings | Clicks | Orders | Conversion Rate | Items Ordered | Items Shipped | Revenue Per Click | Last Updated
```

4. Copy the Sheet ID from the URL:
   - URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`
   - Save this ID for later

---

## Step 2: Pipedream Setup (10 minutes)

### 1. Create Workflow

1. Go to https://pipedream.com
2. Click **New Workflow**
3. Name it: `Amazon Associates Daily Scraper`

### 2. Add Trigger

1. Click **Select a Trigger**
2. Choose **Schedule (Cron)**
3. Set schedule: `0 6 * * *` (runs 6am EST daily)
4. Timezone: `America/New_York`
5. Click **Create Source**

### 3. Add Environment Variables

1. Click workflow **Settings** (gear icon)
2. Go to **Environment Variables**
3. Add these variables:

```
AMAZON_EMAIL = your-email@example.com
AMAZON_PASSWORD = your-password
ACCOUNTS_CONFIG = account-1,account-2,account-3
SHEET_ID_ACCOUNT-1 = paste-your-sheet-id-here
SHEET_ID_ACCOUNT-2 = paste-your-sheet-id-here
SHEET_ID_ACCOUNT-3 = paste-your-sheet-id-here
```

### 4. Add Code Step

1. Click **+** to add new step
2. Choose **Run Node.js Code**
3. Copy code from `src/pipedream/workflow-template.js`
4. Paste each section as separate steps

### 5. Connect Google Sheets

1. Add **Google Sheets** action
2. Click **Connect Account**
3. Authorize with your Google account
4. Select action: **Add Row**
5. Map fields from previous step

### 6. Deploy

1. Click **Deploy** at top right
2. Verify status shows **Active**

---

## Step 3: Test Run

1. Click **Test** button in Pipedream
2. Watch the execution logs
3. Check your Google Sheets for data
4. If errors occur, check the logs

---

## Step 4: Monitor

### Daily Checks

- Open Pipedream dashboard
- Check execution history
- Verify data in Google Sheets

### Weekly Review

- Review any errors in logs
- Verify data completeness
- Check for Amazon UI changes

---

## Troubleshooting

### Login Fails

- ✅ Check AMAZON_EMAIL and AMAZON_PASSWORD
- ✅ Try logging in manually to verify credentials
- ✅ Check if Amazon added 2FA (not supported yet)

### No Data in Sheets

- ✅ Verify Sheet IDs are correct
- ✅ Check Google Sheets permissions
- ✅ Review Pipedream execution logs

### Scraping Errors

- ✅ Amazon may have changed their UI
- ✅ Check screenshots in error logs
- ✅ Update selectors in `config.js`

---

## What's Next?

- 📖 Read [PROJECT_OVERVIEW.md](./docs/PROJECT_OVERVIEW.md) for full details
- 🔧 Review [SETUP_CHECKLIST.md](./docs/SETUP_CHECKLIST.md) for advanced setup
- 📚 Check [ARCHITECTURE.md](./docs/ARCHITECTURE.md) to understand the system

---

## Need Help?

- **Documentation**: See `/docs` folder
- **Issues**: Check [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- **Architecture**: See [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## Important Notes

⚠️ **Selector Placeholders**: The code contains placeholder selectors. You MUST inspect the actual Amazon Associates dashboard and update the selectors in `src/scraper/config.js`.

⚠️ **No 2FA**: This system doesn't support Two-Factor Authentication. Make sure 2FA is disabled on your Amazon account.

⚠️ **Rate Limiting**: The scraper processes accounts sequentially with delays to avoid rate limiting. Don't modify the delay settings.

⚠️ **Cost**: Runs on Pipedream's free tier ($0/month). If you have many accounts or need faster execution, you may need to upgrade.

---

**Ready to go!** 🚀

Your workflow will now run automatically every day at 6am EST, scraping data from all your Amazon Associates accounts and storing it in Google Sheets.

