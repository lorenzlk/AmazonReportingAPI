# Amazon Associates Reporting - Setup Checklist

Follow this checklist to set up the Amazon Associates automated reporting system from scratch.

---

## Prerequisites

Before starting, ensure you have:

- [ ] Amazon Associates account access (email and password)
- [ ] List of all account IDs/names you want to track
- [ ] Google Workspace account
- [ ] Pipedream account (free tier is sufficient)
- [ ] Basic familiarity with Pipedream workflows

---

## Phase 1: Google Sheets Setup

### 1.1 Create Google Sheets

For each Amazon Associates account:

- [ ] Create a new Google Sheet
- [ ] Name it: `Amazon Associates - [Account Name]`
- [ ] Set up columns in first sheet (use row 1 for headers):
  ```
  Date | Account Name | Revenue | Earnings | Clicks | Orders | Conversion Rate | Items Ordered | Items Shipped | Revenue Per Click | Last Updated
  ```
- [ ] Note the Sheet ID (found in URL: `docs.google.com/spreadsheets/d/[SHEET_ID]/edit`)
- [ ] Set sharing to private (or specific users only)

### 1.2 Enable Google Sheets API

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create a new project (or use existing)
- [ ] Enable Google Sheets API
- [ ] Create service account credentials
- [ ] Download credentials JSON file
- [ ] Share each sheet with the service account email

**Alternative**: Use Pipedream's built-in Google Sheets integration (easier)

---

## Phase 2: Project Setup

### 2.1 Clone/Download Project Files

- [ ] Download all project files to your local machine
- [ ] Navigate to project directory: `/AA Reporting`
- [ ] Review folder structure

### 2.2 Install Dependencies (Local Testing)

If testing locally first:

```bash
cd /Users/loganlorenz/AA\ Reporting
npm install
```

Dependencies include:
- `puppeteer` (or `puppeteer-core`)
- `@google-cloud/sheets` or use Pipedream's integration
- `dotenv` (for local testing)

---

## Phase 3: Configuration

### 3.1 Create Configuration Files

#### Create `config/accounts.json`:

- [ ] Copy `config/accounts.example.json` to `config/accounts.json`
- [ ] Fill in your account details:

```json
{
  "accounts": [
    {
      "id": "account-1",
      "name": "Primary Store",
      "sheetId": "YOUR_SHEET_ID_HERE"
    },
    {
      "id": "account-2",
      "name": "Secondary Store",
      "sheetId": "YOUR_SHEET_ID_HERE"
    }
  ]
}
```

#### Create `config/sheets-mapping.json`:

- [ ] Map account IDs to Google Sheet IDs
- [ ] Include sheet name (tab name) if using multiple tabs

```json
{
  "account-1": {
    "sheetId": "1ABC...XYZ",
    "tabName": "Daily Data"
  },
  "account-2": {
    "sheetId": "2DEF...UVW",
    "tabName": "Daily Data"
  }
}
```

### 3.2 Prepare Credentials

- [ ] Have Amazon Associates email ready
- [ ] Have Amazon Associates password ready
- [ ] Have Google Sheets credentials ready (or use Pipedream auth)

**Security Note**: Never commit credentials to code. Use environment variables.

---

## Phase 4: Pipedream Setup

### 4.1 Create Pipedream Workflow

- [ ] Log into [Pipedream](https://pipedream.com)
- [ ] Create new workflow
- [ ] Name it: `Amazon Associates Daily Scraper`

### 4.2 Add Trigger

- [ ] Add a **Cron Scheduler** trigger
- [ ] Set schedule: `0 6 * * *` (6am EST daily)
- [ ] Configure timezone: `America/New_York`

### 4.3 Add Environment Variables

- [ ] Go to Workflow Settings → Environment Variables
- [ ] Add the following variables:

```
AMAZON_EMAIL = your-email@example.com
AMAZON_PASSWORD = your-password
ACCOUNTS_CONFIG = account-1,account-2,account-3
```

- [ ] Optionally add Google credentials if not using Pipedream's auth:
```
GOOGLE_SHEETS_CREDENTIALS = { ... service account JSON ... }
```

### 4.4 Add Node.js Code Step

- [ ] Add a new step: **Run Node.js Code**
- [ ] Copy contents of `src/pipedream/workflow-template.js`
- [ ] Paste into the code editor

### 4.5 Configure Google Sheets Steps

For each account (or use dynamic steps):

- [ ] Add **Google Sheets - Add Row** action
- [ ] Connect your Google account
- [ ] Select the appropriate sheet
- [ ] Map fields from previous step data

### 4.6 Add Error Notification (Optional but Recommended)

- [ ] Add **Send Email** or **Slack** step at the end
- [ ] Configure to send only on errors
- [ ] Use conditional execution: `{{ steps.scraper.error }}`

---

## Phase 5: Local Testing (Optional)

Before deploying to Pipedream, test locally:

### 5.1 Create `.env` File

```bash
# .env
AMAZON_EMAIL=your-email@example.com
AMAZON_PASSWORD=your-password
ACCOUNTS_CONFIG=account-1,account-2
```

### 5.2 Run Test Script

```bash
node src/scraper/amazon-associates-scraper.js
```

- [ ] Verify browser launches
- [ ] Verify login succeeds
- [ ] Verify data extraction works
- [ ] Check console output for errors

### 5.3 Test Google Sheets Integration

```bash
node src/pipedream/google-sheets-updater.js
```

- [ ] Verify data is written to correct sheet
- [ ] Check data format and columns
- [ ] Verify duplicate detection works

---

## Phase 6: Deployment

### 6.1 Deploy to Pipedream

- [ ] Click **Deploy** in Pipedream workflow
- [ ] Verify deployment succeeds
- [ ] Check workflow status shows "Active"

### 6.2 Test Run

- [ ] Click **Test** in Pipedream to manually trigger
- [ ] Monitor execution in real-time
- [ ] Check logs for any errors
- [ ] Verify data appears in Google Sheets

### 6.3 Verify Schedule

- [ ] Confirm cron schedule is active
- [ ] Wait for next scheduled run
- [ ] Check execution history after first scheduled run

---

## Phase 7: Monitoring Setup

### 7.1 Set Up Alerts

- [ ] Enable Pipedream workflow notifications
- [ ] Configure email alerts for failures
- [ ] Optional: Set up Slack/Discord webhook

### 7.2 Create Monitoring Dashboard

- [ ] Open Pipedream workflow dashboard
- [ ] Bookmark for easy access
- [ ] Check execution history regularly

### 7.3 Google Sheets Monitoring

- [ ] Create a summary sheet (optional)
- [ ] Add formulas to check for missing dates
- [ ] Set up conditional formatting for anomalies

---

## Phase 8: Validation

### 8.1 Data Quality Checks

- [ ] Verify data appears for all accounts
- [ ] Check data completeness (all columns populated)
- [ ] Compare with Amazon dashboard manually
- [ ] Verify timestamps are correct

### 8.2 Duplicate Detection Test

- [ ] Manually trigger workflow twice
- [ ] Verify no duplicate rows created
- [ ] Check logs for "duplicate detected" messages

### 8.3 Error Handling Test

- [ ] Test with incorrect credentials (then revert)
- [ ] Verify error notification is sent
- [ ] Check error is logged properly

---

## Phase 9: Documentation

### 9.1 Document Your Setup

- [ ] Note all Sheet IDs in a secure location
- [ ] Document account names and IDs
- [ ] Save Pipedream workflow URL
- [ ] Create runbook for common issues

### 9.2 Share Access

- [ ] Share Google Sheets with relevant stakeholders
- [ ] Set appropriate permissions (view/edit)
- [ ] Document who has access

---

## Phase 10: Optimization (Post-Launch)

After a week of successful runs:

- [ ] Review execution times
- [ ] Check for any recurring errors
- [ ] Optimize selectors if needed
- [ ] Add any missing metrics discovered
- [ ] Consider adding email summaries

---

## Troubleshooting Checklist

If something doesn't work:

- [ ] Check Pipedream execution logs
- [ ] Verify environment variables are set correctly
- [ ] Confirm Google Sheets IDs are correct
- [ ] Test Amazon login manually
- [ ] Check if Amazon UI has changed
- [ ] Verify Puppeteer is working (check screenshots)
- [ ] Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Success Criteria

You're done when:

- ✅ Workflow runs daily without errors
- ✅ Data appears in all Google Sheets
- ✅ No duplicate entries
- ✅ All metrics are captured
- ✅ Notifications work on errors
- ✅ Execution time is reasonable (<10 min)

---

## Maintenance Schedule

### Daily
- [ ] Quick check: Did workflow run?
- [ ] Quick check: Is data in sheets?

### Weekly
- [ ] Review execution logs
- [ ] Check for any new errors
- [ ] Verify data quality

### Monthly
- [ ] Review performance metrics
- [ ] Check for Amazon UI changes
- [ ] Update dependencies if needed
- [ ] Review and optimize costs

---

## Need Help?

- **Documentation**: See [INDEX.md](./INDEX.md)
- **Technical Details**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Implementation**: See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- **Issues**: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

**Checklist Version**: 1.0  
**Last Updated**: November 3, 2025  
**Estimated Setup Time**: 2-3 hours

