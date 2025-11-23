# Data Tracking Strategy for Amazon Associates

## The Problem

Amazon Associates data can change retroactively:
- **Returns**: Items returned after shipping
- **Cancellations**: Orders cancelled before shipping
- **Adjustments**: Amazon makes corrections to earnings
- **Delayed reporting**: Some data appears days/weeks later

This means the numbers you see today for "Nov 22" might be different tomorrow.

## Solution: Update Existing Rows

Instead of creating duplicate rows, we **UPDATE** existing rows for the same date.

### How It Works

1. **Check if row exists** for Date + Account Name
2. **If exists**: UPDATE the row with latest data
3. **If new**: INSERT a new row

This ensures:
- ✅ One row per day per account
- ✅ Always has the latest/corrected values
- ✅ Can track when data was last scraped
- ✅ Day-over-day comparisons are accurate

## Sheet Structure

Updated headers (add "Scraped Date" column):

| Date | Account Name | Revenue | Earnings | Clicks | Orders | Conversion Rate | Items Ordered | Items Shipped | Revenue Per Click | Scraped Date | Last Updated |
|------|--------------|---------|----------|--------|--------|-----------------|---------------|---------------|-------------------|--------------|--------------|
| 2025-11-22 | mula09a-20 | 51.56 | 0.52 | 9 | 7 | 77.78 | 7 | 3 | 5.73 | 2025-11-23 | 2025-11-23T03:53:11.052Z |

### Column Meanings

- **Date**: The period this data represents (e.g., "Nov 22" data)
- **Scraped Date**: When we captured this snapshot (e.g., "Nov 23")
- **Last Updated**: Timestamp of when data was last updated

## Benefits

1. **Accurate Day-over-Day**: Each day has one row with latest values
2. **Handles Corrections**: If Amazon corrects Nov 22 data on Nov 25, row gets updated
3. **No Duplicates**: Same date + account = one row
4. **Audit Trail**: Scraped Date shows when data was captured

## Example Scenario

**Day 1 (Nov 22)**: Scrape shows $50 revenue for Nov 22
- Row created: Date=Nov 22, Revenue=$50, Scraped Date=Nov 22

**Day 2 (Nov 23)**: Scrape shows $51.56 revenue for Nov 22 (Amazon corrected it)
- Row UPDATED: Date=Nov 22, Revenue=$51.56, Scraped Date=Nov 23
- New row created: Date=Nov 23, Revenue=$X, Scraped Date=Nov 23

This way, Nov 22 always shows the latest/corrected value.

## Alternative: Keep History

If you want to track how data changed over time, you could:
- Store multiple rows with timestamps
- Use a different sheet for "historical snapshots"
- Add a "Revision" column

But for day-over-day tracking, **updating existing rows** is the recommended approach.

