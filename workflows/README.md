# Workflows by Store ID

This directory contains organized workflow scripts, one folder per Store ID.

## Structure

```
workflows/
├── mula09a-20/
│   ├── scraper.js          # Scraper for mula09a-20 (1 Tracking ID)
│   └── google-sheets.js    # Saves to "Sheet1" tab
├── bm01f-20/
│   ├── scraper.js          # Scraper for bm01f-20 (1 Tracking ID)
│   └── google-sheets.js    # Saves to "mula07-20" tab
├── tag0d1d-20/
│   ├── scraper.js          # Scraper for tag0d1d-20 (6 Tracking IDs)
│   └── google-sheets.js    # Saves to tabs: twsmm-20, stylcasterm-20, etc.
└── usmagazine05-20/
    ├── scraper.js          # Scraper for usmagazine05-20 (1 Tracking ID)
    └── google-sheets.js    # Saves to "mula0f-20" tab
```

## Usage

### For Each Store ID Workflow:

1. **Copy `scraper.js`** to Pipedream scraper step
2. **Copy `google-sheets.js`** to Pipedream Google Sheets step
3. **Update step reference** in `google-sheets.js` to match your scraper step name
4. **Set environment variables**: `AMAZON_EMAIL`, `AMAZON_PASSWORD`, `GOOGLE_SHEET_ID`

## Store ID Details

### mula09a-20
- **Tracking IDs**: 1 (mula09a-20)
- **Google Sheet Tab**: `mula09a-20`
- **Sheet ID**: `1TBvJZS9KkdP6VBeZ-YZIJ6NxqAn2bAnBzjRTqK9qPWU`
- **Sheet Name**: "Amazon Associates Reporting"

### bm01f-20
- **Tracking IDs**: 1 (mula07-20)
- **Google Sheet Tab**: `mula07-20`
- **Sheet ID**: `1TBvJZS9KkdP6VBeZ-YZIJ6NxqAn2bAnBzjRTqK9qPWU`
- **Sheet Name**: "Amazon Associates Reporting"

### tag0d1d-20
- **Tracking IDs**: 6
  - twsmm-20
  - stylcasterm-20
  - defpenm-20
  - swimworldm-20
  - britcom03-20
  - on3m-20
- **Google Sheet Tabs**: One tab per Tracking ID (named after Tracking ID)
- **Sheet ID**: `1TBvJZS9KkdP6VBeZ-YZIJ6NxqAn2bAnBzjRTqK9qPWU`
- **Sheet Name**: "Amazon Associates Reporting"

### usmagazine05-20
- **Tracking IDs**: 1 (mula0f-20)
- **Google Sheet Tab**: `mula0f-20`
- **Sheet ID**: `1TBvJZS9KkdP6VBeZ-YZIJ6NxqAn2bAnBzjRTqK9qPWU`
- **Sheet Name**: "Amazon Associates Reporting"

## Benefits

✅ **Organized**: Each Store ID has its own folder  
✅ **Customized**: Store ID and Tracking IDs are hardcoded (no props needed)  
✅ **Clear**: Easy to see which script belongs to which Store ID  
✅ **Maintainable**: Update one Store ID without affecting others

## Adding New Tracking IDs

To add new Tracking IDs to an existing Store ID:

1. Edit the `scraper.js` file in that Store ID's folder
2. Update the `TRACKING_IDS` array:
   ```javascript
   const TRACKING_IDS = ['existing-id', 'new-id'];
   ```
3. No changes needed to `google-sheets.js` - it automatically creates tabs

## Step Names Reference

When setting up in Pipedream, use these step names:

| Store ID | Scraper Step Name | Google Sheets Step Reference |
|----------|-------------------|------------------------------|
| mula09a-20 | `Scraper - mula09a-20` | `steps["Scraper - mula09a-20"]` |
| bm01f-20 | `Scraper - bm01f-20` | `steps["Scraper - bm01f-20"]` |
| tag0d1d-20 | `Scraper - tag0d1d-20` | `steps["Scraper - tag0d1d-20"]` |
| usmagazine05-20 | `Scraper - usmagazine05-20` | `steps["Scraper - usmagazine05-20"]` |

