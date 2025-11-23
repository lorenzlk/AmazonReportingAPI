# Quick Start - Multi-Account Setup

## 🚀 3 Steps to Set Up

### 1. Copy Code to Pipedream

**Step 1 - Multi-Account Scraper:**
- File: `pipedream-all-accounts-scraper.js`
- Type: Node.js code step
- Connect: Browserless app
- Returns: `{ results: [...9 items...], count: 9 }`

**Step 2 - Loop:**
- Type: Loop step (Pipedream built-in)
- Items: `{{ steps.step_1.results }}`

**Step 3 - Google Sheets:**
- File: `pipedream-google-sheets-step.js`
- Type: Node.js code step
- Connect: Google Sheets app
- Input: `{{ steps.step_2.item }}`

### 2. Test

Click "Test" - should scrape all 9 Tracking IDs and save to tabs.

### 3. Schedule

Set to run daily (e.g., 6:00 AM).

## 📊 What Gets Scraped

- **9 Tracking IDs** across **4 Store IDs**
- Each saved to its own **tab** in Google Sheets
- Tab name = Tracking ID name

## ✅ That's It!

See `PIPEDREAM_WORKFLOW_SETUP.md` for detailed instructions.

