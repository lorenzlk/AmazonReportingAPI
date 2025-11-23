# Monitoring Guide

How to monitor and maintain the Amazon Associates Automated Reporting system.

---

## Daily Monitoring

### Quick Health Check (1 minute)

**Morning Checklist:**

1. **Check Pipedream**
   - Open: https://pipedream.com/workflows
   - Verify last execution: ✅ Success
   - Check execution time: Should be ~5-10 min

2. **Check Google Sheets**
   - Open each account's sheet
   - Verify today's date appears
   - Spot check: Numbers look reasonable

3. **Email Notifications**
   - Check for error emails
   - No email = success

**What to Look For:**

✅ **Healthy System:**
- Green checkmark in Pipedream
- Today's date in all sheets
- Data values are non-zero
- Execution time consistent

⚠️ **Needs Attention:**
- Yellow warning in Pipedream
- Missing data in some accounts
- Data values seem off
- Execution time suddenly increased

❌ **Critical Issue:**
- Red error in Pipedream
- No data in any sheets
- Login failure
- Timeout errors

---

## Weekly Review

### Performance Check (5 minutes)

**Every Monday:**

1. **Execution History**
   ```
   - Open Pipedream workflow
   - Click "Executions" tab
   - Review last 7 days
   - Look for patterns in errors
   ```

2. **Data Completeness**
   ```
   - Open Google Sheets
   - Check for any missing dates
   - Verify all accounts have data
   - Look for unusual spikes/drops
   ```

3. **Error Log Review**
   ```
   - Filter executions by "Failed"
   - Review error messages
   - Check if errors are recurring
   - Take action if needed
   ```

**Metrics to Track:**

| Metric | Target | Action If Off |
|--------|--------|---------------|
| Success Rate | >98% | Investigate errors |
| Avg Execution Time | <10 min | Optimize code |
| Data Completeness | 100% | Check for bugs |
| Duplicate Rate | 0% | Fix detection logic |

---

## Monthly Maintenance

### Deep Dive (30 minutes)

**First Monday of Month:**

1. **Performance Analysis**
   - Average execution time trend
   - Success rate over time
   - Data volume trends

2. **Code Review**
   - Check for Amazon UI changes
   - Review error patterns
   - Update selectors if needed

3. **Dependency Updates**
   - Check for Puppeteer updates
   - Review Node.js version
   - Update packages if safe

4. **Documentation Review**
   - Update any changed processes
   - Add new troubleshooting tips
   - Refine procedures

---

## Monitoring Dashboards

### Pipedream Dashboard

**URL:** `https://pipedream.com/workflows/[YOUR_WORKFLOW_ID]`

**Key Metrics:**
- Execution count (last 7 days)
- Success rate
- Average runtime
- Error count

**Charts to Monitor:**
- Execution timeline
- Error rate trend
- Runtime distribution

### Google Sheets Dashboard (Optional)

Create a summary sheet to track:

```
=================================
AMAZON ASSOCIATES - SUMMARY
=================================

Last Update: [AUTO]
Total Accounts: 3

Account Status:
- Account 1: ✓ Last update 2025-11-03
- Account 2: ✓ Last update 2025-11-03
- Account 3: ✓ Last update 2025-11-03

Daily Totals (Yesterday):
- Revenue: $X,XXX.XX
- Clicks: X,XXX
- Orders: XXX

Week-over-Week:
- Revenue: +X%
- Clicks: +X%
- Conversion: X.X%
```

**Formula Examples:**

```excel
// Last update date
=MAX(Sheet1!A:A)

// Total revenue (yesterday)
=SUMIF(Sheet1!A:A, TODAY()-1, Sheet1!C:C)

// Week over week change
=(SUM(last_7_days) - SUM(previous_7_days)) / SUM(previous_7_days)
```

---

## Alerts & Notifications

### Set Up Alerts

**Critical Errors (Immediate):**
- Login failure
- All accounts failed
- Workflow disabled

**Warning (Daily Digest):**
- Single account failed
- Slow execution (>10 min)
- Duplicate detected

**Info (Weekly):**
- Summary statistics
- Performance trends

### Alert Channels

1. **Email** (Default)
   - Configure in Pipedream
   - Step 7 of workflow
   - Only on errors

2. **Slack** (Optional)
   - Add Slack action in Pipedream
   - Send to #monitoring channel
   - Include error details

3. **Discord** (Optional)
   - Add Discord webhook
   - Post to bot channel

**Example Alert Setup:**

```javascript
// Pipedream step
if (workflow.failed) {
  await $.slack.send({
    channel: "#alerts",
    text: `🚨 Amazon Associates Scraper Failed\n
    Date: ${new Date().toISOString()}
    Accounts Failed: ${failedCount}
    Error: ${errorMessage}
    `
  });
}
```

---

## Key Performance Indicators (KPIs)

### Reliability KPIs

| KPI | Target | Current | Status |
|-----|--------|---------|--------|
| Uptime | 99%+ | TBD | 📊 |
| Data Completeness | 100% | TBD | 📊 |
| Error Rate | <1% | TBD | 📊 |
| Average Execution Time | <10 min | TBD | 📊 |

### Data Quality KPIs

| KPI | Target | Current | Status |
|-----|--------|---------|--------|
| Duplicate Rate | 0% | TBD | 📊 |
| Missing Fields | 0% | TBD | 📊 |
| Data Freshness | Same day | TBD | 📊 |
| Accuracy vs Manual | 100% | TBD | 📊 |

### Operational KPIs

| KPI | Target | Current | Status |
|-----|--------|---------|--------|
| Manual Interventions | <1/month | TBD | 📊 |
| Time to Recovery | <1 hour | TBD | 📊 |
| Maintenance Time | <30 min/month | TBD | 📊 |

---

## Troubleshooting Workflow

```
Issue Detected
    │
    ▼
Check Pipedream Logs
    │
    ├─ Login Failed → Check credentials
    ├─ Timeout → Optimize or split workflow
    ├─ Scraping Error → Update selectors
    └─ Sheets Error → Check permissions
    │
    ▼
Fix Issue
    │
    ▼
Test Manually
    │
    ▼
Deploy Fix
    │
    ▼
Monitor Next Run
    │
    ▼
Document Issue & Fix
```

---

## Maintenance Calendar

### Daily
- [ ] Quick health check (1 min)
- [ ] Review error notifications

### Weekly  
- [ ] Review execution history
- [ ] Check data completeness
- [ ] Analyze error patterns

### Monthly
- [ ] Performance deep dive
- [ ] Update dependencies
- [ ] Review and update documentation
- [ ] Test disaster recovery

### Quarterly
- [ ] Full system audit
- [ ] Security review
- [ ] Cost optimization
- [ ] Feature roadmap review

---

## Logging Best Practices

### What to Log

**Always Log:**
- Start/end of workflow
- Account being processed
- Errors and warnings
- Execution summary

**Debug Logging (Optional):**
- Page URLs visited
- Elements found/not found
- Data extracted
- API responses

**Never Log:**
- Credentials
- Full HTML content
- Large binary data

### Log Levels

```javascript
console.log('✓ Success: ...') // Success
console.warn('⚠ Warning: ...') // Warning
console.error('✗ Error: ...') // Error
console.debug('🔍 Debug: ...') // Debug
```

### Log Format

```javascript
// Structured logging
{
  timestamp: '2025-11-03T06:00:00Z',
  level: 'info',
  component: 'scraper',
  account: 'account-1',
  message: 'Data extraction completed',
  duration: 45.2,
  recordCount: 1
}
```

---

## Backup & Recovery

### Data Backup

**Google Sheets (Auto-backed up):**
- Google Drive version history
- 30 days of revisions
- Manual export weekly (optional)

**Configuration Backup:**
- Keep copy of `accounts.json`
- Save Pipedream workflow export
- Document environment variables

### Recovery Procedures

**If Workflow Deleted:**
1. Create new workflow
2. Re-copy code from repo
3. Re-configure environment variables
4. Re-connect Google Sheets
5. Test execution

**If Sheets Corrupted:**
1. Restore from Google Drive version history
2. Or: Re-run scraper for missing dates
3. Verify data integrity

**If Credentials Compromised:**
1. Change Amazon password immediately
2. Update AMAZON_PASSWORD in Pipedream
3. Test login
4. Monitor for suspicious activity

---

## Support Contacts

**Primary:** Logan Lorenz  
**Documentation:** `/docs` folder  
**Pipedream Support:** https://pipedream.com/support  
**Amazon Associates Support:** https://affiliate-program.amazon.com/help

---

**Last Updated:** November 3, 2025

