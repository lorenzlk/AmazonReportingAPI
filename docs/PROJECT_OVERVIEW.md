# Amazon Associates Automated Reporting - Project Overview

**Project Name**: Amazon Associates Automated Reporting  
**Date Created**: November 3, 2025  
**Status**: 🚧 In Development  
**Cost**: $0/month (Pipedream free tier)

---

## Executive Summary

This system automates the daily collection of Amazon Associates reporting data across multiple accounts. Since Amazon does not provide a reporting API, we use browser automation (Puppeteer) to scrape the dashboard, extract all available metrics, and store them in Google Sheets for historical tracking and analysis.

---

## Business Context

### The Problem
- **No API**: Amazon Associates lacks a reporting API for programmatic data access
- **Multiple Accounts**: Managing data across multiple associate accounts is time-consuming
- **Manual Work**: Daily manual data collection is inefficient and error-prone
- **Historical Tracking**: Need systematic storage of historical performance data

### The Solution
Fully automated system that:
1. Logs into Amazon Associates daily
2. Navigates between all configured accounts
3. Extracts comprehensive metrics (revenue, clicks, orders, product data)
4. Stores data in dedicated Google Sheets (one per account)
5. Runs when Amazon updates data (typically early morning)

---

## Key Stakeholders

- **Primary User**: Logan Lorenz
- **Data Analysts**: Need access to clean, historical data
- **Business Owners**: Track revenue and performance trends

---

## System Capabilities

### Data Collection
- ✅ Revenue/Earnings data
- ✅ Click-through metrics
- ✅ Order/conversion data
- ✅ Product-level performance
- ✅ All available dashboard metrics

### Multi-Account Management
- ✅ Single login for all accounts
- ✅ Automatic account switching
- ✅ Separate Google Sheet per account
- ✅ Sequential processing to avoid rate limits

### Data Storage
- ✅ Google Sheets integration
- ✅ Historical data preservation
- ✅ Duplicate detection and prevention
- ✅ Automatic sheet creation

### Automation
- ✅ Daily scheduled execution
- ✅ No manual intervention required
- ✅ Error handling and retry logic
- ✅ Failure notifications

---

## Technical Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Scraping** | Puppeteer | Browser automation for data extraction |
| **Orchestration** | Pipedream | Workflow scheduling and execution |
| **Storage** | Google Sheets | Data storage and visualization |
| **Runtime** | Node.js | Execution environment |
| **Authentication** | Env Variables | Secure credential storage |

---

## Workflow Overview

```
Daily 6am EST
     │
     ▼
┌─────────────────┐
│ Pipedream Cron  │
│  Triggers       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Launch Browser  │
│  (Puppeteer)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Login to Amazon │
│  Associates     │
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│ For Each Account │
│  ├─ Switch       │
│  ├─ Extract Data │
│  └─ Store Temp   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Process Data     │
│  ├─ Normalize    │
│  ├─ Dedupe Check │
│  └─ Format       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Update Sheets    │
│  (One per Acct)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Log Results &    │
│  Cleanup         │
└──────────────────┘
```

---

## Data Flow

### Input
- Amazon Associates credentials (env variable)
- Account list configuration (env variable)
- Google Sheets IDs (configuration file)

### Processing
- Scrape all available metrics from dashboard
- Extract product-level data
- Normalize and validate data
- Check for duplicates

### Output
- Google Sheets (one per account) with columns:
  - Date
  - Account Name
  - Revenue
  - Earnings
  - Clicks
  - Orders
  - Conversion Rate
  - Items Ordered
  - Items Shipped
  - Revenue per Click
  - Additional metrics
  - Last Updated timestamp

---

## Key Features

### 1. **Comprehensive Data Extraction**
Captures every available metric from Amazon Associates dashboard:
- Financial: Revenue, earnings, revenue per click
- Traffic: Clicks, click-through rates
- Conversions: Orders, conversion rates
- Inventory: Items ordered, items shipped
- Product-level: ASIN-level performance data

### 2. **Multi-Account Support**
- Single login handles multiple accounts
- Intelligent account switching
- Individual Google Sheet per account
- Parallel-ready architecture (sequential for safety)

### 3. **Data Integrity**
- Duplicate detection prevents data pollution
- Validation ensures data quality
- Atomic operations for consistency
- Error recovery mechanisms

### 4. **Zero-Touch Operation**
- Fully automated daily runs
- No manual intervention needed
- Self-healing retry logic
- Notification on failures

### 5. **Cost Optimization**
- $0/month operation (Pipedream free tier)
- Efficient resource usage
- Optimized scraping patterns
- Batch operations for API calls

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Daily successful runs | 100% | TBD |
| Data completeness | 100% | TBD |
| Average runtime | <10 min | TBD |
| Error rate | <1% | TBD |
| Cost | $0/month | $0/month |

---

## Project Phases

### Phase 1: Core Implementation ✅ (Current)
- [x] Project documentation
- [ ] Puppeteer scraper development
- [ ] Pipedream workflow setup
- [ ] Google Sheets integration
- [ ] Testing and validation

### Phase 2: Production Deployment
- [ ] Deploy to Pipedream
- [ ] Configure environment variables
- [ ] Set up Google Sheets
- [ ] Test end-to-end flow
- [ ] Monitor first week

### Phase 3: Optimization (Future)
- [ ] Performance tuning
- [ ] Enhanced error handling
- [ ] Email summaries
- [ ] Data visualization
- [ ] Anomaly detection

---

## Risks & Mitigations

### High-Priority Risks

1. **Amazon UI Changes**
   - **Impact**: High (breaks scraper)
   - **Probability**: Medium
   - **Mitigation**: Modular selectors, monitoring, quick fixes

2. **Rate Limiting**
   - **Impact**: Medium (delays/failures)
   - **Probability**: Low
   - **Mitigation**: Sequential processing, delays, respectful scraping

3. **Session Timeouts**
   - **Impact**: Medium (incomplete data)
   - **Probability**: Medium
   - **Mitigation**: Session refresh, quick processing

### Medium-Priority Risks

4. **Puppeteer Timeouts**
   - **Impact**: Medium
   - **Probability**: Medium
   - **Mitigation**: Generous timeouts, retry logic

5. **Google Sheets API Limits**
   - **Impact**: Low
   - **Probability**: Low
   - **Mitigation**: Batch operations, stay within quotas

---

## Dependencies

### External Services
- ✅ Amazon Associates account access (no 2FA)
- ✅ Google Workspace account
- ✅ Pipedream account (free tier)

### Technical Dependencies
- Node.js (provided by Pipedream)
- Puppeteer library
- Google Sheets API
- Environment variable storage

---

## Timeline

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Documentation Complete | Nov 3, 2025 | 🔄 In Progress |
| Scraper Development | Nov 4, 2025 | ⏳ Pending |
| Pipedream Setup | Nov 5, 2025 | ⏳ Pending |
| Testing | Nov 6, 2025 | ⏳ Pending |
| Production Launch | Nov 7, 2025 | ⏳ Pending |

---

## Related Projects

This project follows the pattern of other successful automation projects:

1. **TWSN KVP Reporting** [[memory:10672297]]
   - Similar: Automated data extraction and Google Sheets storage
   - Pattern: Pipedream orchestration, duplicate detection

2. **Board Pulse** [[memory:9666302]]
   - Similar: Scheduled automation, data processing
   - Pattern: Daily runs, email notifications

---

## Next Steps

1. ✅ Complete documentation (this file + others)
2. ⏳ Develop Puppeteer scraper
3. ⏳ Build Pipedream workflow
4. ⏳ Test with real accounts
5. ⏳ Deploy to production

---

**Questions or Issues?**  
See [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) and [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

---

**Project Owner**: Logan Lorenz  
**Last Updated**: November 3, 2025

