# Timeout Settings for Multi-Account Scraper

## Recommended Timeout: **7-10 minutes (420-600 seconds)**

## Why?

Your scraper processes:
- **9 Tracking IDs** across **4 Store IDs**
- Each account requires:
  - Store ID switching (~5-10 seconds)
  - Tracking ID switching (~3-5 seconds)
  - Page navigation (~2-3 seconds)
  - Data extraction (~2-3 seconds)
  - Delays between operations (~2-5 seconds)

**Estimated time per Tracking ID**: 15-30 seconds  
**Total estimated time**: 9 × 20 seconds = **~3 minutes minimum**  
**With safety buffer**: **5-7 minutes recommended**

## How to Set Timeout in Pipedream

### For the Multi-Account Scraper Step:

1. **Click on Step 1** (Multi-Account Scraper)
2. **Click the gear icon** ⚙️ or settings
3. **Find "Timeout"** setting
4. **Set to**: `600` seconds (10 minutes) or `420` seconds (7 minutes)
5. **Save**

### Alternative: In Workflow Settings

1. **Click gear icon** ⚙️ at top of workflow
2. **Go to "Settings"** or "Configuration"
3. **Find "Step Timeout"** or "Execution Timeout"
4. **Set to**: `600` seconds (10 minutes)
5. **Save**

## Timeout Recommendations by Account Count

| Accounts | Recommended Timeout |
|----------|---------------------|
| 1-3 Tracking IDs | 2-3 minutes (120-180s) |
| 4-6 Tracking IDs | 4-5 minutes (240-300s) |
| 7-9 Tracking IDs | 7-10 minutes (420-600s) |
| 10+ Tracking IDs | 10-15 minutes (600-900s) |

## Current Setup

You have **9 Tracking IDs**, so:
- **Minimum**: 5 minutes (300 seconds)
- **Recommended**: 7-10 minutes (420-600 seconds)
- **Safe**: 10 minutes (600 seconds)

## Troubleshooting

### If still timing out:
1. **Increase to 10 minutes** (600 seconds)
2. **Check logs** - see which account it's stuck on
3. **Reduce delays** in code (if needed)
4. **Split into multiple workflows** (one per Store ID)

### If completing too quickly:
- You can reduce timeout, but keep at least 5 minutes for safety

## Paid Account Limits

With a paid Pipedream account:
- **Free tier**: 60 seconds max
- **Paid tier**: Up to 15 minutes (900 seconds) per step
- **Recommended**: 7-10 minutes for your use case

