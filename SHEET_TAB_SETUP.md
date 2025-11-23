# Google Sheet Tab Setup Guide

## Sheet Structure

**Main Sheet**: "Amazon Associates Reporting"  
**Sheet ID**: `1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM`

**Tabs** (one per Tracking ID):
- ✅ mula09a-20 (exists)
- ⬜ mula07-20 (needs to be created)
- ⬜ twsmm-20 (needs to be created)
- ⬜ stylcasterm-20 (needs to be created)
- ⬜ defpenm-20 (needs to be created)
- ⬜ swimworldm-20 (needs to be created)
- ⬜ britcom03-20 (needs to be created)
- ⬜ on3m-20 (needs to be created)
- ⬜ mula0f-20 (needs to be created)

## Step 1: Create Tabs in Your Sheet

1. **Open your "Amazon Associates Reporting" sheet**: https://docs.google.com/spreadsheets/d/1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM/edit

2. **For each Tracking ID**, create a new tab:
   - Click the "+" button at the bottom (or right-click existing tab → "Insert sheet")
   - **Rename the tab** to the Tracking ID name (e.g., "mula07-20")
   - **Add headers in Row 1**:
     ```
     Date | Store ID | Tracking ID | Revenue | Earnings | Clicks | Orders | Conversion Rate | Items Ordered | Items Shipped | Revenue Per Click | Scraped Date | Last Updated
     ```

3. **Create these 8 tabs**:
   - mula07-20
   - twsmm-20
   - stylcasterm-20
   - defpenm-20
   - swimworldm-20
   - britcom03-20
   - on3m-20
   - mula0f-20

## Step 2: Update Existing Tab

Make sure the **mula09a-20** tab has the correct headers:

```
Date | Store ID | Tracking ID | Revenue | Earnings | Clicks | Orders | Conversion Rate | Items Ordered | Items Shipped | Revenue Per Click | Scraped Date | Last Updated
```

## How It Works

- **One Google Sheet** with multiple tabs
- **Each tab** = One Tracking ID
- **Tab name** = Tracking ID name (e.g., "mula09a-20")
- The code automatically uses the correct tab based on the Tracking ID

## Benefits

- ✅ All data in one place
- ✅ Easy to compare across Tracking IDs
- ✅ No need for multiple Sheet IDs
- ✅ Simpler configuration

## Next Steps

1. Create the 8 missing tabs
2. Add headers to each tab
3. Test the workflow - it should automatically use the correct tab!

