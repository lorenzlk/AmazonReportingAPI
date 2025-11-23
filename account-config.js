/**
 * Amazon Associates Account Configuration
 * Maps Store IDs to Tracking IDs and their Google Sheet IDs
 */

module.exports = {
  accounts: [
    {
      storeId: 'mula09a-20',
      trackingIds: [
        {
          trackingId: 'mula09a-20',
          sheetId: '1fDdgQNV_YT5Zvksv4JVI45kv2DFtSOvikScZq9HAsiM',
          sheetName: 'Amazon Associates Reporting' // Main sheet
        }
      ]
    },
    {
      storeId: 'bm01f-20',
      trackingIds: [
        {
          trackingId: 'mula07-20',
          sheetId: null, // Will need to create sheet
          sheetName: 'Amazon Associates - mula07-20'
        }
      ]
    },
    {
      storeId: 'tag0d1d-20',
      trackingIds: [
        {
          trackingId: 'twsmm-20',
          sheetId: null,
          sheetName: 'Amazon Associates - twsmm-20'
        },
        {
          trackingId: 'stylcasterm-20',
          sheetId: null,
          sheetName: 'Amazon Associates - stylcasterm-20'
        },
        {
          trackingId: 'defpenm-20',
          sheetId: null,
          sheetName: 'Amazon Associates - defpenm-20'
        },
        {
          trackingId: 'swimworldm-20',
          sheetId: null,
          sheetName: 'Amazon Associates - swimworldm-20'
        },
        {
          trackingId: 'britcom03-20',
          sheetId: null,
          sheetName: 'Amazon Associates - britcom03-20'
        },
        {
          trackingId: 'on3m-20',
          sheetId: null,
          sheetName: 'Amazon Associates - on3m-20'
        }
      ]
    },
    {
      storeId: 'usmagazine05-20',
      trackingIds: [
        {
          trackingId: 'mula0f-20',
          sheetId: null,
          sheetName: 'Amazon Associates - mula0f-20'
        }
      ]
    }
  ]
};

