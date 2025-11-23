# Product Requirements Document: Amazon Associates Automated Reporting

**Version**: 1.0  
**Date**: November 3, 2025  
**Status**: In Development

---

## 1. Overview

### 1.1 Purpose
Automate the daily extraction of reporting data from multiple Amazon Associates accounts and store the data in dedicated Google Sheets for analysis and historical tracking.

### 1.2 Problem Statement
- Amazon Associates does not provide a reporting API
- Manual data extraction is time-consuming across multiple accounts
- Need consistent, automated access to all available metrics
- Require historical data tracking for trend analysis

### 1.3 Solution
Build an automated scraping system using Puppeteer and Pipedream that:
- Logs into Amazon Associates dashboard
- Navigates between multiple accounts
- Extracts all available metrics
- Stores data in Google Sheets (one per account)
- Runs daily when Amazon updates data

---

## 2. Requirements

### 2.1 Functional Requirements

#### FR-1: Authentication & Access
- **FR-1.1**: System must log into Amazon Associates using stored credentials
- **FR-1.2**: Must handle session management for multiple accounts
- **FR-1.3**: Must toggle between accounts within a single login session
- **FR-1.4**: No 2FA support needed (accounts do not have 2FA enabled)

#### FR-2: Data Extraction
- **FR-2.1**: Must extract all available metrics from Amazon Associates dashboard:
  - Revenue/Earnings
  - Clicks (click-through data)
  - Conversions/Orders
  - Product performance data
  - Conversion rates
  - Any other available metrics
- **FR-2.2**: Must extract data at the most granular level available
- **FR-2.3**: Must capture date/timestamp for each data point
- **FR-2.4**: Must identify which account each data point belongs to

#### FR-3: Data Storage
- **FR-3.1**: Must create/use one Google Sheet per Amazon Associates account
- **FR-3.2**: Must append new data to existing sheets
- **FR-3.3**: Must detect and prevent duplicate entries
- **FR-3.4**: Must maintain data integrity across runs

#### FR-4: Scheduling & Automation
- **FR-4.1**: Must run automatically on a daily schedule
- **FR-4.2**: Should run when Amazon updates data (typically early morning EST)
- **FR-4.3**: Must handle failures gracefully and retry if needed
- **FR-4.4**: Should send notifications on errors

#### FR-5: Multi-Account Support
- **FR-5.1**: Must support unlimited number of accounts
- **FR-5.2**: Must process accounts sequentially to avoid rate limiting
- **FR-5.3**: Must track which accounts have been processed
- **FR-5.4**: Must handle account-switching UI navigation

### 2.2 Non-Functional Requirements

#### NFR-1: Performance
- Complete scraping of all accounts within 15 minutes
- Minimize API calls to Google Sheets
- Efficient memory usage during scraping

#### NFR-2: Reliability
- 99% uptime for scheduled runs
- Automatic retry on transient failures
- Robust error handling and logging

#### NFR-3: Security
- Credentials stored securely in Pipedream environment variables
- No credentials in code or logs
- Secure communication with Amazon and Google APIs

#### NFR-4: Maintainability
- Well-documented code
- Modular architecture for easy updates
- Clear error messages and logging

#### NFR-5: Cost
- Target: $0/month (Pipedream free tier)
- Acceptable: Up to $10/month if needed

---

## 3. User Stories

### US-1: Daily Data Collection
**As a** data analyst  
**I want** Amazon Associates data automatically collected daily  
**So that** I can analyze trends without manual work

### US-2: Multi-Account Management
**As a** account manager  
**I want** data from all my Amazon Associates accounts in separate sheets  
**So that** I can compare performance across accounts

### US-3: Historical Tracking
**As a** business owner  
**I want** historical data preserved in Google Sheets  
**So that** I can track long-term performance trends

### US-4: Error Notification
**As a** system administrator  
**I want** to be notified when scraping fails  
**So that** I can fix issues before data gaps occur

---

## 4. Technical Specifications

### 4.1 Data Points to Extract

From Amazon Associates Dashboard:
- Date
- Account ID/Name
- Total Revenue/Earnings
- Total Clicks
- Total Orders
- Conversion Rate
- Items Ordered
- Items Shipped
- Revenue per Click
- Product-level data (if available):
  - Product ASIN
  - Product Name
  - Clicks per product
  - Orders per product
  - Revenue per product

### 4.2 Google Sheets Structure

Each account's sheet should have columns:
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
- [Additional metrics as discovered]
- Last Updated (timestamp)

### 4.3 Duplicate Detection Logic

Unique key: `Date + Account ID`
- Check if record already exists before inserting
- Update existing record if found (for data corrections)

---

## 5. Success Criteria

1. ✅ Successfully logs into Amazon Associates
2. ✅ Extracts data from all configured accounts
3. ✅ Stores data in correct Google Sheets
4. ✅ Runs daily without manual intervention
5. ✅ No duplicate data entries
6. ✅ Handles errors gracefully
7. ✅ Completes within acceptable time frame
8. ✅ Costs $0/month (or minimal cost)

---

## 6. Future Enhancements

### Phase 2 (Optional)
- Email summaries with daily highlights
- Anomaly detection (unusual drops/spikes)
- Multi-user access to sheets
- Data visualization dashboard
- Slack/Discord notifications
- Historical data comparison reports

---

## 7. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Amazon changes UI | High | Medium | Modular selectors, regular monitoring |
| Rate limiting | Medium | Low | Sequential processing, delays between accounts |
| Session timeout | Medium | Medium | Session refresh logic |
| Puppeteer timeouts | Medium | Medium | Increased timeouts, retry logic |
| Google Sheets API limits | Low | Low | Batch operations, stay within quotas |

---

## 8. Assumptions

1. Amazon Associates dashboard structure remains relatively stable
2. All accounts use same credentials (single login)
3. Data updates daily (early morning EST)
4. Google Sheets API access is available
5. Pipedream can run Puppeteer (or alternative browser automation)

---

## 9. Dependencies

- Amazon Associates account access
- Google Workspace account with Sheets API access
- Pipedream account
- Node.js environment (provided by Pipedream)

---

**Approved By**: Logan Lorenz  
**Next Steps**: Review [ARCHITECTURE.md](./ARCHITECTURE.md) for technical design

