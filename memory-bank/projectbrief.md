# Amazon Associates Automated Reporting - Project Brief

**Date Created:** November 3, 2025  
**Status:** ✅ Complete - Ready for Implementation  
**Cost:** $0/month

---

## Project Overview

Automated daily scraping and reporting system for multiple Amazon Associates accounts. Amazon Associates does not provide a reporting API, so we need a scraping solution to access reports programmatically.

## Core Requirements

### Data Access
- Extract ALL available data from Amazon Associates dashboard:
  - Revenue & Earnings
  - Click-through data
  - Product performance
  - Orders & conversions
  - Any other available metrics

### Multi-Account Support
- Single login with ability to toggle between accounts
- Process multiple accounts sequentially
- One Google Sheet output per account

### Automation
- Run automatically when Amazon updates data (daily, early morning)
- No manual intervention required
- Error notifications on failures

### Data Storage
- Output to Google Sheets (one per account)
- Prevent duplicate entries
- Historical data tracking

## Technical Approach

**Stack:**
- Puppeteer for browser automation (Amazon doesn't have API)
- Pipedream for workflow orchestration and scheduling
- Google Sheets API for data storage
- Node.js runtime environment

**Architecture:**
- Daily cron trigger at 6am EST
- Headless browser scraping
- Sequential account processing with delays
- Duplicate detection using date + account ID
- Retry logic for resilience

## Success Criteria

- ✅ Workflow runs daily without manual intervention
- ✅ Data extracted from all configured accounts
- ✅ Data stored in correct Google Sheets
- ✅ No duplicate entries
- ✅ Handles errors gracefully
- ✅ Completes within acceptable timeframe (<10 minutes)
- ✅ $0/month cost (Pipedream free tier)

## Constraints

- No 2FA support (Amazon accounts cannot have 2FA enabled)
- Sequential processing only (to avoid rate limiting)
- Pipedream free tier timeout: 300 seconds
- Amazon UI selectors may change (requires maintenance)

## Current Status

**Implementation:** Complete  
**Testing:** Pending  
**Production:** Not deployed

Project includes:
- Complete codebase (scraper, workflow, utilities)
- Comprehensive documentation (9 documents)
- Configuration templates
- Setup guides

**Next Step:** User needs to update placeholder selectors with actual Amazon Associates dashboard selectors before deployment.

