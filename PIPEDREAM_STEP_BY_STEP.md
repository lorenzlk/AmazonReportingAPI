# Step-by-Step Pipedream Setup

## 🎯 Goal
Set up a workflow that scrapes all 9 Tracking IDs and saves each to Google Sheets.

---

## Step 1: Create New Workflow

1. **Go to Pipedream**: https://pipedream.com
2. **Click** "Workflows" in the left sidebar
3. **Click** the **"New"** button (top right) or **"Create Workflow"**
4. **Name it**: `Amazon Associates Multi-Account Scraper`
5. **Click** "Create"

---

## Step 2: Add Multi-Account Scraper (Step 1)

### 2.1 Add Code Step

1. **Click** the **"+"** button (or "Add Step")
2. **Search** for: `code` or `node`
3. **Select**: **"Run Node.js code"** (or "Code")
4. **Name this step**: `Multi-Account Scraper`

### 2.2 Paste the Code

1. **Open** `pipedream-all-accounts-scraper.js` from your files
2. **Copy ALL the code** (Cmd+A, Cmd+C)
3. **Paste it** into the Pipedream code editor
4. **Delete** any default code that was there

### 2.3 Connect Browserless

1. **Look for** the `browserless` prop in the code (should be visible in the props section)
2. **Click** "Connect account" or the dropdown next to it
3. **Select** your Browserless account (or connect a new one)
4. **Enter** your Browserless API key if needed

### 2.4 Set Environment Variables

1. **Click** the **gear icon** ⚙️ at the top of the workflow (Settings)
2. **Go to** "Environment Variables" or "Secrets"
3. **Add** these variables:
   - `AMAZON_EMAIL` = your Amazon Associates email
   - `AMAZON_PASSWORD` = your Amazon Associates password
4. **Save**

### 2.5 Test Step 1

1. **Click** "Test" button (top right)
2. **Wait** for it to run (may take 1-2 minutes)
3. **Check** the output - should see:
   ```json
   {
     "results": [
       { "date": "...", "storeId": "...", "trackingId": "...", ... },
       ...8 more...
     ],
     "count": 9,
     "timestamp": "..."
   }
   ```
4. **If it works**: ✅ Move to Step 3
5. **If it fails**: Check logs for errors (login issues, timeout, etc.)

---

## Step 3: Add Loop Step (Step 2)

### 3.1 Add Loop

1. **Click** the **"+"** button after Step 1
2. **Search** for: `loop` or `for each`
3. **Select**: **"Loop Over Items"** or **"For Each"**
4. **Name this step**: `Loop Through Results`

### 3.2 Configure Loop

1. **In the "Items" field**, enter:
   ```
   {{ steps.multi_account_scraper.results }}
   ```
   - Or if your step is named differently: `{{ steps.step_1.results }}`
   - **Tip**: Click the dropdown to see available step references

2. **Item variable name**: Leave as `item` (or change to `result` if you prefer)

3. **Click** "Save" or "Done"

### 3.3 Test Loop

1. **Click** "Test" button
2. **Check** logs - should see the loop running 9 times
3. **Each iteration** should show one result object

---

## Step 4: Add Google Sheets Step (Step 3 - Inside Loop)

### 4.1 Add Code Step Inside Loop

1. **Click** the **"+"** button **inside** the Loop step (not after it)
2. **Search** for: `code` or `node`
3. **Select**: **"Run Node.js code"**
4. **Name this step**: `Save to Google Sheets`

### 4.2 Paste the Code

1. **Open** `pipedream-google-sheets-step.js` from your files
2. **Copy ALL the code** (Cmd+A, Cmd+C)
3. **Paste it** into the Pipedream code editor

### 4.3 Connect Google Sheets

1. **Look for** the `google_sheets` prop in the code
2. **Click** "Connect account" or the dropdown
3. **Authorize** with your Google account
4. **Grant permissions** to access Google Sheets

### 4.4 Configure Input Data

1. **In the code**, look for where it gets `scraperData`
2. **The code should automatically** get data from the loop
3. **If needed**, you can explicitly pass: `{{ steps.loop_through_results.item }}`
   - Or: `{{ steps.step_2.item }}`

### 4.5 Test Step 3

1. **Click** "Test" button
2. **Wait** for it to run (will run 9 times - once per Tracking ID)
3. **Check** your Google Sheet - should see data in each tab:
   - Tab: `mula09a-20`
   - Tab: `mula07-20`
   - Tab: `twsmm-20`
   - etc.

---

## Step 5: Verify Your Google Sheet

1. **Open** your Google Sheet: https://docs.google.com/spreadsheets/d/1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM/edit

2. **Check each tab** has:
   - ✅ Headers in Row 1
   - ✅ New data row (if first run)
   - ✅ Updated data row (if same date)

3. **Tabs should exist**:
   - mula09a-20
   - mula07-20
   - twsmm-20
   - stylcasterm-20
   - defpenm-20
   - swimworldm-20
   - britcom03-20
   - on3m-20
   - mula0f-20

---

## Step 6: Schedule the Workflow

1. **Click** the **"Schedule"** tab (top of workflow)
2. **Click** "Add Schedule"
3. **Choose**:
   - **Frequency**: Daily
   - **Time**: 6:00 AM (or your preferred time)
   - **Timezone**: Your timezone
4. **Save**

---

## ✅ Final Workflow Structure

```
┌─────────────────────────────────────┐
│ Step 1: Multi-Account Scraper       │
│ (Node.js code)                      │
│ Returns: { results: [...], count: 9}│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Step 2: Loop Through Results        │
│ (Loop step)                         │
│ Items: {{ steps.step_1.results }}   │
│                                      │
│   ┌──────────────────────────────┐  │
│   │ Step 3: Save to Google Sheets│  │
│   │ (Node.js code - inside loop)  │  │
│   │ Input: {{ steps.step_2.item }}│  │
│   └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: Step 1 fails with "TIMEOUT"
- **Solution**: Check Browserless connection and API key
- **Solution**: Verify Amazon credentials are correct

### Issue: Loop doesn't iterate
- **Solution**: Check Step 1 output - should have `results` array
- **Solution**: Verify loop items path: `{{ steps.step_1.results }}`

### Issue: Google Sheets step can't find data
- **Solution**: Make sure Step 3 is **inside** the loop, not after it
- **Solution**: Check that loop item variable matches what code expects

### Issue: Data not saving to correct tab
- **Solution**: Verify tab names match Tracking IDs exactly
- **Solution**: Check sheet ID is correct in code

### Issue: "Cannot read properties of undefined"
- **Solution**: Check that previous step completed successfully
- **Solution**: Verify data structure matches what code expects

---

## 📝 Quick Checklist

- [ ] Step 1: Multi-Account Scraper added and tested
- [ ] Step 2: Loop step configured with correct items path
- [ ] Step 3: Google Sheets step added **inside** loop
- [ ] Browserless connected
- [ ] Google Sheets connected
- [ ] Environment variables set (AMAZON_EMAIL, AMAZON_PASSWORD)
- [ ] All 9 tabs exist in Google Sheet
- [ ] Test run successful
- [ ] Schedule set up

---

## 🎉 You're Done!

Once everything is set up:
- Workflow runs daily automatically
- Scrapes all 9 Tracking IDs
- Saves each to its tab
- Updates existing rows (same date) or adds new rows

**Need help?** Check the logs in each step for detailed error messages.

