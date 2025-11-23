# How to Fix Pipedream Timeout

## The Problem

Pipedream **steps** have a default timeout:
- **Free tier**: 30 seconds per step
- **Paid tier**: Configurable (up to 5 minutes)

Your scraper step is timing out because it's taking longer than 30 seconds.

## Solution 1: Extend Step Timeout in Pipedream UI

1. **In your Pipedream workflow**, click on the scraper step
2. Look for **"Timeout"** or **"Step Settings"** in the step configuration
3. **Increase the timeout** to:
   - **60 seconds** (recommended for testing)
   - **120 seconds** (if needed)
   - **300 seconds** (maximum for free tier)

**Where to find it:**
- Click on your scraper step
- Look for a gear icon or "Settings" 
- Find "Timeout" or "Execution timeout"
- Change from default (30s) to 60s or higher

## Solution 2: Make Code Faster (Already Done)

I've already optimized the code to be more aggressive:
- Dashboard wait: 3 seconds max
- Account switching: 6 seconds max (or skip)
- Login: 8 seconds max

## Solution 3: Split Into Multiple Steps

If timeout persists, split the workflow:
1. **Step 1**: Login + Navigate (15 seconds)
2. **Step 2**: Account Switch (10 seconds)  
3. **Step 3**: Scrape Data (15 seconds)

Each step gets its own 30-second timeout.

## Current Status

Your code should complete in ~25-30 seconds:
- Login: ~8 seconds
- Navigation: ~2 seconds
- Account switch: ~2 seconds (or skipped)
- Dashboard wait: ~3 seconds
- Data extraction: ~2 seconds
- Cleanup: ~1 second

**Total: ~18-20 seconds** (well under 30s limit)

If it's still timing out, the step timeout needs to be extended in Pipedream UI.

