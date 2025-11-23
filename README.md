# Amazon Associates Automated Reporting

Automated daily scraping and reporting system for Amazon Associates accounts.

## Overview

This system automatically:
- 🤖 Scrapes Amazon Associates dashboard data daily
- 📊 Extracts all available metrics (revenue, clicks, orders, product performance)
- 📈 Outputs to dedicated Google Sheets (one per account)
- 🔄 Handles multiple accounts via account switching
- ⏰ Runs when Amazon updates data (typically early morning EST)

## Key Features

- **Complete Data Extraction**: Revenue, earnings, clicks, conversions, product-level performance, orders
- **Multi-Account Support**: Toggle between accounts within single login session
- **Google Sheets Integration**: One sheet per account with historical tracking
- **Duplicate Detection**: Prevents duplicate entries using date + account identifiers
- **Automated Scheduling**: Runs daily when Amazon publishes fresh data
- **Zero-Cost Operation**: Runs on Pipedream's free tier

## Tech Stack

- **Puppeteer**: Headless browser automation for scraping
- **Pipedream**: Workflow orchestration and scheduling
- **Google Sheets API**: Data storage and historical tracking
- **Node.js**: Runtime environment

## Quick Start

1. See [SETUP_CHECKLIST.md](./docs/SETUP_CHECKLIST.md) for step-by-step setup
2. Review [PRD.md](./docs/PRD.md) for detailed requirements
3. Check [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system design
4. Use [IMPLEMENTATION_GUIDE.md](./docs/IMPLEMENTATION_GUIDE.md) for deployment

## Project Structure

```
/AA Reporting
├── README.md                          # This file
├── docs/
│   ├── INDEX.md                       # Documentation index
│   ├── PRD.md                         # Product requirements
│   ├── ARCHITECTURE.md                # System architecture
│   ├── SETUP_CHECKLIST.md             # Setup instructions
│   ├── IMPLEMENTATION_GUIDE.md        # Implementation details
│   └── PROJECT_OVERVIEW.md            # High-level overview
├── src/
│   ├── scraper/
│   │   ├── amazon-associates-scraper.js   # Main scraper
│   │   ├── account-switcher.js            # Account navigation
│   │   ├── data-extractors.js             # Data extraction utilities
│   │   └── config.js                      # Scraper configuration
│   ├── pipedream/
│   │   ├── workflow-template.js           # Main workflow
│   │   └── google-sheets-updater.js       # Sheets integration
│   └── utils/
│       ├── duplicate-detector.js          # Duplicate detection
│       └── date-utils.js                  # Date helpers
├── config/
│   ├── accounts.example.json          # Account configuration template
│   └── sheets-mapping.example.json    # Sheet mapping template
└── package.json                       # Dependencies
```

## Documentation

All documentation is in the `/docs` folder. Start with [INDEX.md](./docs/INDEX.md).

## Cost

**$0/month** - Runs entirely on Pipedream's free tier

## Support

For issues or questions, refer to the documentation in `/docs` or check the implementation guide.

---

**Status**: 🚧 In Development
**Last Updated**: November 3, 2025

