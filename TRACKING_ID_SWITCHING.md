# Tracking ID Switching Guide

## The Challenge

Amazon Associates has two levels:
1. **Store ID** (account switcher dropdown) - We can switch this ✅
2. **Tracking ID** (filter on reports page) - Need to find selector ⚠️

## How to Find Tracking ID Selector

1. **Log into Amazon Associates manually**
2. **Navigate to**: https://affiliate-program.amazon.com/p/reporting/earnings
3. **Switch to a Store ID** that has multiple Tracking IDs (e.g., `tag0d1d-20`)
4. **Look for the Tracking ID filter/dropdown** on the reports page
5. **Inspect it with DevTools** (F12) to find the selector
6. **Common locations**:
   - Top of page near date range selector
   - Filter dropdown
   - May be labeled "Tracking ID" or "All Tracking IDs"

## What We Need

Once we find the selector, we'll add code to:
1. Click the Tracking ID dropdown
2. Select the specific Tracking ID
3. Wait for page to filter
4. Scrape the filtered data

## Current Status

- ✅ Store ID switching works
- ⚠️ Tracking ID switching - **NEEDS SELECTOR**

## Next Steps

1. Inspect the reports page to find Tracking ID selector
2. Update scraper with the selector
3. Test with a Store ID that has multiple Tracking IDs

