# Product Context - Amazon Associates Automated Reporting

## Why This Project Exists

### The Problem

**Amazon Associates has no reporting API.** Publishers and affiliate marketers need to:
1. Log into the dashboard manually every day
2. Navigate between multiple accounts
3. Copy data to spreadsheets for tracking
4. Perform this repetitive task consistently

For users managing multiple Amazon Associates accounts, this becomes:
- Time-consuming (15-30 minutes daily)
- Error-prone (manual data entry)
- Inconsistent (easy to forget or skip days)
- Not scalable (grows linearly with account count)

### Who This Is For

**Primary User:** Logan Lorenz
- Manages multiple Amazon Associates accounts
- Needs historical data for trend analysis
- Wants automated, hands-off solution
- Already uses similar automation for other projects (TWSN KVP Reporting, Board Pulse)

**Secondary Users:** Data analysts, business owners managing affiliate accounts

## Problems Being Solved

### 1. Manual Data Collection
**Current State:** Daily manual login and data copying  
**Desired State:** Fully automated daily data extraction  
**Solution:** Puppeteer-based scraper running on Pipedream schedule

### 2. Multi-Account Management
**Current State:** Tedious toggling between accounts in Amazon UI  
**Desired State:** Automatic processing of all accounts  
**Solution:** Account switcher logic handles navigation between accounts

### 3. Data Organization
**Current State:** Data scattered or in single spreadsheet  
**Desired State:** Organized sheets (one per account) with historical tracking  
**Solution:** Google Sheets integration with dedicated sheet per account

### 4. Data Integrity
**Current State:** Risk of duplicate entries or missing data  
**Desired State:** Clean, deduplicated historical data  
**Solution:** Duplicate detection using date + account composite key

### 5. Reliability
**Current State:** Dependent on user remembering to collect data  
**Desired State:** Autonomous system that runs without oversight  
**Solution:** Pipedream cron trigger + error notifications + retry logic

## How It Should Work

### User Experience

**Ideal Flow:**
1. User sets up system once (15-minute setup)
2. System runs automatically every morning
3. User checks Google Sheets for data
4. System sends email only if errors occur

**No user interaction required after setup.**

### Data Flow

```
6am EST → Pipedream Trigger
    ↓
Login to Amazon Associates
    ↓
For Each Account:
    Switch to Account
    Extract All Metrics
    ↓
Check for Duplicates
    ↓
Append to Google Sheet
    ↓
Next Account
    ↓
Complete → Send Summary
```

### Output Format

Each Google Sheet contains:
- Date (YYYY-MM-DD)
- Account Name
- Revenue ($)
- Earnings ($)
- Clicks (count)
- Orders (count)
- Conversion Rate (%)
- Items Ordered (count)
- Items Shipped (count)
- Revenue Per Click ($)
- Last Updated (timestamp)

### Error Handling

**When Things Go Wrong:**
- Retry failed operations (3 attempts with backoff)
- Continue to next account if one fails (don't stop entire workflow)
- Send email notification with error details
- Take screenshots for debugging
- Log all errors for review

**User should only need to intervene for:**
- Amazon credential changes
- Amazon UI changes (selector updates)
- Configuration changes (adding/removing accounts)

## Success Metrics

### Functional Success
- 100% of configured accounts processed daily
- 0% duplicate entries
- <1% error rate
- <10 minute execution time

### User Success
- Zero daily time investment after setup
- Complete historical data in Google Sheets
- Confidence in data accuracy
- Minimal maintenance burden

## Design Principles

1. **Set and Forget:** System should run autonomously
2. **Fail Gracefully:** One account failure shouldn't stop others
3. **Self-Documenting:** Code and logs explain what happened
4. **Maintainable:** Easy to update when Amazon changes UI
5. **Cost-Conscious:** Stay within free tier limits ($0/month)
6. **Consistent:** Follow patterns from TWSN KVP and Board Pulse projects

## Related Projects

This follows the same automation philosophy as:
- **TWSN KVP Reporting:** Email → CSV extraction → Google Sheets
- **Board Pulse:** PhantomBuster → Pipedream → OpenAI → Email

All three share:
- Pipedream orchestration
- Daily automation
- Google Sheets storage
- Duplicate detection
- Error notifications

