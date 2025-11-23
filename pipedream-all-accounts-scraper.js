/**
 * Amazon Associates Multi-Account Scraper
 * Processes ALL Store IDs and Tracking IDs
 * 
 * This version loops through all accounts and returns results array
 * Use with Pipedream Loop step to process each result
 * 
 * SETUP:
 * 1. Connect Browserless app in props
 * 2. Set environment variables: AMAZON_EMAIL, AMAZON_PASSWORD
 * 3. This step returns: { results: [...], count: 9 }
 * 4. Use Pipedream Loop step to iterate over results
 * 5. Pass each result to Google Sheets step
 */

import puppeteer from 'puppeteer-core';

// Complete account configuration
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
    console.log(`📊 Will process ${ACCOUNTS.reduce((sum, acc) => sum + acc.trackingIds.length, 0)} Tracking IDs across ${ACCOUNTS.length} Store IDs`);
    
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
          timeout: 20000  // Reduced from 30000
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
          await page.waitForSelector('#ap_email', { timeout: 8000 });  // Reduced from 10000
          await page.type('#ap_email', email, { delay: 20 });  // Faster typing
          await page.click('#continue');
          await new Promise(resolve => setTimeout(resolve, 800));  // Reduced from 1000
          await page.waitForSelector('#ap_password', { timeout: 10000 });  // Reduced from 15000
          await page.type('#ap_password', password, { delay: 20 });  // Faster typing
          await page.click('#signInSubmit');
          await new Promise(resolve => setTimeout(resolve, 1500));  // Reduced from 2000
          
          const loginUrl = page.url();
          if (loginUrl.includes('signin') || loginUrl.includes('ap/signin')) {
            await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
              waitUntil: 'domcontentloaded',
              timeout: 8000  // Reduced from 10000
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
      await login();
      
      // Get current Store ID and reorder accounts to start with it
      let accountsToProcess = [...ACCOUNTS];
      try {
        if (page && !page.isClosed()) {
          await page.waitForSelector('#a-autoid-0-announce', { timeout: 5000 });
          const currentStore = await page.$eval('#a-autoid-0-announce > span.a-dropdown-prompt', el => el.textContent.trim());
          console.log(`📍 Starting on Store ID: ${currentStore}`);
          
          // Find which account matches the current store
          const currentAccountIndex = accountsToProcess.findIndex(acc => 
            currentStore.includes(acc.storeId)
          );
          
          // Reorder to start with current account
          if (currentAccountIndex > 0) {
            const currentAccount = accountsToProcess[currentAccountIndex];
            accountsToProcess.splice(currentAccountIndex, 1);
            accountsToProcess.unshift(currentAccount);
            console.log(`🔄 Reordered accounts to start with: ${currentAccount.storeId}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not detect current Store ID, using default order:', error.message);
      }
      
      // Process each Store ID one at a time, reconnecting on failure
      for (let accountIndex = 0; accountIndex < accountsToProcess.length; accountIndex++) {
        const account = accountsToProcess[accountIndex];
        const { storeId, trackingIds } = account;
        console.log(`\n📦 Processing Store ID: ${storeId} (${trackingIds.length} Tracking ID(s)) [${accountIndex + 1}/${accountsToProcess.length}]`);
        
        // Wrap entire Store ID processing in try-catch to continue on failure
        try {
          // Check if browser connection is still valid, reconnect if needed
          let needsReconnect = false;
          try {
            if (!browser || page?.isClosed()) {
              needsReconnect = true;
            } else {
              // Test connection by checking pages
              await browser.pages();
            }
          } catch (e) {
            console.warn('  ⚠️ Browser connection lost, will reconnect...');
            needsReconnect = true;
          }
          
          if (needsReconnect) {
            console.log('  🔄 Reconnecting to browser...');
            try {
              await connectBrowser();
              page = await browser.newPage();
              await page.setViewport({ width: 1920, height: 1080 });
              isLoggedIn = false; // Need to login again after reconnect
              const loginSuccess = await login();
              if (!loginSuccess) {
                throw new Error('Login failed after reconnect');
              }
            } catch (reconnectError) {
              console.error(`  ❌ Failed to reconnect: ${reconnectError.message}`);
              console.log(`  ⚠️ Skipping Store ID ${storeId}, continuing to next...`);
              continue; // Skip this Store ID and continue to next
            }
          }
        
        // Switch to Store ID (skip if already on it)
        try {
          await page.waitForSelector('#a-autoid-0-announce', { timeout: 5000 });
          const currentStore = await page.$eval('#a-autoid-0-announce > span.a-dropdown-prompt', el => el.textContent.trim());
          
          if (!currentStore.includes(storeId)) {
            console.log(`  🔄 Switching from ${currentStore} to ${storeId}...`);
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
                // Navigation might complete before we wait, that's okay
                console.log('  ⏳ Waiting for page reload after account switch...');
                await new Promise(resolve => setTimeout(resolve, 3000));
              }
              
              // Get fresh page reference in case page was reloaded
              const pages = await browser.pages();
              page = pages[pages.length - 1]; // Use the most recent page
              await page.setViewport({ width: 1920, height: 1080 });
              
              console.log(`  ✅ Switched to ${storeId}`);
            } else {
              console.warn(`  ⚠️ Could not find Store ID ${storeId}, continuing...`);
            }
          } else {
            console.log(`  ✅ Already on Store ID ${storeId} - skipping switch`);
          }
        } catch (error) {
          const errorMsg = error.message || String(error);
          console.warn(`  ⚠️ Could not switch to Store ID ${storeId}: ${errorMsg}`);
          
          // If frame is detached, get fresh page reference
          if (errorMsg.includes('detached') || errorMsg.includes('Frame')) {
            try {
              const pages = await browser.pages();
              page = pages[pages.length - 1];
              await page.setViewport({ width: 1920, height: 1080 });
              console.log('  🔄 Got fresh page reference after detached frame error');
            } catch (e) {
              console.warn('  ⚠️ Could not get fresh page reference');
            }
          }
        }
        
        // Wait a bit before navigation to let account switch settle
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Navigate to reports page (with retry logic and error handling)
        let navigationSuccess = false;
        for (let retry = 0; retry < 3; retry++) {
          try {
            // Check if page is still valid
            if (page.isClosed()) {
              console.warn('  ⚠️ Page was closed, creating new page...');
              page = await browser.newPage();
              await page.setViewport({ width: 1920, height: 1080 });
            }
            
            await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
              waitUntil: 'domcontentloaded',
              timeout: 15000
            });
            navigationSuccess = true;
            break;
          } catch (navError) {
            const errorMsg = navError.message || String(navError);
            console.warn(`  ⚠️ Navigation attempt ${retry + 1} failed: ${errorMsg}`);
            
            // If frame is detached or session closed, reconnect
            if (errorMsg.includes('detached') || errorMsg.includes('Frame') || errorMsg.includes('Session closed') || errorMsg.includes('Connection closed')) {
              console.log('  🔄 Session closed during navigation, reconnecting...');
              try {
                // Clean up old connection
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
                
                // Reconnect
                await connectBrowser();
                page = await browser.newPage();
                await page.setViewport({ width: 1920, height: 1080 });
                const loginSuccess = await login();
                if (!loginSuccess) {
                  throw new Error('Login failed after reconnect');
                }
                
                // Re-switch to Store ID
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
                
                // Retry navigation after reconnect
                navigationSuccess = true; // Mark as success so we can continue
                break; // Exit retry loop
              } catch (reconnectError) {
                console.error(`  ❌ Failed to reconnect: ${reconnectError.message}`);
                // Continue to next retry attempt
              }
            } else if (errorMsg.includes('ERR_ABORTED') || errorMsg.includes('Navigation')) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            } else if (retry < 2) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              console.warn('  ⚠️ All navigation attempts failed, trying to continue with current page...');
            }
          }
        }
        
        // Wait for page to settle
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Loop through each Tracking ID for this Store ID (one at a time)
        for (let trackingIndex = 0; trackingIndex < trackingIds.length; trackingIndex++) {
          const trackingId = trackingIds[trackingIndex];
          console.log(`  📊 Processing Tracking ID: ${trackingId} [${trackingIndex + 1}/${trackingIds.length}]`);
          
          // Check connection before each Tracking ID - improved detection
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
              // Test connection by trying to get pages
              try {
                await browser.pages();
              } catch (testError) {
                const errorMsg = testError.message || String(testError);
                if (errorMsg.includes('Session closed') || errorMsg.includes('Connection closed') || errorMsg.includes('Target closed')) {
                  needsReconnect = true;
                  connectionError = errorMsg;
                } else {
                  throw testError; // Re-throw if it's a different error
                }
              }
            }
          } catch (e) {
            const errorMsg = e.message || String(e);
            if (errorMsg.includes('Session closed') || errorMsg.includes('Connection closed') || errorMsg.includes('Target closed')) {
              needsReconnect = true;
              connectionError = errorMsg;
            } else {
              // Other errors might be recoverable, log but don't reconnect
              console.warn(`  ⚠️ Connection check warning: ${errorMsg}`);
            }
          }
          
          if (needsReconnect) {
            console.log(`  🔄 Reconnecting to browser (${connectionError})...`);
            try {
              // Clean up old connection
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
              
              // Reconnect
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
                } else {
                  console.log(`  ✅ Already on Store ID: ${storeId}`);
                }
              } catch (switchError) {
                console.warn(`  ⚠️ Could not re-switch to Store ID: ${switchError.message}`);
              }
            } catch (reconnectError) {
              console.error(`  ❌ Failed to reconnect: ${reconnectError.message}`);
              console.log(`  ⚠️ Skipping Tracking ID ${trackingId} and remaining Tracking IDs for this Store ID`);
              break; // Skip remaining Tracking IDs for this Store ID
            }
          }
          
          // Switch to Tracking ID if it's different from Store ID or if there are multiple Tracking IDs
          if (trackingId !== storeId || trackingIds.length > 1) {
            try {
              // Ensure we have a valid page reference
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
              
              // Wait for Tracking ID dropdown to be available
              await page.waitForSelector('#ac-dropdown-displayreport-trackingIds', { timeout: 8000 });
              
              // Check current Tracking ID
              const currentTrackingId = await page.$eval('#ac-dropdown-displayreport-trackingIds', el => el.textContent.trim());
              console.log(`    Current Tracking ID: ${currentTrackingId}`);
              
              if (currentTrackingId !== trackingId) {
                // Click the dropdown trigger (try multiple selectors)
                let dropdownTrigger = await page.$('label[for="report-trackingIds"] + div.ac-widget-value a.a-popover-trigger');
                if (!dropdownTrigger) {
                  dropdownTrigger = await page.$('div.ac-widget-value.ac-widget-dropdown-value a.a-popover-trigger');
                }
                
                if (dropdownTrigger) {
                  await dropdownTrigger.click();
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  
                  // Find and click the Tracking ID option
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
                    await new Promise(resolve => setTimeout(resolve, 2500)); // Wait for page to filter
                  } else {
                    console.warn(`    ⚠️ Could not find Tracking ID option: ${trackingId} in dropdown`);
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
              
              // If frame is detached or session closed, reconnect
              if (errorMsg.includes('detached') || errorMsg.includes('Frame') || errorMsg.includes('Session closed') || errorMsg.includes('Connection closed')) {
                console.log('    🔄 Session closed, reconnecting...');
                try {
                  // Clean up old connection
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
                  
                  // Reconnect
                  await connectBrowser();
                  page = await browser.newPage();
                  await page.setViewport({ width: 1920, height: 1080 });
                  const loginSuccess = await login();
                  if (!loginSuccess) {
                    throw new Error('Login failed after reconnect');
                  }
                  
                  // Re-switch to correct Store ID
                  try {
                    await page.waitForSelector('#a-autoid-0-announce', { timeout: 10000 });
                    const currentStore = await page.$eval('#a-autoid-0-announce > span.a-dropdown-prompt', el => el.textContent.trim());
                    if (!currentStore.includes(storeId)) {
                      console.log(`    🔄 Re-switching to Store ID: ${storeId}...`);
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
                  break; // Skip this tracking ID
                }
              }
            }
          }
          
          // Wait for dashboard to load with multiple attempts
          let dashboardLoaded = false;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              await page.waitForSelector('#ac-report-commission-commision-total', { timeout: 8000 });
              dashboardLoaded = true;
              console.log('  ✅ Dashboard loaded');
              break;
            } catch (e) {
              console.warn(`  ⚠️ Dashboard selector not found (attempt ${attempt + 1}/3), waiting...`);
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          }
          
          if (!dashboardLoaded) {
            console.warn('  ⚠️ Dashboard did not load after 3 attempts, trying to extract anyway...');
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
          // Extract data (with error handling for detached frames)
          let data;
          let extractionAttempts = 0;
          const maxExtractionAttempts = 3;
          
          while (extractionAttempts < maxExtractionAttempts) {
            try {
              // Ensure page is still valid
              if (page.isClosed()) {
                throw new Error('Page is closed');
              }
              
              data = await page.evaluate(() => {
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
              
              // Check if we got any real data (not all empty)
              const hasData = data.revenue || data.earnings || data.clicks || data.ordered;
              if (hasData) {
                console.log(`  ✅ Extracted data (attempt ${extractionAttempts + 1}):`, {
                  revenue: data.revenue,
                  earnings: data.earnings,
                  clicks: data.clicks,
                  orders: data.ordered
                });
                break; // Success - we have data
              } else {
                extractionAttempts++;
                if (extractionAttempts < maxExtractionAttempts) {
                  console.warn(`  ⚠️ No data found (attempt ${extractionAttempts}), retrying...`);
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  // Try navigating to reports page again
                  try {
                    await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
                      waitUntil: 'domcontentloaded',
                      timeout: 10000
                    });
                    await new Promise(resolve => setTimeout(resolve, 3000));
                  } catch (navError) {
                    console.warn(`  ⚠️ Could not navigate: ${navError.message}`);
                  }
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
                // Use empty data as fallback
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
          
          // If we still don't have data after all attempts, log a warning
          if (!data || (!data.revenue && !data.earnings && !data.clicks && !data.ordered)) {
            console.warn(`  ⚠️ WARNING: No data extracted for ${trackingId} - all values will be zero`);
            // Ensure data object exists
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
          console.log(`  ✅ Extracted data for ${trackingId}:`, {
            revenue: result.revenue,
            earnings: result.earnings,
            clicks: result.clicks,
            orders: result.orders
          });
          
          // Small delay between tracking IDs
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if we should continue or if connection is too unstable
          try {
            if (page && !page.isClosed()) {
              await browser.pages(); // Test connection
            }
          } catch (e) {
            console.warn('  ⚠️ Connection unstable, will reconnect for next Tracking ID if needed');
          }
        }
        
        // Delay between Store IDs
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        } catch (storeError) {
          // If entire Store ID processing fails, log and continue to next
          console.error(`  ❌ Failed to process Store ID ${storeId}: ${storeError.message}`);
          console.log(`  ⚠️ Skipping Store ID ${storeId}, continuing to next...`);
          
          // Try to reconnect for next Store ID
          try {
            if (browser) {
              await browser.disconnect();
            }
            browser = null;
            page = null;
            isLoggedIn = false;
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
          
          // Continue to next Store ID
          continue;
        }
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
      
      // Small delay to allow connections to close
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`\n✅ Scraped ${allResults.length} Tracking IDs total`);
      return {
        results: allResults,
        count: allResults.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Scraper failed:', error.message);
      
      // Ensure cleanup even on error
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
      } catch (e) {
        // Ignore cleanup errors
      }
      
      // Return partial results if we have any
      if (allResults.length > 0) {
        console.log(`⚠️ Returning ${allResults.length} partial results due to error`);
        return {
          results: allResults,
          count: allResults.length,
          timestamp: new Date().toISOString(),
          error: error.message,
          partial: true
        };
      }
      
      throw error;
    }
  }
});

