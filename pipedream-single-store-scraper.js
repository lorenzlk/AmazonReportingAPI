/**
 * Amazon Associates Single Store ID Scraper
 * Processes ONE Store ID and all its Tracking IDs
 * 
 * This version is designed for separate workflows per Store ID
 * Each workflow processes one Store ID independently
 * 
 * SETUP:
 * 1. Connect Browserless app in props
 * 2. Set environment variables: AMAZON_EMAIL, AMAZON_PASSWORD
 * 3. Set STORE_ID prop (e.g., "mula09a-20")
 * 4. This step returns: { results: [...], count: N }
 * 5. Use with Google Sheets step to save results
 */

import puppeteer from 'puppeteer-core';

// Import account configuration
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
    },
    storeId: {
      type: "string",
      label: "Store ID",
      description: "The Amazon Associates Store ID to scrape (e.g., mula09a-20)",
      default: "mula09a-20"
    },
    reportDate: {
      type: "string",
      label: "Report Date",
      description: "Date to scrape: 'yesterday', 'today', or YYYY-MM-DD format (e.g., 2025-11-22). Default: yesterday",
      default: "yesterday"
    }
  },
  async run({ steps, $ }) {
    const storeId = this.storeId;
    const reportDateInput = this.reportDate || 'yesterday';
    
    // Calculate target date
    let targetDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (reportDateInput === 'yesterday') {
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() - 1);
    } else if (reportDateInput === 'today') {
      targetDate = new Date(today);
    } else {
      // Parse YYYY-MM-DD format
      targetDate = new Date(reportDateInput);
      if (isNaN(targetDate.getTime())) {
        throw new Error(`Invalid date format: ${reportDateInput}. Use 'yesterday', 'today', or YYYY-MM-DD`);
      }
    }
    
    const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const targetDateDisplay = targetDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Find the Store ID configuration
    const accountConfig = ACCOUNTS.find(acc => acc.storeId === storeId);
    if (!accountConfig) {
      throw new Error(`Store ID "${storeId}" not found in configuration. Available Store IDs: ${ACCOUNTS.map(a => a.storeId).join(', ')}`);
    }
    
    const { trackingIds } = accountConfig;
    console.log(`🚀 Starting scraper for Store ID: ${storeId}`);
    console.log(`📅 Target date: ${targetDateDisplay} (${targetDateStr})`);
    console.log(`📊 Will process ${trackingIds.length} Tracking ID(s): ${trackingIds.join(', ')}`);
    
    const browserlessToken = this.browserless.$auth.api_key;
    const email = process.env.AMAZON_EMAIL;
    const password = process.env.AMAZON_PASSWORD;
    
    const allResults = [];
    let browser = null;
    let page = null;
    let isLoggedIn = false;
    
    // Helper function to connect to browser
    const connectBrowser = async () => {
      if (browser) {
        try {
          await browser.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
        browser = null;
      }
      
      console.log('🌐 Connecting to Browserless...');
      const endpoints = [
        `wss://chrome.browserless.io?token=${browserlessToken}`,
        `wss://chrome.browserless.io/puppeteer?token=${browserlessToken}`,
        `wss://production-sfo.browserless.io?token=${browserlessToken}`
      ];
      
      for (let i = 0; i < endpoints.length; i++) {
        try {
          browser = await puppeteer.connect({ browserWSEndpoint: endpoints[i] });
          console.log('✅ Connected to browser!');
          return true;
        } catch (err) {
          if (i === endpoints.length - 1) {
            console.error('❌ Could not connect to browser');
            throw err;
          }
        }
      }
      return false;
    };
    
    // Helper function to login (optimized for speed)
    const login = async () => {
      if (isLoggedIn) return true;
      
      try {
        if (!page || page.isClosed()) {
          page = await browser.newPage();
          await page.setViewport({ width: 1920, height: 1080 });
        }
        
        console.log('🔐 Checking login status...');
        await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
          waitUntil: 'domcontentloaded',
          timeout: 20000
        });
        
        // Quick check if already logged in (not on login page)
        const currentUrl = page.url();
        const isLoginPage = currentUrl.includes('signin') || currentUrl.includes('ap/signin');
        
        if (!isLoginPage) {
          // Already logged in, verify by checking for dashboard elements
          try {
            await page.waitForSelector('#a-autoid-0-announce, #ac-report-commission-commision-total', { timeout: 5000 });
            console.log('✅ Already logged in!');
            isLoggedIn = true;
            return true;
          } catch (e) {
            // Might need to login after all
            console.log('📝 Dashboard not found, need to login...');
          }
        }
        
        if (isLoginPage) {
          console.log('📝 Need to login...');
          // Faster login with reduced timeouts
          await page.waitForSelector('#ap_email', { timeout: 8000 });
          await page.type('#ap_email', email, { delay: 20 });
          await page.click('#continue');
          await new Promise(resolve => setTimeout(resolve, 800));
          await page.waitForSelector('#ap_password', { timeout: 10000 });
          await page.type('#ap_password', password, { delay: 20 });
          await page.click('#signInSubmit');
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const loginUrl = page.url();
          if (loginUrl.includes('signin') || loginUrl.includes('ap/signin')) {
            await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
              waitUntil: 'domcontentloaded',
              timeout: 8000
            });
          }
          console.log('✅ Login successful!');
        }
        isLoggedIn = true;
        return true;
      } catch (error) {
        console.error('❌ Login failed:', error.message);
        isLoggedIn = false;
        return false;
      }
    };
    
    try {
      // Initial connection and login
      await connectBrowser();
      page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      const loginSuccess = await login();
      if (!loginSuccess) {
        throw new Error('Initial login failed');
      }
      
      // Check current Store ID and switch if needed
      try {
        await page.waitForSelector('#a-autoid-0-announce', { timeout: 10000 });
        const currentStore = await page.$eval('#a-autoid-0-announce > span.a-dropdown-prompt', el => el.textContent.trim());
        console.log(`📍 Current Store ID: ${currentStore}`);
        
        if (!currentStore.includes(storeId)) {
          console.log(`🔄 Switching to Store ID: ${storeId}...`);
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
            
            // Wait for page navigation after account switch
            try {
              await page.waitForNavigation({ 
                waitUntil: 'domcontentloaded', 
                timeout: 10000 
              });
            } catch (navError) {
              console.log('  ⏳ Waiting for page reload after account switch...');
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            // Get fresh page reference in case page was reloaded
            const pages = await browser.pages();
            page = pages[pages.length - 1];
            await page.setViewport({ width: 1920, height: 1080 });
            
            console.log(`  ✅ Switched to ${storeId}`);
          } else {
            console.warn(`  ⚠️ Could not find Store ID ${storeId}, continuing...`);
          }
        } else {
          console.log(`  ✅ Already on Store ID ${storeId}`);
        }
      } catch (error) {
        console.warn(`  ⚠️ Could not switch to Store ID ${storeId}: ${error.message}`);
      }
      
      // Navigate to reports page
      await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Set date range to target date (single day - yesterday by default)
      console.log(`📅 Setting date range to ${targetDateDisplay}...`);
      try {
        // Look for date picker - common selectors for Amazon
        const datePickerSelectors = [
          'input[placeholder*="date" i]',
          'input[aria-label*="date" i]',
          '#date-range-picker',
          '.date-picker',
          'input[type="date"]',
          '[data-testid*="date"]',
          'input[name*="date" i]',
          '.ac-widget-date-picker input',
          'input.ac-widget-date-picker-input'
        ];
        
        let datePickerFound = false;
        for (const selector of datePickerSelectors) {
          try {
            const datePicker = await page.$(selector);
            if (datePicker) {
              console.log(`  Found date picker with selector: ${selector}`);
              await datePicker.click();
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Try to set the date - format depends on Amazon's UI
              // Common approach: clear and type date
              await datePicker.click({ clickCount: 3 }); // Select all
              await datePicker.type(targetDateStr, { delay: 50 });
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Look for apply/submit button
              const applyButtons = [
                'button[type="submit"]',
                'button:has-text("Apply")',
                'button:has-text("Go")',
                '.apply-button',
                '[data-testid="apply"]',
                'button.ac-widget-button-primary'
              ];
              
              for (const btnSelector of applyButtons) {
                try {
                  const applyBtn = await page.$(btnSelector);
                  if (applyBtn) {
                    await applyBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    datePickerFound = true;
                    console.log(`  ✅ Date set to ${targetDateDisplay}`);
                    break;
                  }
                } catch (e) {
                  // Try next button selector
                }
              }
              
              if (datePickerFound) break;
            }
          } catch (e) {
            // Try next selector
          }
        }
        
        if (!datePickerFound) {
          console.warn('  ⚠️ Could not find date picker - using default date range');
          console.warn(`  💡 Amazon may show yesterday by default, or you may need to manually set the date`);
          console.warn(`  💡 Data will be labeled as ${targetDateStr} in results`);
        }
      } catch (error) {
        console.warn(`  ⚠️ Could not set date range: ${error.message}`);
        console.warn(`  💡 Continuing with default date range - data will be labeled as ${targetDateStr}`);
      }
      
      // Process each Tracking ID
      for (let trackingIndex = 0; trackingIndex < trackingIds.length; trackingIndex++) {
        const trackingId = trackingIds[trackingIndex];
        console.log(`\n📊 Processing Tracking ID: ${trackingId} [${trackingIndex + 1}/${trackingIds.length}]`);
        
        // Check connection before each Tracking ID
        let needsReconnect = false;
        let connectionError = null;
        try {
          if (!browser) {
            needsReconnect = true;
            connectionError = 'Browser is null';
          } else if (page?.isClosed()) {
            needsReconnect = true;
            connectionError = 'Page is closed';
          } else {
            try {
              await browser.pages();
            } catch (testError) {
              const errorMsg = testError.message || String(testError);
              if (errorMsg.includes('Session closed') || errorMsg.includes('Connection closed') || errorMsg.includes('Target closed')) {
                needsReconnect = true;
                connectionError = errorMsg;
              } else {
                throw testError;
              }
            }
          }
        } catch (e) {
          const errorMsg = e.message || String(e);
          if (errorMsg.includes('Session closed') || errorMsg.includes('Connection closed') || errorMsg.includes('Target closed')) {
            needsReconnect = true;
            connectionError = errorMsg;
          } else {
            console.warn(`  ⚠️ Connection check warning: ${errorMsg}`);
          }
        }
        
        if (needsReconnect) {
          console.log(`  🔄 Reconnecting to browser (${connectionError})...`);
          try {
            try {
              if (browser) {
                await browser.disconnect();
              }
            } catch (cleanupError) {
              // Ignore cleanup errors
            }
            
            browser = null;
            page = null;
            isLoggedIn = false;
            
            await connectBrowser();
            page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            const loginSuccess = await login();
            if (!loginSuccess) {
              throw new Error('Login failed after reconnect');
            }
            
            // Re-switch to Store ID after reconnect
            try {
              await page.waitForSelector('#a-autoid-0-announce', { timeout: 10000 });
              const currentStore = await page.$eval('#a-autoid-0-announce > span.a-dropdown-prompt', el => el.textContent.trim());
              if (!currentStore.includes(storeId)) {
                console.log(`  🔄 Re-switching to Store ID: ${storeId}...`);
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
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
                    waitUntil: 'domcontentloaded',
                    timeout: 15000
                  });
                  await new Promise(resolve => setTimeout(resolve, 2000));
                }
              }
            } catch (switchError) {
              console.warn(`  ⚠️ Could not re-switch to Store ID: ${switchError.message}`);
            }
          } catch (reconnectError) {
            console.error(`  ❌ Failed to reconnect: ${reconnectError.message}`);
            console.log(`  ⚠️ Skipping Tracking ID ${trackingId}`);
            continue; // Skip this tracking ID and continue
          }
        }
        
        // Switch to Tracking ID if needed
        if (trackingId !== storeId || trackingIds.length > 1) {
          try {
            if (page.isClosed()) {
              console.log('  🔄 Page was closed, creating new page...');
              page = await browser.newPage();
              await page.setViewport({ width: 1920, height: 1080 });
              await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
                waitUntil: 'domcontentloaded',
                timeout: 15000
              });
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            await page.waitForSelector('#ac-dropdown-displayreport-trackingIds', { timeout: 8000 });
            const currentTrackingId = await page.$eval('#ac-dropdown-displayreport-trackingIds', el => el.textContent.trim());
            console.log(`    Current Tracking ID: ${currentTrackingId}`);
            
            if (currentTrackingId !== trackingId) {
              let dropdownTrigger = await page.$('label[for="report-trackingIds"] + div.ac-widget-value a.a-popover-trigger');
              if (!dropdownTrigger) {
                dropdownTrigger = await page.$('div.ac-widget-value.ac-widget-dropdown-value a.a-popover-trigger');
              }
              
              if (dropdownTrigger) {
                await dropdownTrigger.click();
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const trackingIdFound = await page.evaluate((trackingId) => {
                  const popover = document.querySelector('.ac-widget-dropdown-popover');
                  if (!popover) return false;
                  
                  const options = Array.from(popover.querySelectorAll('a, li, span, div'));
                  for (const option of options) {
                    const text = option.textContent ? option.textContent.trim() : '';
                    if (text === trackingId || text.includes(trackingId)) {
                      const clickable = option.closest('a') || option.closest('li') || option;
                      clickable.click();
                      return true;
                    }
                  }
                  return false;
                }, trackingId);
                
                if (trackingIdFound) {
                  console.log(`    ✅ Switched to Tracking ID: ${trackingId}`);
                  await new Promise(resolve => setTimeout(resolve, 2500));
                } else {
                  console.warn(`    ⚠️ Could not find Tracking ID option: ${trackingId}`);
                }
              } else {
                console.warn('    ⚠️ Could not find Tracking ID dropdown trigger');
              }
            } else {
              console.log(`    ✅ Already on Tracking ID: ${trackingId}`);
            }
          } catch (error) {
            const errorMsg = error.message || String(error);
            console.warn(`    ⚠️ Could not switch Tracking ID: ${errorMsg}`);
            
            // If session closed, reconnect
            if (errorMsg.includes('detached') || errorMsg.includes('Frame') || errorMsg.includes('Session closed') || errorMsg.includes('Connection closed')) {
              console.log('    🔄 Session closed, reconnecting...');
              try {
                try {
                  if (browser) {
                    await browser.disconnect();
                  }
                } catch (cleanupError) {
                  // Ignore cleanup errors
                }
                
                browser = null;
                page = null;
                isLoggedIn = false;
                
                await connectBrowser();
                page = await browser.newPage();
                await page.setViewport({ width: 1920, height: 1080 });
                const loginSuccess = await login();
                if (!loginSuccess) {
                  throw new Error('Login failed after reconnect');
                }
                
                // Re-switch to Store ID and Tracking ID
                try {
                  await page.waitForSelector('#a-autoid-0-announce', { timeout: 10000 });
                  const currentStore = await page.$eval('#a-autoid-0-announce > span.a-dropdown-prompt', el => el.textContent.trim());
                  if (!currentStore.includes(storeId)) {
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
                      await new Promise(resolve => setTimeout(resolve, 3000));
                      await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
                        waitUntil: 'domcontentloaded',
                        timeout: 15000
                      });
                      await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                  }
                } catch (e) {
                  console.warn('    ⚠️ Could not re-switch Store ID');
                }
                
                console.log('    ✅ Reconnected and recovered');
              } catch (reconnectError) {
                console.error(`    ❌ Failed to reconnect: ${reconnectError.message}`);
                console.log(`    ⚠️ Skipping Tracking ID ${trackingId}`);
                continue;
              }
            }
          }
        }
        
        // Wait for dashboard to load
        let dashboardLoaded = false;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            await page.waitForSelector('#ac-report-commission-commision-total', { timeout: 8000 });
            dashboardLoaded = true;
            break;
          } catch (e) {
            if (attempt < 2) {
              console.log(`  ⏳ Dashboard not ready, retrying... (attempt ${attempt + 1}/3)`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        
        if (!dashboardLoaded) {
          console.warn('  ⚠️ Dashboard selector not found, continuing...');
        }
        
        // Extract data (with retries)
        let data = null;
        const maxExtractionAttempts = 3;
        let extractionAttempts = 0;
        
        while (!data && extractionAttempts < maxExtractionAttempts) {
          try {
            data = await page.evaluate(() => {
              const getText = (selector) => {
                const el = document.querySelector(selector);
                return el ? el.textContent.trim() : '';
              };
              
              const getTextMultiple = (selectors) => {
                for (const selector of selectors) {
                  const text = getText(selector);
                  if (text) return text;
                }
                return '';
              };
              
              return {
                revenue: getTextMultiple([
                  '#ac-report-commission-commision-total',
                  '[data-testid="total-revenue"]',
                  '.ac-report-commission-total'
                ]),
                earnings: getTextMultiple([
                  '#ac-report-commission-commision-earnings',
                  '[data-testid="total-earnings"]',
                  '.ac-report-commission-earnings'
                ]),
                clicks: getTextMultiple([
                  '#ac-report-commission-commision-clicks',
                  '[data-testid="total-clicks"]',
                  '.ac-report-commission-clicks'
                ]),
                ordered: getTextMultiple([
                  '#ac-report-commission-commision-ordered',
                  '[data-testid="total-ordered"]',
                  '.ac-report-commission-ordered'
                ]),
                shipped: getTextMultiple([
                  '#ac-report-commission-commision-shipped',
                  '[data-testid="total-shipped"]',
                  '.ac-report-commission-shipped'
                ]),
                conversionRate: getTextMultiple([
                  '#ac-report-commission-commision-conversion-rate',
                  '[data-testid="conversion-rate"]',
                  '.ac-report-commission-conversion-rate'
                ])
              };
            });
            
            // Check if we got any data
            if (data && (data.revenue || data.earnings || data.clicks || data.ordered)) {
              break; // Got data, exit loop
            } else {
              extractionAttempts++;
              if (extractionAttempts < maxExtractionAttempts) {
                console.log(`  ⏳ No data found, retrying extraction... (attempt ${extractionAttempts + 1}/${maxExtractionAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                // Navigate to reports page again
                await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
                  waitUntil: 'domcontentloaded',
                  timeout: 15000
                });
                await new Promise(resolve => setTimeout(resolve, 2000));
              } else {
                console.warn(`  ⚠️ No data found after ${maxExtractionAttempts} attempts, using empty data`);
              }
            }
          } catch (evalError) {
            extractionAttempts++;
            const errorMsg = evalError.message || String(evalError);
            console.warn(`  ⚠️ Data extraction failed (attempt ${extractionAttempts}): ${errorMsg}`);
            
            if (extractionAttempts < maxExtractionAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              data = {
                clicks: '',
                ordered: '',
                shipped: '',
                conversionRate: '',
                revenue: '',
                earnings: ''
              };
            }
          }
        }
        
        // If we still don't have data, use empty values
        if (!data || (!data.revenue && !data.earnings && !data.clicks && !data.ordered)) {
          console.warn(`  ⚠️ WARNING: No data extracted for ${trackingId} - all values will be zero`);
          if (!data) {
            data = {
              clicks: '',
              ordered: '',
              shipped: '',
              conversionRate: '',
              revenue: '',
              earnings: ''
            };
          }
        }
        
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
          date: targetDateStr, // Use the target date, not today's date
          storeId: storeId,
          trackingId: trackingId,
          accountName: trackingId,
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
        console.log(`  ✅ Extracted data for ${trackingId}:`, {
          revenue: result.revenue,
          earnings: result.earnings,
          clicks: result.clicks,
          orders: result.orders
        });
        
        // Small delay between tracking IDs
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Cleanup
      console.log('🧹 Cleaning up...');
      try {
        if (browser) {
          const pages = await browser.pages();
          for (const p of pages) {
            try {
              if (!p.isClosed()) {
                await p.close();
              }
            } catch (e) {
              // Ignore cleanup errors
            }
          }
          await browser.disconnect();
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`\n✅ Scraped ${allResults.length} Tracking IDs for Store ID: ${storeId}`);
      return {
        results: allResults,
        count: allResults.length,
        storeId: storeId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Scraper failed:', error.message);
      
      // Cleanup on error
      try {
        if (browser) {
          const pages = await browser.pages();
          for (const p of pages) {
            try {
              if (!p.isClosed()) {
                await p.close();
              }
            } catch (e) {}
          }
          await browser.disconnect();
        }
      } catch (e) {}
      
      throw error;
    }
  }
});

