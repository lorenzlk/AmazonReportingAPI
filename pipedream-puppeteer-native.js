/**
 * Amazon Associates Scraper - BROWSERLESS WEBSOCKET VERSION
 * Using puppeteer-core to connect directly to Browserless browser via WebSocket
 * 
 * TIMEOUT FIX: Instead of waiting for navigation events (which Amazon doesn't always trigger),
 * we wait for the actual elements we need (password field, dashboard). This prevents timeouts
 * when Amazon updates the page in-place without triggering navigation events.
 */

import puppeteer from 'puppeteer-core';

export default defineComponent({
  props: {
    browserless: {
      type: "app",
      app: "browserless",
    }
  },
  async run({ steps, $ }) {
    console.log('🚀 Starting Amazon Associates scraper...');
    
    const browserlessToken = this.browserless.$auth.api_key;
    const email = process.env.AMAZON_EMAIL;
    const password = process.env.AMAZON_PASSWORD;
    
    console.log('🌐 Connecting to Browserless via WebSocket...');
    console.log('Token (first 10 chars):', browserlessToken?.substring(0, 10));
    
    // Try different WebSocket endpoint formats
    const endpoints = [
      `wss://chrome.browserless.io?token=${browserlessToken}`,
      `wss://chrome.browserless.io/puppeteer?token=${browserlessToken}`,
      `wss://production-sfo.browserless.io?token=${browserlessToken}`
    ];
    
    let browser;
    let page;
    let lastError;
    
    // Try each endpoint
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      console.log(`Attempting connection ${i + 1}/${endpoints.length}: ${endpoint.substring(0, 50)}...`);
      
      try {
        browser = await puppeteer.connect({
          browserWSEndpoint: endpoint,
        });
        console.log('✅ Connected to browser!');
        break; // Success! Exit the loop
      } catch (err) {
        console.error(`❌ Connection ${i + 1} failed:`, err.message);
        lastError = err;
        if (i === endpoints.length - 1) {
          // All attempts failed
          throw new Error(`All WebSocket connection attempts failed. Last error: ${err.message}. This may indicate your Browserless plan doesn't support WebSocket connections or the token is invalid.`);
        }
      }
    }
    
    if (!browser) {
      throw lastError || new Error('Failed to connect to browser');
    }
    
    try {
      
      page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Check if we need to login or are already logged in
      console.log('🔐 Checking login status...');
      await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      console.log('Page loaded, current URL:', page.url());
      const title = await page.title();
      console.log('Page title:', title);
      
      // Check if we're on the login page or already logged in
      const isLoginPage = page.url().includes('signin') || page.url().includes('ap/signin');
      
      if (isLoginPage) {
        console.log('📝 Need to login...');
        
        // Wait for email input
        console.log('Waiting for email input...');
        const emailSelector = await Promise.race([
          page.waitForSelector('#ap_email', { timeout: 10000 }).then(() => '#ap_email').catch(() => null),
          page.waitForSelector('input[type="email"]', { timeout: 10000 }).then(() => 'input[type="email"]').catch(() => null),
          page.waitForSelector('input[name="email"]', { timeout: 10000 }).then(() => 'input[name="email"]').catch(() => null),
        ]);
        
        if (!emailSelector) {
          throw new Error('Email input field not found on login page.');
        }
        
        console.log(`Found email field with selector: ${emailSelector}`);
        console.log('Typing email...');
        await page.type(emailSelector, email, { delay: 30 }); // Faster typing
        console.log('Email typed!');
        
        // Find and click continue button
        console.log('Looking for continue button...');
        const continueSelector = await Promise.race([
          page.waitForSelector('#continue', { timeout: 3000 }).then(() => '#continue').catch(() => null),
          page.waitForSelector('input[type="submit"]', { timeout: 3000 }).then(() => 'input[type="submit"]').catch(() => null),
          page.waitForSelector('button[type="submit"]', { timeout: 3000 }).then(() => 'button[type="submit"]').catch(() => null),
        ]);
        
        if (continueSelector) {
          console.log(`Clicking ${continueSelector}...`);
          await page.click(continueSelector);
          console.log('Waiting for password field to appear...');
          
          // Wait a moment for page to respond
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check for CAPTCHA or other challenges
          const captchaExists = await page.$('#captchacharacters, #auth-captcha-image, iframe[src*="captcha"]');
          if (captchaExists) {
            const screenshot = await page.screenshot({ encoding: 'base64' });
            console.log('⚠️ CAPTCHA detected! Screenshot taken (base64 length):', screenshot.length);
            throw new Error('CAPTCHA detected - manual intervention required. This scraper does not support CAPTCHA solving.');
          }
          
          // Wait for either navigation OR password field (more robust)
          // Amazon sometimes doesn't trigger navigation, just updates the page
          try {
            await Promise.race([
              page.waitForSelector('#ap_password', { timeout: 15000 }),
              page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).then(async () => {
                // If navigation happened, wait for password field on new page
                await page.waitForSelector('#ap_password', { timeout: 10000 });
              })
            ]);
            console.log('Password field appeared!');
          } catch (error) {
            // Check if password field exists anyway (page might have updated without navigation)
            const passwordField = await page.$('#ap_password');
            if (!passwordField) {
              // Check for error messages or other issues
              const errorMessage = await page.evaluate(() => {
                const errorEl = document.querySelector('.a-alert-content, .a-box-inner, [role="alert"]');
                return errorEl ? errorEl.textContent.trim() : null;
              });
              
              // Take screenshot for debugging
              try {
                const screenshot = await page.screenshot({ encoding: 'base64' });
                console.log('Screenshot taken (base64 length):', screenshot.length);
                if (errorMessage) {
                  console.log('Error message on page:', errorMessage);
                }
              } catch (screenshotError) {
                console.error('Failed to take screenshot:', screenshotError.message);
              }
              throw new Error(`Password field not found after clicking continue. ${errorMessage ? `Page error: ${errorMessage}` : ''} Original error: ${error.message}`);
            }
            console.log('Password field found despite navigation timeout');
          }
        } else {
          console.log('Continue button not found, checking for password field directly...');
          await page.waitForSelector('#ap_password', { timeout: 10000 });
        }
        
        console.log('Password field confirmed, proceeding...');
        console.log('Typing password...');
        await page.type('#ap_password', password, { delay: 30 }); // Faster typing
        console.log('Password typed!');
        
        console.log('Looking for sign in button...');
        await page.waitForSelector('#signInSubmit', { timeout: 5000 });
        console.log('Clicking sign in...');
        await page.click('#signInSubmit');
        console.log('Waiting for login to complete...');
        
        // Wait for login with aggressive timeout - check quickly and move on
        let loginComplete = false;
        const maxWaitTime = 8000; // Maximum 8 seconds total
        const startTime = Date.now();
        
        // Quick check: wait for navigation (most common case)
        try {
          await page.waitForNavigation({ 
            waitUntil: 'domcontentloaded', 
            timeout: 5000 
          });
          loginComplete = true;
          console.log('✅ Login detected via navigation!');
        } catch (navError) {
          console.log('Navigation not detected, checking current state...');
        }
        
        // If navigation didn't happen, check URL immediately
        if (!loginComplete) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
          
          const loginUrl = page.url();
          console.log('Current URL:', loginUrl);
          
          if (loginUrl.includes('reports') || loginUrl.includes('home')) {
            console.log('✅ Login successful - already on reports/home page');
            loginComplete = true;
          } else if (!loginUrl.includes('signin') && !loginUrl.includes('ap/signin')) {
            console.log('✅ Login successful - URL changed away from signin');
            loginComplete = true;
          } else {
            // Still might be on signin - try waiting a bit more for dashboard
            const remainingTime = maxWaitTime - (Date.now() - startTime);
            if (remainingTime > 2000) {
              try {
                await page.waitForSelector('#ac-report-commission-commision-total', { 
                  timeout: Math.min(remainingTime, 3000)
                });
                loginComplete = true;
                console.log('✅ Dashboard detected!');
              } catch (selectorError) {
                console.log('Dashboard not found, will try navigation...');
              }
            }
          }
        }
        
        // If still not complete, try navigating to reports (login might have worked)
        if (!loginComplete) {
          const finalUrl = page.url();
          console.log('Attempting to navigate to reports to verify login...');
          
          try {
          await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', { 
            waitUntil: 'domcontentloaded',
            timeout: 8000 
          });
            console.log('✅ Navigation to reports succeeded - login was successful');
            loginComplete = true;
          } catch (gotoError) {
            // Check if we're already there
            const checkUrl = page.url();
            if (checkUrl.includes('reports') || checkUrl.includes('home')) {
              console.log('✅ Already on reports page - login successful');
              loginComplete = true;
            } else {
              console.error('❌ Failed to navigate to reports - login may have failed');
              throw new Error(`Login appears to have failed. Current URL: ${checkUrl}`);
            }
          }
        }
        
        console.log('✅ Login successful!');
        
        // Navigate to reports after login (if not already there)
        const reportsUrl = page.url();
        if (!reportsUrl.includes('reports') && !reportsUrl.includes('home/reports') && !reportsUrl.includes('p/reporting')) {
          console.log('📊 Navigating to reports page...');
          await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', { 
            waitUntil: 'domcontentloaded',
            timeout: 20000 
          });
          console.log('Reports page loaded!');
        } else {
          console.log('Already on reports page, skipping navigation');
        }
      } else {
        console.log('✅ Already logged in! Skipping login step.');
      }
      
      // Switch to the correct Store ID and Tracking ID
      // For now, using mula09a-20 (Store ID = Tracking ID in this case)
      const targetStoreId = 'mula09a-20';
      const targetTrackingId = 'mula09a-20'; // Same as Store ID for this account
      
      console.log(`🔄 Checking current Store ID and switching to: ${targetStoreId}`);
      
      // Wrap entire account switching in a timeout to prevent hanging (max 8 seconds)
      // If account switching fails or times out, we'll just continue with whatever account is active
      try {
        await Promise.race([
          (async () => {
            // Wait for account switcher to be available (5 seconds - more reasonable with paid account)
            try {
              await page.waitForSelector('#a-autoid-0-announce', { timeout: 5000 });
            } catch (selectorError) {
              console.warn('⚠️ Account switcher not found, skipping account switch');
              return; // Exit early if selector not found
            }
        
            // Get current account name (with timeout protection)
            let currentAccountText;
            try {
              currentAccountText = await page.$eval(
                '#a-autoid-0-announce > span.a-dropdown-prompt',
                el => el.textContent.trim()
              );
              console.log(`Current account: ${currentAccountText}`);
            } catch (evalError) {
              console.warn('Could not get current account name, skipping switch');
              return; // Exit early if we can't read account
            }
        
        // Check if we're already on the right account
        if (currentAccountText.includes(targetAccount)) {
          console.log(`✅ Already on account ${targetAccount}`);
        } else {
          console.log(`Switching from ${currentAccountText} to ${targetAccount}...`);
          
          // Click account switcher dropdown
          await page.click('#a-autoid-0-announce');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Find the account option that contains mula09a-20
          const accountFound = await page.evaluate((accountId) => {
            // Try account indices 1-10
            for (let i = 1; i <= 10; i++) {
              const element = document.querySelector(`#menu-tab-store-id-picker_${i}`);
              if (element && element.textContent.includes(accountId)) {
                return i;
              }
            }
            return null;
          }, targetAccount);
          
          if (accountFound) {
            console.log(`Found account at index ${accountFound}, clicking...`);
            
            // Click the account option
            await page.click(`#menu-tab-store-id-picker_${accountFound}`);
            console.log('Account option clicked');
            
            // Aggressive wait - check quickly and move on
            const maxWaitTime = 6000; // Maximum 6 seconds total
            const startTime = Date.now();
            let switchDetected = false;
            
            // Quick check: wait for account text to change
            try {
              await page.waitForFunction(
                (targetAccount) => {
                  const el = document.querySelector('#a-autoid-0-announce > span.a-dropdown-prompt');
                  return el && el.textContent && el.textContent.includes(targetAccount);
                },
                { timeout: 4000 },
                targetAccount
              );
              switchDetected = true;
              console.log('✅ Account switch detected via text change!');
            } catch (error) {
              console.log('Text change not detected, checking current state...');
            }
            
            // If not detected, check immediately
            if (!switchDetected) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
              
              try {
                const newAccountText = await page.$eval(
                  '#a-autoid-0-announce > span.a-dropdown-prompt',
                  el => el.textContent.trim()
                );
                console.log(`Current account after click: ${newAccountText}`);
                
                if (newAccountText.includes(targetAccount)) {
                  switchDetected = true;
                  console.log(`✅ Successfully switched to ${targetAccount}`);
                } else {
                  // Try waiting a bit more for navigation
                  const remainingTime = maxWaitTime - (Date.now() - startTime);
                  if (remainingTime > 2000) {
                    try {
                      await page.waitForNavigation({ 
                        waitUntil: 'domcontentloaded', 
                        timeout: Math.min(remainingTime, 3000)
                      });
                      console.log('✅ Account switch detected via navigation!');
                      switchDetected = true;
                    } catch (navError) {
                      console.log('Navigation not detected, continuing...');
                    }
                  }
                }
              } catch (evalError) {
                console.warn('Could not check account text:', evalError.message);
              }
            }
            
            // Brief wait for dashboard to update
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Final verification (non-blocking)
            try {
              const finalAccountText = await page.$eval(
                '#a-autoid-0-announce > span.a-dropdown-prompt',
                el => el.textContent.trim()
              );
              if (finalAccountText.includes(targetAccount)) {
                console.log(`✅ Confirmed: On account ${targetAccount}`);
              } else {
                console.warn(`⚠️ May be on different account: ${finalAccountText}. Continuing anyway...`);
              }
            } catch (error) {
              console.log('Could not verify final account, continuing...');
            }
            
          } else {
            console.warn(`⚠️ Could not find account ${targetAccount} in dropdown. Continuing with current account.`);
          }
        }
          })(),
          // Timeout fallback - force continue after 10 seconds
          new Promise((resolve) => {
            setTimeout(() => {
              console.warn('⚠️ Account switching timed out after 10 seconds, continuing with current account...');
              resolve();
            }, 10000);
          })
        ]);
      } catch (error) {
        console.warn(`⚠️ Account switching failed: ${error.message}`);
        console.log('Continuing with current account...');
      }
      
      // Switch to the correct Tracking ID (if different from Store ID)
      if (targetTrackingId && targetTrackingId !== targetStoreId) {
        console.log(`🔄 Switching to Tracking ID: ${targetTrackingId}`);
        try {
          // Wait for Tracking ID dropdown to be available
          await page.waitForSelector('#ac-dropdown-displayreport-trackingIds', { timeout: 8000 });
          
          // Check current Tracking ID
          const currentTrackingId = await page.$eval('#ac-dropdown-displayreport-trackingIds', el => el.textContent.trim());
          console.log(`Current Tracking ID: ${currentTrackingId}`);
          
          if (currentTrackingId !== targetTrackingId) {
            // Click the dropdown trigger (the <a> tag with popover-trigger class)
            // Try multiple selectors to find the dropdown
            let dropdownTrigger = await page.$('label[for="report-trackingIds"] + div.ac-widget-value a.a-popover-trigger');
            if (!dropdownTrigger) {
              dropdownTrigger = await page.$('div.ac-widget-value.ac-widget-dropdown-value a.a-popover-trigger');
            }
            if (!dropdownTrigger) {
              dropdownTrigger = await page.$('#ac-dropdown-displayreport-trackingIds').then(el => el.closest('a')).catch(() => null);
            }
            
            if (dropdownTrigger) {
              await dropdownTrigger.click();
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Wait for popover menu to appear and find the Tracking ID option
              const trackingIdFound = await page.evaluate((targetTrackingId) => {
                // Look for the option in the popover menu
                const popover = document.querySelector('.ac-widget-dropdown-popover');
                if (!popover) return false;
                
                // Try to find the option by text content (exact match first, then partial)
                const options = Array.from(popover.querySelectorAll('a, li, span, div'));
                for (const option of options) {
                  const text = option.textContent ? option.textContent.trim() : '';
                  if (text === targetTrackingId || text.includes(targetTrackingId)) {
                    // Try clicking the element or its parent
                    const clickable = option.closest('a') || option.closest('li') || option;
                    clickable.click();
                    return true;
                  }
                }
                return false;
              }, targetTrackingId);
              
              if (trackingIdFound) {
                console.log(`✅ Switched to Tracking ID: ${targetTrackingId}`);
                await new Promise(resolve => setTimeout(resolve, 2500)); // Wait for page to filter
              } else {
                console.warn(`⚠️ Could not find Tracking ID option: ${targetTrackingId} in dropdown`);
              }
            } else {
              console.warn('⚠️ Could not find Tracking ID dropdown trigger');
            }
          } else {
            console.log(`✅ Already on Tracking ID: ${targetTrackingId}`);
          }
        } catch (error) {
          console.warn(`⚠️ Could not switch Tracking ID: ${error.message}`);
          console.log('Continuing with current Tracking ID...');
        }
      } else {
        console.log(`✅ Tracking ID same as Store ID (${targetStoreId}), skipping Tracking ID switch`);
      }
      
      console.log('⏳ Waiting for dashboard metrics...');
      
      // Wait for dashboard (with reasonable timeout since you have paid account)
      try {
        await page.waitForSelector('#ac-report-commission-commision-total', { 
          timeout: 10000 
        });
        console.log('✅ Dashboard selector found!');
      } catch (selectorError) {
        console.warn('⚠️ Dashboard selector not found in 10 seconds, waiting 2 seconds and proceeding...');
        // Brief pause for page to settle
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Verify we're on the right page
      const currentUrl = page.url();
      if (!currentUrl.includes('reports') && !currentUrl.includes('home') && !currentUrl.includes('p/reporting')) {
        console.warn(`⚠️ Not on reports page. Current URL: ${currentUrl}`);
        console.log('Attempting to navigate to reports...');
        try {
          await page.goto('https://affiliate-program.amazon.com/p/reporting/earnings', { 
            waitUntil: 'domcontentloaded',
            timeout: 6000 
          });
          console.log('✅ Navigated to reports page');
        } catch (navError) {
          console.warn(`⚠️ Could not navigate to reports: ${navError.message}`);
          console.log('Proceeding with data extraction anyway...');
        }
      } else {
        console.log('✅ On reports page');
      }
      
      // Extract data (try even if dashboard selector wasn't found)
      console.log('📈 Extracting metrics...');
      console.log('Running page.evaluate...');
      
      // First, let's see what's actually on the page (debugging)
      const pageInfo = await page.evaluate(() => {
        // Try to find any elements that might contain metrics
        const allIds = Array.from(document.querySelectorAll('[id]'))
          .map(el => el.id)
          .filter(id => id && (id.includes('click') || id.includes('revenue') || id.includes('earning') || id.includes('commission')));
        
        const allClasses = Array.from(document.querySelectorAll('[class]'))
          .map(el => {
            // className can be a string or DOMTokenList, convert to string
            const cls = el.className;
            return typeof cls === 'string' ? cls : cls.toString();
          })
          .filter(cls => cls && (cls.includes('click') || cls.includes('revenue') || cls.includes('earning') || cls.includes('commission')));
        
        return {
          title: document.title,
          url: window.location.href,
          hasCommissionElement: !!document.querySelector('#ac-report-commission-commision-total'),
          relevantIds: allIds.slice(0, 10), // First 10 relevant IDs
          relevantClasses: allClasses.slice(0, 10), // First 10 relevant classes
          bodyText: document.body.innerText.substring(0, 1000) // First 1000 chars for debugging
        };
      });
      console.log('📋 Page info:', JSON.stringify(pageInfo, null, 2));
      
      // If the commission element doesn't exist, try the original reports URL
      if (!pageInfo.hasCommissionElement && pageInfo.url.includes('p/reporting')) {
        console.log('⚠️ Commission element not found on /p/reporting/earnings, trying original reports URL...');
        try {
          await page.goto('https://affiliate-program.amazon.com/home/reports', {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });
          console.log('✅ Navigated to original reports page');
          // Wait a moment for page to load
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (navError) {
          console.warn('Could not navigate to original reports URL:', navError.message);
        }
      }
      
      const data = await page.evaluate(() => {
        const getText = (selector) => {
          try {
            const el = document.querySelector(selector);
            return el ? el.textContent.trim() : '';
          } catch (e) {
            return '';
          }
        };
        
        // Try multiple selector variations in case the page structure is different
        const getTextMultiple = (...selectors) => {
          for (const selector of selectors) {
            const text = getText(selector);
            if (text) return text;
          }
          return '';
        };
        
        // Search for text patterns in the page (fallback if selectors don't work)
        const searchByText = (searchTerms) => {
          const allText = document.body.innerText || '';
          for (const term of searchTerms) {
            const regex = new RegExp(`${term}[^\\d]*([\\d,]+)`, 'i');
            const match = allText.match(regex);
            if (match && match[1]) {
              return match[1].replace(/,/g, '');
            }
          }
          return '';
        };
        
        // Try original selectors first
        let clicks = getTextMultiple(
          '#ac-report-commission-commision-clicks',
          '[data-metric="clicks"]',
          '.metric-clicks',
          '[id*="clicks"]',
          '[class*="click"]'
        );
        
        let ordered = getTextMultiple(
          '#ac-report-commission-commision-ordered',
          '[data-metric="ordered"]',
          '.metric-ordered',
          '[id*="ordered"]'
        );
        
        let shipped = getTextMultiple(
          '#ac-report-commission-commision-shipped',
          '[data-metric="shipped"]',
          '.metric-shipped',
          '[id*="shipped"]'
        );
        
        let conversionRate = getTextMultiple(
          '#ac-report-commission-commision-conversion',
          '[data-metric="conversion"]',
          '.metric-conversion',
          '[id*="conversion"]'
        );
        
        let revenue = getTextMultiple(
          '#ac-report-commission-commision-shipped-revenue',
          '[data-metric="revenue"]',
          '.metric-revenue',
          '[id*="revenue"]',
          '[class*="revenue"]'
        );
        
        let earnings = getTextMultiple(
          '#ac-report-commission-commision-total',
          '[data-metric="earnings"]',
          '.metric-earnings',
          '[id*="total"]',
          '[id*="earnings"]',
          '[class*="earnings"]'
        );
        
        // If still empty, try searching by text content
        if (!clicks) clicks = searchByText(['clicks', 'total clicks']);
        if (!ordered) ordered = searchByText(['ordered', 'items ordered']);
        if (!shipped) shipped = searchByText(['shipped', 'items shipped']);
        if (!revenue) revenue = searchByText(['revenue', 'shipped revenue']);
        if (!earnings) earnings = searchByText(['earnings', 'total earnings', 'commission']);
        
        return {
          clicks,
          ordered,
          shipped,
          conversionRate,
          revenue,
          earnings
        };
      });
      
      console.log('📊 Raw data extracted:', data);
      
      // Close all pages and browser connection properly
      console.log('🧹 Cleaning up browser connections...');
      
      // Close the page
      if (page) {
        try {
          await page.close();
          console.log('✅ Page closed');
        } catch (e) {
          console.warn('Warning closing page:', e.message);
        }
      }
      
      // Close all other pages if any
      const pages = await browser.pages();
      for (const p of pages) {
        try {
          await p.close();
        } catch (e) {
          // Ignore errors closing pages
        }
      }
      
      // Disconnect browser
      if (browser) {
        try {
          await browser.disconnect();
          console.log('✅ Browser disconnected');
        } catch (e) {
          console.warn('Warning disconnecting browser:', e.message);
        }
      }
      
      // Give a moment for all connections to fully close
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ Cleanup complete');
      
      // Parse the raw data
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
        storeId: targetStoreId,
        trackingId: targetTrackingId,
        accountName: targetTrackingId, // Use tracking ID as account name for sheets
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
      
      console.log('✅ Final parsed result:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Scraper failed:', error.message);
      console.error('Stack:', error.stack);
      
      // Clean up browser if still open
      console.log('🧹 Cleaning up after error...');
      
      if (page) {
        try {
          await page.close();
        } catch (e) {
          console.warn('Error closing page during cleanup:', e.message);
        }
      }
      
      // Close all pages
      if (browser) {
        try {
          const pages = await browser.pages();
          for (const p of pages) {
            try {
              await p.close();
            } catch (e) {
              // Ignore
            }
          }
        } catch (e) {
          // Ignore
        }
        
        try {
          await browser.disconnect();
        } catch (e) {
          console.warn('Error disconnecting browser during cleanup:', e.message);
        }
      }
      
      // Give a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      throw error;
    }
  }
});
