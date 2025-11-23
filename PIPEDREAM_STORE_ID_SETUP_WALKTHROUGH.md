# Pipedream Store ID Workflow Setup - Step-by-Step Walkthrough

This guide walks you through creating all 4 Store ID workflows in Pipedream, one step at a time.

## Prerequisites Checklist

Before starting, make sure you have:
- [ ] Pipedream account (paid recommended)
- [ ] Browserless account connected in Pipedream
- [ ] Google Sheets account connected in Pipedream
- [ ] Google Sheet ID: `1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM`
- [ ] Amazon credentials ready (email and password)

---

## Workflow 1: mula09a-20

### Step 1: Create New Workflow

1. **Go to Pipedream Dashboard**
   - Navigate to [https://pipedream.com](https://pipedream.com)
   - Click **"Workflows"** in the left sidebar
   - Click **"+ New Workflow"** button (top right)

2. **Name the Workflow**
   - In the workflow name field, type: `Amazon Associates - mula09a-20`
   - Click **"Create"** or press Enter

### Step 2: Add Cron Trigger

1. **Add Trigger Step**
   - You should see a step builder interface
   - Click **"+ Add Step"** or the **"+"** button
   - In the search box, type: `cron`
   - Select **"Schedule"** from the results

2. **Configure Schedule**
   - **Schedule Name**: Leave default or name it "Daily 6am EST"
   - **Cron Expression**: Type: `0 6 * * *`
     - This means: Run at 6:00 AM every day
   - **Timezone**: Select `America/New_York` (EST/EDT)
   - Click **"Save"** or **"Continue"**

### Step 3: Add Scraper Step

1. **Add Code Step**
   - Click **"+ Add Step"** after the trigger
   - Search for: `code`
   - Select **"Code"** → **"Node.js v20"**

2. **Name the Step**
   - Click on the step name (defaults to "Code")
   - Rename to: `Scraper - mula09a-20`
   - Press Enter to save

3. **Copy Scraper Code**
   - Open the file: `workflows/mula09a-20/scraper.js` from your local project
   - Select ALL the code (Cmd+A / Ctrl+A)
   - Copy it (Cmd+C / Ctrl+C)
   - Go back to Pipedream
   - Delete any default code in the editor
   - Paste the code (Cmd+V / Ctrl+V)

4. **Configure Props - Browserless**
   - Look for the **"Props"** tab above the code editor
   - Click on **"Props"**
   - Find the `browserless` prop
   - Click **"Connect"** or select your existing Browserless connection
   - If you need to connect:
     - Click **"Connect Browserless"**
     - Enter your Browserless API key
     - Click **"Save"**

5. **Configure Props - Store ID**
   - Still in the Props tab
   - Find the `storeId` prop
   - In the value field, type: `mula09a-20`
   - Make sure it's exactly: `mula09a-20` (no spaces, lowercase)

6. **Configure Props - Report Date**
   - Find the `reportDate` prop
   - It should default to `"yesterday"` - leave it as is
   - (This will automatically scrape yesterday's data)

7. **Set Timeout**
   - Click the **gear icon** ⚙️ on the step (top right of the step)
   - Find **"Timeout"** setting
   - Change from default to: `180` seconds (3 minutes)
   - Click **"Save"** or close the settings

8. **Save the Step**
   - Click **"Save"** button (bottom right or top right)

### Step 4: Add Google Sheets Step

1. **Add Another Code Step**
   - Click **"+ Add Step"** after the scraper step
   - Search for: `code`
   - Select **"Code"** → **"Node.js v20"**

2. **Name the Step**
   - Click on the step name
   - Rename to: `Save to Google Sheets`
   - Press Enter

3. **Copy Google Sheets Code**
   - Open the file: `workflows/mula09a-20/google-sheets.js` from your local project
   - Select ALL the code (Cmd+A / Ctrl+A)
   - Copy it (Cmd+C / Ctrl+C)
   - Go back to Pipedream
   - Delete any default code
   - Paste the code (Cmd+V / Ctrl+V)
   - **Note**: Step reference is already set to `steps["Scraper - mula09a-20"]` - no changes needed!

5. **Configure Props - Google Sheets**
   - Click the **"Props"** tab
   - Find the `google_sheets` prop
   - Click **"Connect"** or select your existing Google Sheets connection
   - If you need to connect:
     - Click **"Connect Google Sheets"**
     - Authorize Pipedream to access your Google account
     - Grant permissions
     - Click **"Save"**

6. **Set Timeout**
   - Click the **gear icon** ⚙️ on the step
   - Set **"Timeout"** to: `60` seconds (1 minute)
   - Click **"Save"**

7. **Save the Step**
   - Click **"Save"** button

### Step 5: Set Environment Variables

1. **Open Workflow Settings**
   - Click the **gear icon** ⚙️ at the top of the workflow (next to workflow name)
   - Or click **"Settings"** in the workflow menu

2. **Go to Environment Variables**
   - Click **"Environment Variables"** in the settings menu
   - Or look for **"Secrets"** or **"Variables"** tab

3. **Add AMAZON_EMAIL**
   - Click **"+ Add Variable"** or **"New Secret"**
   - **Name**: `AMAZON_EMAIL`
   - **Value**: Your Amazon Associates email address
   - Click **"Save"**

4. **Add AMAZON_PASSWORD**
   - Click **"+ Add Variable"** again
   - **Name**: `AMAZON_PASSWORD`
   - **Value**: Your Amazon Associates password
   - Click **"Save"**

5. **Add GOOGLE_SHEET_ID**
   - Click **"+ Add Variable"** again
   - **Name**: `GOOGLE_SHEET_ID`
   - **Value**: `1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM`
   - Click **"Save"**

6. **Close Settings**
   - Click **"X"** or navigate back to the workflow

### Step 6: Test Workflow 1

1. **Run Manual Test**
   - Click **"Test"** button (top right of workflow)
   - Or click the **play icon** ▶️
   - Select **"Run Now"** or **"Test Workflow"**

2. **Watch Execution**
   - The workflow will start running
   - Watch the logs in real-time
   - Look for:
     - ✅ "Connected to browser!"
     - ✅ "Login successful!"
     - ✅ "Scraped X Tracking IDs"
     - ✅ "Saved data for mula09a-20"

3. **Check for Errors**
   - If you see ❌ errors, check:
     - Browserless connection is working
     - Amazon credentials are correct
     - Step references match
     - Timeout is sufficient

4. **Verify in Google Sheets**
   - Open: `https://docs.google.com/spreadsheets/d/1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM`
   - Check for tab: `mula09a-20`
   - Verify data row with yesterday's date
   - Check that metrics are populated (not all zeros)

5. **If Test Fails**
   - Check the error message in logs
   - Verify all props are set correctly
   - Check environment variables are saved
   - Try increasing timeout if it's timing out

---

## Workflow 2: bm01f-20

### Step 1: Create New Workflow

1. **Create Another Workflow**
   - Click **"+ New Workflow"** in Pipedream
   - Name it: `Amazon Associates - bm01f-20`
   - Click **"Create"**

### Step 2-5: Repeat Steps 2-5 from Workflow 1

Follow the exact same steps as Workflow 1, but with these changes:

**In Step 3 (Scraper Step):**
- Step name: `Scraper - bm01f-20`
- `storeId` prop value: `bm01f-20` (not mula09a-20)

**In Step 4 (Google Sheets Step):**
- Update step reference to:
  ```javascript
  const scraperStep = steps["Scraper - bm01f-20"] || steps.trigger;
  ```

**Environment Variables:**
- You can reuse the same environment variables (no need to add them again if they're workspace-level)

### Step 6: Test Workflow 2

- Run test
- Verify data appears in Google Sheet tab: `mula07-20`

---

## Workflow 3: tag0d1d-20

### Step 1: Create New Workflow

1. **Create Another Workflow**
   - Name it: `Amazon Associates - tag0d1d-20`
   - Click **"Create"**

### Step 2-5: Repeat Steps 2-5 from Workflow 1

**Changes:**

**In Step 3 (Scraper Step):**
- Step name: `Scraper - tag0d1d-20`
- `storeId` prop value: `tag0d1d-20`
- **Timeout**: Consider setting to `300` seconds (5 minutes) since this processes 6 Tracking IDs

**In Step 4 (Google Sheets Step):**
- Update step reference to:
  ```javascript
  const scraperStep = steps["Scraper - tag0d1d-20"] || steps.trigger;
  ```

### Step 6: Test Workflow 3

- Run test
- Verify data appears in Google Sheet tabs:
  - `twsmm-20`
  - `stylcasterm-20`
  - `defpenm-20`
  - `swimworldm-20`
  - `britcom03-20`
  - `on3m-20`

---

## Workflow 4: usmagazine05-20

### Step 1: Create New Workflow

1. **Create Another Workflow**
   - Name it: `Amazon Associates - usmagazine05-20`
   - Click **"Create"**

### Step 2-5: Repeat Steps 2-5 from Workflow 1

**Changes:**

**In Step 3 (Scraper Step):**
- Step name: `Scraper - usmagazine05-20`
- `storeId` prop value: `usmagazine05-20`

**In Step 4 (Google Sheets Step):**
- Update step reference to:
  ```javascript
  const scraperStep = steps["Scraper - usmagazine05-20"] || steps.trigger;
  ```

### Step 6: Test Workflow 4

- Run test
- Verify data appears in Google Sheet tab: `mula0f-20`

---

## Final Steps: Enable Scheduling

### For Each Workflow:

1. **Go to Each Workflow**
   - Navigate to each of the 4 workflows

2. **Check Cron Trigger**
   - Make sure the Cron trigger step is enabled
   - Verify schedule: `0 6 * * *`
   - Verify timezone: `America/New_York`

3. **Enable Workflow**
   - Make sure the workflow is **"Active"** or **"Enabled"**
   - Toggle should be ON (green)

4. **Verify All Workflows**
   - All 4 workflows should be:
     - ✅ Active/Enabled
     - ✅ Cron trigger configured
     - ✅ Tested successfully
     - ✅ Data appearing in Google Sheets

---

## Verification Checklist

After setting up all 4 workflows, verify:

- [ ] All 4 workflows created and named correctly
- [ ] All 4 workflows have Cron triggers set to 6am EST
- [ ] All 4 workflows tested successfully
- [ ] All 9 Tracking IDs have data in Google Sheets:
  - [ ] `mula09a-20`
  - [ ] `mula07-20`
  - [ ] `twsmm-20`
  - [ ] `stylcasterm-20`
  - [ ] `defpenm-20`
  - [ ] `swimworldm-20`
  - [ ] `britcom03-20`
  - [ ] `on3m-20`
  - [ ] `mula0f-20`
- [ ] All dates are "yesterday" (correct)
- [ ] All metrics populated (not all zeros)
- [ ] All workflows enabled for scheduling

---

## Troubleshooting

### Workflow Times Out
- **Solution**: Increase timeout in scraper step
- Try: 300 seconds (5 minutes) for workflows with multiple Tracking IDs

### No Data in Sheets
- **Check**: Scraper logs for errors
- **Verify**: Store ID prop is set correctly
- **Check**: Google Sheets connection is working
- **Verify**: Step reference matches step name exactly

### Date is Wrong
- **Check**: `reportDate` prop is set to "yesterday"
- **Note**: Date picker might not work - data will still be labeled correctly

### Connection Errors
- **Check**: Browserless connection is valid
- **Verify**: Browserless API key is correct
- **Try**: Reconnecting Browserless app

### Step Reference Error
- **Error**: "Cannot read property of undefined"
- **Solution**: Make sure step reference matches step name exactly
- **Check**: Step names have correct capitalization and spaces

---

## Quick Reference: Step Names by Workflow

| Workflow | Scraper Step Name | Google Sheets Step Reference |
|----------|-------------------|----------------------------|
| mula09a-20 | `Scraper - mula09a-20` | `steps["Scraper - mula09a-20"]` |
| bm01f-20 | `Scraper - bm01f-20` | `steps["Scraper - bm01f-20"]` |
| tag0d1d-20 | `Scraper - tag0d1d-20` | `steps["Scraper - tag0d1d-20"]` |
| usmagazine05-20 | `Scraper - usmagazine05-20` | `steps["Scraper - usmagazine05-20"]` |

---

## You're Done! 🎉

Once all 4 workflows are set up and tested:
- They will run automatically at 6am EST daily
- Data will be saved to Google Sheets
- Each workflow is independent (one failure doesn't affect others)
- You can monitor each workflow's logs separately

**Next**: Monitor the first few daily runs to ensure everything works smoothly!

