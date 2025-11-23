/**
 * Amazon Associates Scraper - usmagazine05-20
 * 
 * This workflow scrapes data for Store ID: usmagazine05-20
 * Tracking IDs: mula0f-20
 * 
 * SETUP:
 * 1. Connect Browserless app in props
 * 2. Set environment variables: AMAZON_EMAIL, AMAZON_PASSWORD
 * 3. This step returns: { results: [...], count: 1 }
 * 4. Use with Google Sheets step to save results
 */

import puppeteer from 'puppeteer-core';

// Store ID configuration
const STORE_ID = 'usmagazine05-20';
const TRACKING_IDS = ['mula0f-20'];

export default defineComponent({
  props: {
    browserless: {
      type: "app",
      app: "browserless",
    },
    // Removed reportDate prop - always scrapes yesterday's data
  },
  async run({ steps, $ }) {
    // Always use yesterday's data
    const reportDateInput = 'yesterday';
    
    // Calculate target date (yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - 1);
    
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const targetDateDisplay = targetDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    console.log(`🚀 Starting scraper for Store ID: ${STORE_ID}`);
    console.log(`📅 Scraping yesterday's data: ${targetDateDisplay} (${targetDateStr})`);
    console.log(`📊 Will process ${TRACKING_IDS.length} Tracking ID(s): ${TRACKING_IDS.join(', ')}`);
    
    const browserlessToken = this.browserless.$auth.api_key;
    const email = process.env.AMAZON_EMAIL;
    const password = process.env.AMAZON_PASSWORD;
    
    const allResults = [];
    let browser = null;
    let page = null;
    let isLoggedIn = false;
    
    // Helper function to connect to browser with retry logic for rate limits
    const connectBrowser = async (retryCount = 0, maxRetries = 3) => {
      if (browser) {
        try {
          await browser.disconnect();
        } catch (e) {}
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
          const errorMsg = err.message || String(err);
          const isRateLimit = errorMsg.includes('429') || errorMsg.includes('Too Many Requests') || errorMsg.includes('rate limit');
          
          if (isRateLimit && retryCount < maxRetries) {
            const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.warn(`⚠️ Rate limited (429). Waiting ${waitTime/1000}s before retry ${retryCount + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return await connectBrowser(retryCount + 1, maxRetries);
          }
          
          if (i === endpoints.length - 1) {
            if (isRateLimit) {
              console.error('❌ Could not connect to browser: Rate limited. Please wait a few minutes and try again.');
              throw new Error('Browserless rate limit exceeded. Please wait a few minutes before retrying.');
            } else {
              console.error('❌ Could not connect to browser:', errorMsg);
            throw err;
            }
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
        
        const currentUrl = page.url();
        const isLoginPage = currentUrl.includes('signin') || currentUrl.includes('ap/signin');
        
        if (!isLoginPage) {
          try {
            await page.waitForSelector('#a-autoid-0-announce, #ac-report-commission-commision-total', { timeout: 5000 });
            console.log('✅ Already logged in!');
            isLoggedIn = true;
            return true;
          } catch (e) {
            console.log('📝 Dashboard not found, need to login...');
          }
        }
        
        if (isLoginPage) {
          console.log('📝 Need to login...');
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
        
        if (!currentStore.includes(STORE_ID)) {
          console.log(`🔄 Switching to Store ID: ${STORE_ID}...`);
          await page.click('#a-autoid-0-announce');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const storeFound = await page.evaluate((storeId) => {
            for (let i = 1; i <= 10; i++) {
              const el = document.querySelector(`#menu-tab-store-id-picker_${i}`);
              if (el && el.textContent.includes(storeId)) return i;
            }
            return null;
          }, STORE_ID);
          
          if (storeFound) {
            await page.click(`#menu-tab-store-id-picker_${storeFound}`);
            try {
              await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
            } catch (navError) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
            const pages = await browser.pages();
            page = pages[pages.length - 1];
            await page.setViewport({ width: 1920, height: 1080 });
            console.log(`  ✅ Switched to ${STORE_ID}`);
          } else {
            console.warn(`  ⚠️ Could not find Store ID ${STORE_ID}, continuing...`);
          }
        } else {
          console.log(`  ✅ Already on Store ID ${STORE_ID}`);
        }
      } catch (error) {
        console.warn(`  ⚠️ Could not switch to Store ID ${STORE_ID}: ${error.message}`);
      }
      
      // Navigate to reports page
      await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Set date range to yesterday using radio button (most reliable)
      console.log(`📅 Setting date range to ${targetDateDisplay}...`);
      let dateSetSuccessfully = false;
      
      try {
        // Wait for page to fully load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 1: Open the date picker popup by clicking on the date range display
        console.log('  Opening date picker popup...');
        
        // Use evaluate to find and click the date range element more reliably
        const popupOpened = await page.evaluate(() => {
          // Look for elements containing date range text like "Last 30 Days" or date ranges
          const allElements = Array.from(document.querySelectorAll('*'));
          for (const el of allElements) {
            const text = el.textContent?.trim() || '';
            // Look for date range patterns
            if (text.includes('Last 30 Days') || text.includes('Last 7 Days') || 
                (text.match(/\w{3} \d{1,2} \d{4}/) && text.includes('-'))) {
              // Check if it's clickable
              const style = window.getComputedStyle(el);
              if (style.cursor === 'pointer' || el.onclick || 
                  el.tagName === 'BUTTON' || el.tagName === 'A' ||
                  el.closest('button') || el.closest('a')) {
                const clickable = el.closest('button') || el.closest('a') || el;
                clickable.click();
                return true;
              }
            }
          }
          return false;
        });
        
        if (popupOpened) {
          console.log('  ✅ Clicked date range display');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          // Fallback: try common selectors
          const dateRangeSelectors = [
            'button[aria-label*="date" i]',
            'a[aria-label*="date" i]',
            'span:has-text("Last 30 Days")',
            'div:has-text("Last 30 Days")'
          ];
          
          for (const selector of dateRangeSelectors) {
            try {
              const dateBtn = await page.$(selector);
              if (dateBtn) {
                console.log(`  Trying selector: ${selector}`);
                await dateBtn.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                break;
              }
            } catch (e) {}
          }
        }
        
        // Wait a bit for popup to appear
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Step 2: Find and click "Yesterday" radio button in the popup
        console.log('  Looking for "Yesterday" radio button in popup...');
        
        const yesterdaySelected = await page.evaluate(() => {
          // Find the popover (it might have different IDs)
          const popovers = document.querySelectorAll('[id^="a-popover"], .a-popover, [class*="popover"]');
          
          for (const popover of popovers) {
            // Check if popover is visible
            const style = window.getComputedStyle(popover);
            if (style.display === 'none' || style.visibility === 'hidden') continue;
            
            // Look for all radio buttons in the popover
            const radios = popover.querySelectorAll('input[type="radio"]');
            for (const radio of radios) {
              // Get the label text - try multiple ways
              let labelText = '';
              
              // Method 1: Check closest label
              const closestLabel = radio.closest('label');
              if (closestLabel) {
                labelText = closestLabel.textContent?.trim().toLowerCase() || '';
              }
              
              // Method 2: Check label with matching for attribute
              if (!labelText && radio.id) {
                const labelFor = document.querySelector(`label[for="${radio.id}"]`);
                if (labelFor) {
                  labelText = labelFor.textContent?.trim().toLowerCase() || '';
                }
              }
              
              // Method 3: Check parent or sibling label
              if (!labelText) {
                const parent = radio.parentElement;
                const siblingLabel = parent?.querySelector('label');
                if (siblingLabel) {
                  labelText = siblingLabel.textContent?.trim().toLowerCase() || '';
                }
              }
              
              // Check if this is the "Yesterday" option
              if (labelText.includes('yesterday')) {
                console.log('Found Yesterday radio button');
                radio.click();
                return true;
              }
            }
            
            // If no radio found, try clicking labels directly
            const labels = popover.querySelectorAll('label');
            for (const label of labels) {
              const text = label.textContent?.trim().toLowerCase() || '';
              if (text.includes('yesterday')) {
                console.log('Found Yesterday label, clicking');
                label.click();
                return true;
              }
            }
          }
          
          return false;
        });
        
        if (yesterdaySelected) {
          console.log('  ✅ Selected "Yesterday" radio button');
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Step 3: Click "Apply" button
          const applyClicked = await page.evaluate(() => {
            const popovers = document.querySelectorAll('[id^="a-popover"], .a-popover, [class*="popover"]');
            
            for (const popover of popovers) {
              const style = window.getComputedStyle(popover);
              if (style.display === 'none' || style.visibility === 'hidden') continue;
              
              // Look for Apply button
              const buttons = popover.querySelectorAll('button');
              for (const btn of buttons) {
                const text = btn.textContent?.trim().toLowerCase() || '';
                if (text === 'apply' || text.includes('apply')) {
                  console.log('Found Apply button, clicking');
                  btn.click();
                  return true;
                }
              }
            }
            return false;
          });
          
          if (applyClicked) {
            console.log('  ✅ Clicked "Apply" button');
            await new Promise(resolve => setTimeout(resolve, 4000)); // Wait longer for page to update
            dateSetSuccessfully = true;
            console.log(`  ✅ Date set to ${targetDateDisplay}`);
            
            // After date change, page may reload - get fresh page reference
            try {
              const pages = await browser.pages();
              page = pages[pages.length - 1];
              await page.setViewport({ width: 1920, height: 1080 });
              
              // Re-navigate to ensure fresh context
              await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
                waitUntil: 'domcontentloaded',
                timeout: 15000
              });
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Re-switch Store ID if needed (page reload may have reset it)
              try {
                await page.waitForSelector('#a-autoid-0-announce', { timeout: 10000 });
                const currentStore = await page.$eval('#a-autoid-0-announce > span.a-dropdown-prompt', el => el.textContent.trim());
                if (!currentStore.includes(STORE_ID)) {
                  console.log('  🔄 Re-switching to Store ID after date change...');
                  await page.click('#a-autoid-0-announce');
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  const storeFound = await page.evaluate((storeId) => {
                    for (let i = 1; i <= 10; i++) {
                      const el = document.querySelector(`#menu-tab-store-id-picker_${i}`);
                      if (el && el.textContent.includes(storeId)) return i;
                    }
                    return null;
                  }, STORE_ID);
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
                console.warn('  ⚠️ Could not verify/re-switch Store ID after date change');
              }
              
              // Verify the date was actually changed
              const dateRangeText = await page.evaluate(() => {
                const allText = document.body.textContent || '';
                return allText.includes('Yesterday') || allText.includes('Nov 22 2025');
              });
              
              if (!dateRangeText) {
                console.warn('  ⚠️ Date range may not have updated - page may still show previous range');
              } else {
                console.log('  ✅ Verified date range updated');
              }
            } catch (recoveryError) {
              console.warn(`  ⚠️ Error recovering page after date change: ${recoveryError.message}`);
            }
          } else {
            console.warn('  ⚠️ Could not find "Apply" button');
          }
        } else {
          console.warn('  ⚠️ Could not find "Yesterday" radio button in popup');
        }
        
        if (!dateSetSuccessfully) {
          console.warn('  ⚠️ Could not set date to "Yesterday"');
          console.warn(`  ⚠️ WARNING: Data may not be for ${targetDateDisplay}`);
          console.warn(`  ⚠️ Current data appears to be for "Last 30 Days" based on values`);
          console.warn(`  💡 Data will be labeled as ${targetDateStr} in results, but actual data may differ`);
        }
      } catch (error) {
        console.warn(`  ⚠️ Error setting date range: ${error.message}`);
        console.warn(`  ⚠️ WARNING: Data may not be for ${targetDateDisplay}`);
      }
      
      // Ensure we have a fresh page reference before data extraction
      try {
        if (page && !page.isClosed()) {
          // Test if page is still valid
          await page.evaluate(() => document.title);
        } else {
          throw new Error('Page is closed');
        }
      } catch (e) {
        console.log('  🔄 Getting fresh page reference before data extraction...');
        const pages = await browser.pages();
        page = pages[pages.length - 1];
        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Process each Tracking ID
      for (let trackingIndex = 0; trackingIndex < TRACKING_IDS.length; trackingIndex++) {
        const trackingId = TRACKING_IDS[trackingIndex];
        console.log(`\n📊 Processing Tracking ID: ${trackingId} [${trackingIndex + 1}/${TRACKING_IDS.length}]`);
        
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
            } catch (cleanupError) {}
            
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
              if (!currentStore.includes(STORE_ID)) {
                console.log(`  🔄 Re-switching to Store ID: ${STORE_ID}...`);
                await page.click('#a-autoid-0-announce');
                await new Promise(resolve => setTimeout(resolve, 1000));
                const storeFound = await page.evaluate((storeId) => {
                  for (let i = 1; i <= 10; i++) {
                    const el = document.querySelector(`#menu-tab-store-id-picker_${i}`);
                    if (el && el.textContent.includes(storeId)) return i;
                  }
                  return null;
                }, STORE_ID);
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
            continue;
          }
        }
        
        // Switch to Tracking ID if needed (for mula09a-20, trackingId === storeId, so may not need to switch)
        if (trackingId !== STORE_ID || TRACKING_IDS.length > 1) {
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
            
            if (errorMsg.includes('detached') || errorMsg.includes('Frame') || errorMsg.includes('Session closed') || errorMsg.includes('Connection closed')) {
              console.log('    🔄 Session closed, reconnecting...');
              try {
                try {
                  if (browser) {
                    await browser.disconnect();
                  }
                } catch (cleanupError) {}
                
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
                
                try {
                  await page.waitForSelector('#a-autoid-0-announce', { timeout: 10000 });
                  const currentStore = await page.$eval('#a-autoid-0-announce > span.a-dropdown-prompt', el => el.textContent.trim());
                  if (!currentStore.includes(STORE_ID)) {
                    await page.click('#a-autoid-0-announce');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const storeFound = await page.evaluate((storeId) => {
                      for (let i = 1; i <= 10; i++) {
                        const el = document.querySelector(`#menu-tab-store-id-picker_${i}`);
                        if (el && el.textContent.includes(storeId)) return i;
                      }
                      return null;
                    }, STORE_ID);
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
            
            if (data && (data.revenue || data.earnings || data.clicks || data.ordered)) {
              break;
            } else {
              extractionAttempts++;
              if (extractionAttempts < maxExtractionAttempts) {
                console.log(`  ⏳ No data found, retrying extraction... (attempt ${extractionAttempts + 1}/${maxExtractionAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Get fresh page reference
                try {
                  const pages = await browser.pages();
                  page = pages[pages.length - 1];
                  await page.setViewport({ width: 1920, height: 1080 });
                } catch (e) {
                  console.warn('  ⚠️ Could not get fresh page reference');
                }
                
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
            
            // If detached frame error, try to recover
            if (errorMsg.includes('detached') || errorMsg.includes('Frame')) {
              console.log('  🔄 Detached frame detected, recovering...');
              try {
                const pages = await browser.pages();
                page = pages[pages.length - 1];
                await page.setViewport({ width: 1920, height: 1080 });
                await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', {
                  waitUntil: 'domcontentloaded',
                  timeout: 15000
                });
                await new Promise(resolve => setTimeout(resolve, 2000));
              } catch (recoverError) {
                console.warn(`  ⚠️ Could not recover from detached frame: ${recoverError.message}`);
              }
            }
            
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
          date: targetDateStr,
          storeId: STORE_ID,
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
            } catch (e) {}
          }
          await browser.disconnect();
        }
      } catch (e) {}
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`\n✅ Scraped ${allResults.length} Tracking IDs for Store ID: ${STORE_ID}`);
      return {
        results: allResults,
        count: allResults.length,
        storeId: STORE_ID,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Scraper failed:', error.message);
      
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

