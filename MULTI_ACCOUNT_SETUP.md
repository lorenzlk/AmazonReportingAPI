# Multi-Account Setup: Store IDs & Tracking IDs

## Account Structure

**Store IDs** = Main accounts (what you see in the account switcher dropdown)  
**Tracking IDs** = Sub-accounts within each Store ID (what you filter by on the reports page)

## Account Mapping

### Store ID: mula09a-20
- **Tracking ID**: mula09a-20
- **Sheet**: "Amazon Associates Reporting" (main sheet)
- **Sheet ID**: `1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM`

### Store ID: bm01f-20
- **Tracking ID**: mula07-20
- **Sheet**: "Amazon Associates - mula07-20" (needs to be created)

### Store ID: tag0d1d-20
- **Tracking IDs** (6 total):
  - twsmm-20
  - stylcasterm-20
  - defpenm-20
  - swimworldm-20
  - britcom03-20
  - on3m-20
- **Sheets**: One sheet per Tracking ID (6 sheets needed)

### Store ID: usmagazine05-20
- **Tracking ID**: mula0f-20
- **Sheet**: "Amazon Associates - mula0f-20" (needs to be created)

## Total Sheets Needed

1. ✅ **Amazon Associates Reporting** (mula09a-20) - EXISTS
2. ⬜ Amazon Associates - mula07-20
3. ⬜ Amazon Associates - twsmm-20
4. ⬜ Amazon Associates - stylcasterm-20
5. ⬜ Amazon Associates - defpenm-20
6. ⬜ Amazon Associates - swimworldm-20
7. ⬜ Amazon Associates - britcom03-20
8. ⬜ Amazon Associates - on3m-20
9. ⬜ Amazon Associates - mula0f-20

**Total: 9 sheets** (1 exists, 8 need to be created)

## Next Steps

1. Create the 8 missing Google Sheets
2. Get Sheet IDs for each
3. Update the workflow to loop through all Store IDs and Tracking IDs
4. The scraper will need to:
   - Switch Store ID (account switcher)
   - Switch Tracking ID (filter on reports page)
   - Scrape data
   - Save to appropriate sheet

