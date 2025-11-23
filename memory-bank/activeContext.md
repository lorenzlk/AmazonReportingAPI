# Active Context - Amazon Associates Automated Reporting

**Last Updated:** November 22, 2025  
**Current Phase:** Store ID Workflow Implementation  
**Next Major Milestone:** Deploy 4 Separate Workflows (One Per Store ID)

---

## Current Work Focus

### 🚀 IN PROGRESS: Store ID-Based Workflow Implementation

**Status:** 🚧 Implementation Phase  
**Priority:** High - Started November 22, 2025

**New Architecture: Separate Workflow Per Store ID**

**Key Changes:**
- ✅ Moved from single multi-account workflow to 4 separate workflows
- ✅ Each workflow processes one Store ID independently
- ✅ Scalable: Add Tracking IDs to config, no workflow changes needed
- ✅ Reliable: One failure doesn't affect others
- ✅ Fast: Each workflow runs 2-3 minutes (vs 10+ minutes for all)
- ✅ Parallel execution: All workflows can run simultaneously

**Files Created:**
- `pipedream-single-store-scraper.js` - Scraper for one Store ID
- `pipedream-google-sheets-single-store.js` - Google Sheets writer
- `STORE_ID_WORKFLOW_SETUP.md` - Setup guide

**Current Store IDs:**
1. `mula09a-20` → 1 Tracking ID
2. `bm01f-20` → 1 Tracking ID
3. `tag0d1d-20` → 6 Tracking IDs
4. `usmagazine05-20` → 1 Tracking ID

**Features:**
- ✅ Automatic "yesterday" date selection (default)
- ✅ Configurable date: "yesterday", "today", or YYYY-MM-DD
- ✅ Connection recovery and reconnection logic
- ✅ Automatic tab creation in Google Sheets
- ✅ Update existing rows (handles retroactive data changes)

---

## Recent Changes

### November 22, 2025 - Store ID Workflow Architecture 🎉

**MAJOR ARCHITECTURE CHANGE - Separate Workflows Per Store ID:**

**Why the Change:**
- Single workflow was timing out (10+ minutes for 9 Tracking IDs)
- Connection issues affecting all accounts
- Hard to debug which Store ID failed
- Not scalable as Tracking IDs grow

**New Architecture:**
- ✅ 4 separate workflows (one per Store ID)
- ✅ Each workflow processes 1-6 Tracking IDs (2-3 minutes)
- ✅ Can run in parallel (faster overall)
- ✅ Isolated failures (one Store ID failure doesn't affect others)
- ✅ Easy to add new Tracking IDs (just update config)

**Implementation:**
- ✅ Created `pipedream-single-store-scraper.js` with Store ID prop
- ✅ Created `pipedream-google-sheets-single-store.js` for results
- ✅ Added "yesterday" date selection (default)
- ✅ Improved connection recovery logic
- ✅ Added comprehensive setup guide

**Next Steps:**
- Create 4 workflows in Pipedream
- Configure each with Store ID prop
- Test each workflow individually
- Enable scheduling

### November 3, 2025 - Selector Updates Complete! 🎉

**MAJOR MILESTONE - Real Selectors Extracted:**
- ✅ Inspected live Amazon Associates dashboard
- ✅ Extracted all critical selectors using DevTools
- ✅ Updated selectors with real Amazon UI elements:
  - Dashboard container: `#a-page > div:nth-child(4) > div.ac-page...`
  - Account switcher: `#a-autoid-0-announce`
  - Account options: `#menu-tab-store-id-picker_{1,2,3...}`
  - Metrics: `#ac-report-commission-commision-{clicks,ordered,shipped,etc}`
  - Total earnings: `#ac-report-commission-commision-total`
  - Conversion rate: `#ac-report-commission-commision-conversion`

### November 3, 2025 - Initial Build

**Completed:**
- ✅ Full project structure created
- ✅ All documentation written (9 documents)
- ✅ Complete scraper implementation
- ✅ Pipedream workflow template
- ✅ Google Sheets integration
- ✅ Duplicate detection logic
- ✅ Configuration templates
- ✅ Error handling & retry logic
- ✅ Memory bank setup
- ✅ Memory created in AI system

**Files Created:**
- Documentation: README.md, QUICKSTART.md, PROJECT_SUMMARY.md, 8 docs files
- Code: 8 source files (scraper, workflow, utilities)
- Config: package.json, env.example, accounts.example.json, sheets-mapping.example.json
- Infrastructure: .gitignore, memory-bank/

---

## Next Steps

### Immediate (Current Phase)

1. **Create 4 Pipedream Workflows** (IN PROGRESS)
   - Workflow 1: "Amazon Associates - mula09a-20"
   - Workflow 2: "Amazon Associates - bm01f-20"
   - Workflow 3: "Amazon Associates - tag0d1d-20"
   - Workflow 4: "Amazon Associates - usmagazine05-20"

2. **Configure Each Workflow**
   - Add Cron trigger (6am daily)
   - Add scraper step (copy `pipedream-single-store-scraper.js`)
   - Set Store ID prop for each workflow
   - Connect Browserless app
   - Set timeout to 3 minutes (180 seconds)
   - Add Google Sheets step (copy `pipedream-google-sheets-single-store.js`)
   - Connect Google Sheets app

3. **Test Each Workflow**
   - Run manual test for each
   - Verify data appears in Google Sheets
   - Check for errors
   - Verify date is "yesterday"

4. **Enable Scheduling**
   - Set all workflows to run at 6am EST daily
   - Monitor first few runs
   - Adjust timeouts if needed

### Short-term (First Week)

5. **Deploy to Production**
   - Enable cron schedule
   - Monitor first runs
   - Verify daily execution

6. **Monitor & Adjust**
   - Watch for errors
   - Fine-tune timeouts if needed
   - Adjust delays if rate limited

### Long-term (Future)

7. **Optimize** (Optional)
   - Add email summaries
   - Implement anomaly detection
   - Create visualization dashboard

---

## Active Decisions & Considerations

### Architecture Decisions

**Sequential vs. Parallel Processing**
- Decision: Sequential
- Rationale: Safer for rate limiting, simpler error handling
- Trade-off: Slower but more reliable

**Puppeteer vs. Playwright**
- Decision: Puppeteer
- Rationale: More mature, better Pipedream support, team familiarity
- Note: Could switch to Playwright later if needed

**Google Sheets vs. Database**
- Decision: Google Sheets
- Rationale: Simplicity, familiarity, built-in visualization, no hosting costs
- Trade-off: Not ideal for massive datasets, but sufficient for this use case

**Pipedream vs. Custom Server**
- Decision: Pipedream
- Rationale: $0 cost, managed infrastructure, consistency with other projects
- Trade-off: 300-second timeout on free tier (acceptable for current scale)

### Implementation Choices

**Duplicate Detection Approach**
- Method: Compare date + account name in last N rows
- Why: Simple, efficient, catches accidental reruns
- Alternative considered: SHA hash of entire row (rejected as overkill)

**Error Handling Philosophy**
- Approach: Fail gracefully, continue to next account
- Why: One account failure shouldn't stop entire workflow
- Implementation: Try-catch blocks around account processing loops

**Retry Logic**
- Strategy: 3 retries with 5-second delay
- Applied to: Login, account switching, data extraction
- Not applied to: Google Sheets operations (use Pipedream built-in retry)

---

## Important Patterns & Preferences

### Code Patterns

**Async/Await Throughout**
```javascript
async function scrapeAccount(page, accountId) {
  try {
    await page.goto(url);
    const data = await extractData(page);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

**Retry Wrapper Pattern**
```javascript
await withRetry(async () => {
  return await riskyOperation();
}, maxRetries, delay);
```

**Safe Element Selection**
```javascript
const element = await page.$(selector);
if (!element) {
  console.warn('Element not found');
  return defaultValue;
}
```

### Logging Standards

**Consistent Symbols:**
- `✓` or `✅` for success
- `✗` or `❌` for errors  
- `⚠` for warnings
- `🔍` for debug info

**Structured Messages:**
```javascript
console.log(`[${accountName}] ${action}: ${details}`);
```

### Configuration Management

**Environment Variables Pattern:**
- All secrets in env vars
- Use SCREAMING_SNAKE_CASE
- Provide .example files
- Never commit actual secrets

**Config File Pattern:**
- Separate example files (.example.json)
- User copies and customizes
- Add to .gitignore

---

## Learnings & Project Insights

### What Worked Well

1. **Modular Architecture:** Separating scraper, account switcher, and data extractors makes debugging easier
2. **Comprehensive Documentation:** Following TWSN/Board Pulse pattern of thorough docs
3. **Configuration Flexibility:** Supporting both comma-separated and JSON account configs
4. **Error Handling First:** Building retry and error handling from the start

### What to Watch

1. **Selector Brittleness:** Amazon UI changes will break scraper - monitor regularly
2. **Rate Limiting:** May need to adjust delays if Amazon detects automation
3. **Timeout Risk:** Multiple accounts could exceed 300-second Pipedream limit
4. **Screenshot Storage:** Screenshots on errors could accumulate (add cleanup)

### Open Questions

1. **Captcha Risk:** Will Amazon show captchas? May need initial manual login
2. **Session Duration:** How long do Amazon sessions last? May need refresh logic
3. **Product Data Value:** Is product-level extraction worth the extra time?
4. **Execution Time:** How long does real scraping take per account?

These will be answered during first production runs.

---

## Context for AI Assistants

When continuing work on this project:

1. **Always read projectbrief.md first** for foundation
2. **Check this file** for current status and blockers
3. **Review systemPatterns.md** for architecture decisions
4. **Check progress.md** for what's implemented vs. pending
5. **Selector updates are the critical path** before any testing

The project is **complete but untested** because selectors are placeholders. Once selectors are updated, this moves from "implementation complete" to "testing phase."

---

## Quick Reference

**Key Files:**
- Main scraper: `src/scraper/amazon-associates-scraper.js`
- Config: `src/scraper/config.js` ⚠️ NEEDS UPDATES
- Workflow: `src/pipedream/workflow-template.js`
- Setup: `QUICKSTART.md` (user guide)

**Key Commands:**
- Local test: `node src/scraper/amazon-associates-scraper.js`
- Install deps: `npm install`

**Blockers:**
- ⚠️ Selector updates (user action required)
- Google Sheet creation (user action required)
- Pipedream configuration (user action required)

