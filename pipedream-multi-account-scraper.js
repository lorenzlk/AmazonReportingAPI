/**
 * Amazon Associates Multi-Account Scraper
 * Handles multiple Store IDs and Tracking IDs
 * 
 * This version loops through all accounts and tracking IDs
 */

import puppeteer from 'puppeteer-core';

// Account configuration
const ACCOUNTS = [
  {
    storeId: 'mula09a-20',
    trackingIds: ['mula09a-20']
  },
  {
    storeId: 'bm01f-20',
    trackingIds: ['mula07-20']
  },
  {
    storeId: 'tag0d1d-20',
    trackingIds: ['twsmm-20', 'stylcasterm-20', 'defpenm-20', 'swimworldm-20', 'britcom03-20', 'on3m-20']
  },
  {
    storeId: 'usmagazine05-20',
    trackingIds: ['mula0f-20']
  }
];

export default defineComponent({
  props: {
    browserless: {
      type: "app",
      app: "browserless",
    }
  },
  async run({ steps, $ }) {
    console.log('🚀 Starting multi-account Amazon Associates scraper...');
    
    const browserlessToken = this.browserless.$auth.api_key;
    const email = process.env.AMAZON_EMAIL;
    const password = process.env.AMAZON_PASSWORD;
    
    // Connect to browser
    console.log('🌐 Connecting to Browserless...');
    const endpoints = [
      `wss://chrome.browserless.io?token=${browserlessToken}`,
      `wss://chrome.browserless.io/puppeteer?token=${browserlessToken}`,
      `wss://production-sfo.browserless.io?token=${browserlessToken}`
    ];
    
    let browser;
    for (let i = 0; i < endpoints.length; i++) {
      try {
        browser = await puppeteer.connect({ browserWSEndpoint: endpoints[i] });
        console.log('✅ Connected to browser!');
        break;
      } catch (err) {
        if (i === endpoints.length - 1) throw err;
      }
    }
    
    const allResults = [];
    
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Login once (reuse session for all accounts)
      console.log('🔐 Logging in...');
      await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      const isLoginPage = page.url().includes('signin') || page.url().includes('ap/signin');
      if (isLoginPage) {
        // Login logic (same as before)
        await page.waitForSelector('#ap_email', { timeout: 10000 });
        await page.type('#ap_email', email, { delay: 30 });
        await page.click('#continue');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.waitForSelector('#ap_password', { timeout: 15000 });
        await page.type('#ap_password', password, { delay: 30 });
        await page.click('#signInSubmit');
        
        // Wait for login
        await new Promise(resolve => setTimeout(resolve, 2000));
        const loginUrl = page.url();
        if (loginUrl.includes('signin') || loginUrl.includes('ap/signin')) {
          await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });
        }
      }
      
      // Loop through each Store ID
      for (const account of ACCOUNTS) {
        const { storeId, trackingIds } = account;
        console.log(`\n📦 Processing Store ID: ${storeId}`);
        
        // Switch to Store ID
        try {
          await page.waitForSelector('#a-autoid-0-announce', { timeout: 5000 });
          const currentStore = await page.$eval('#a-autoid-0-announce > span.a-dropdown-prompt', el => el.textContent.trim());
          
          if (!currentStore.includes(storeId)) {
            console.log(`Switching from ${currentStore} to ${storeId}...`);
            await page.click('#a-autoid-0-announce');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const storeFound = await page.evaluate((storeId) => {
              for (let i = 1; i <= 10; i++) {
                const el = document.querySelector(`#menu-tab-store-id-picker_${i}`);
                if (el && el.textContent.includes(storeId)) return i;
              }
              return null;
            }, storeId);
            
            if (storeFound) {
              await page.click(`#menu-tab-store-id-picker_${storeFound}`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        } catch (error) {
          console.warn(`Could not switch to Store ID ${storeId}:`, error.message);
        }
        
        // Navigate to reports page
        await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Loop through each Tracking ID for this Store ID
        for (const trackingId of trackingIds) {
          console.log(`  📊 Processing Tracking ID: ${trackingId}`);
          
          // TODO: Switch to Tracking ID (need to find selector for Tracking ID filter)
          // This will require inspecting the reports page to find the Tracking ID dropdown/filter
          
          // For now, scrape current data (will need to add Tracking ID switching)
          try {
            await page.waitForSelector('#ac-report-commission-commision-total', { timeout: 10000 });
          } catch (e) {
            console.warn('Dashboard selector not found, continuing...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          // Extract data
          const data = await page.evaluate(() => {
            const getText = (selector) => {
              try {
                const el = document.querySelector(selector);
                return el ? el.textContent.trim() : '';
              } catch (e) {
                return '';
              }
            };
            
            const getTextMultiple = (...selectors) => {
              for (const selector of selectors) {
                const text = getText(selector);
                if (text) return text;
              }
              return '';
            };
            
            return {
              clicks: getTextMultiple('#ac-report-commission-commision-clicks'),
              ordered: getTextMultiple('#ac-report-commission-commision-ordered'),
              shipped: getTextMultiple('#ac-report-commission-commision-shipped'),
              conversionRate: getTextMultiple('#ac-report-commission-commision-conversion'),
              revenue: getTextMultiple('#ac-report-commission-commision-shipped-revenue'),
              earnings: getTextMultiple('#ac-report-commission-commision-total')
            };
          });
          
          // Parse data
          const parseCurrency = (str) => {
            if (!str) return 0;
            return parseFloat(str.replace(/[$,]/g, '')) || 0;
          };
          
          const parseInteger = (str) => {
            if (!str) return 0;
            return parseInt(str.replace(/,/g, '')) || 0;
          };
          
          const parsePercentage = (str) => {
            if (!str) return 0;
            return parseFloat(str.replace(/%/g, '')) || 0;
          };
          
          const result = {
            date: new Date().toISOString().split('T')[0],
            storeId: storeId,
            trackingId: trackingId,
            accountName: trackingId, // Use tracking ID as account name for sheets
            revenue: parseCurrency(data.revenue),
            earnings: parseCurrency(data.earnings),
            clicks: parseInteger(data.clicks),
            orders: parseInteger(data.ordered),
            conversionRate: parsePercentage(data.conversionRate),
            itemsOrdered: parseInteger(data.ordered),
            itemsShipped: parseInteger(data.shipped),
            revenuePerClick: parseInteger(data.clicks) > 0 
              ? parseCurrency(data.revenue) / parseInteger(data.clicks) 
              : 0,
            lastUpdated: new Date().toISOString()
          };
          
          allResults.push(result);
          console.log(`  ✅ Extracted data for ${trackingId}:`, result);
          
          // Small delay between tracking IDs
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Delay between Store IDs
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Cleanup
      await page.close();
      await browser.disconnect();
      
      console.log(`\n✅ Scraped ${allResults.length} accounts total`);
      return {
        results: allResults,
        count: allResults.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Scraper failed:', error.message);
      if (browser) {
        try { await browser.disconnect(); } catch (e) {}
      }
      throw error;
    }
  }
});

