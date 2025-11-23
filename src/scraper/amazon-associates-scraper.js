/**
 * Amazon Associates Scraper
 * Main scraper orchestrator for extracting data from Amazon Associates dashboard
 * 
 * @module amazon-associates-scraper
 */

const puppeteer = require('puppeteer');
const { switchToAccount, getCurrentAccount } = require('./account-switcher');
const { extractAllData } = require('./data-extractors');
const config = require('./config');

/**
 * Initialize Puppeteer browser instance
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
async function initBrowser() {
  console.log('Launching browser...');
  
  const browser = await puppeteer.launch({
    headless: config.HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080'
    ],
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });
  
  console.log('Browser launched successfully');
  return browser;
}

/**
 * Login to Amazon Associates
 * @param {Page} page - Puppeteer page instance
 * @param {string} email - Amazon account email
 * @param {string} password - Amazon account password
 * @returns {Promise<boolean>} Success status
 */
async function login(page, email, password) {
  try {
    console.log('Navigating to Amazon Associates login...');
    
    await page.goto('https://affiliate-program.amazon.com/signin', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Check if already logged in
    const isLoggedIn = await page.$('#nav-link-accountList-nav-line-1');
    if (isLoggedIn) {
      console.log('Already logged in');
      return true;
    }
    
    // Enter email
    console.log('Entering email...');
    await page.waitForSelector('#ap_email', { timeout: 10000 });
    await page.type('#ap_email', email, { delay: 100 });
    
    // Click Continue
    await page.click('#continue');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Enter password
    console.log('Entering password...');
    await page.waitForSelector('#ap_password', { timeout: 10000 });
    await page.type('#ap_password', password, { delay: 100 });
    
    // Click Sign In
    await page.click('#signInSubmit');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    
    // Verify login success
    await page.waitForSelector('#nav-link-accountList-nav-line-1', { timeout: 10000 });
    
    console.log('Login successful');
    return true;
    
  } catch (error) {
    console.error('Login failed:', error.message);
    
    // Take screenshot for debugging
    try {
      await page.screenshot({ path: './login-error.png', fullPage: true });
      console.log('Screenshot saved: login-error.png');
    } catch (screenshotError) {
      console.error('Failed to save screenshot:', screenshotError.message);
    }
    
    throw new Error(`Login failed: ${error.message}`);
  }
}

/**
 * Scrape data for a single account
 * @param {Page} page - Puppeteer page instance
 * @param {string} accountId - Account ID to scrape
 * @returns {Promise<Object>} Scraped data
 */
async function scrapeAccount(page, accountId) {
  try {
    console.log(`Scraping account: ${accountId}`);
    
    // Navigate to reports dashboard
    await page.goto('https://affiliate-program.amazon.com/home/reports', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for dashboard to load
    await page.waitForSelector('.dashboard-container', { timeout: 15000 })
      .catch(() => {
        console.warn('Dashboard container not found, continuing anyway...');
      });
    
    // Extract all data
    const data = await extractAllData(page);
    
    console.log(`Successfully scraped account: ${accountId}`);
    return data;
    
  } catch (error) {
    console.error(`Failed to scrape account ${accountId}:`, error.message);
    
    // Take screenshot for debugging
    try {
      await page.screenshot({ 
        path: `./scrape-error-${accountId}.png`, 
        fullPage: true 
      });
      console.log(`Screenshot saved: scrape-error-${accountId}.png`);
    } catch (screenshotError) {
      // Ignore screenshot errors
    }
    
    throw error;
  }
}

/**
 * Retry wrapper for flaky operations
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries (ms)
 * @returns {Promise<*>} Result of function
 */
async function withRetry(fn, maxRetries = 3, delay = 5000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1}/${maxRetries} failed: ${error.message}`);
      
      if (i < maxRetries - 1) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Scrape all configured accounts
 * @param {Object} credentials - Amazon credentials { email, password }
 * @param {Array} accountList - List of accounts to scrape
 * @returns {Promise<Object>} Results object with success, data, and errors
 */
async function scrapeAllAccounts(credentials, accountList) {
  let browser = null;
  const results = [];
  const errors = [];
  
  try {
    // Initialize browser
    browser = await initBrowser();
    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent(config.USER_AGENT);
    
    // Login once for all accounts
    console.log('Logging in to Amazon Associates...');
    await withRetry(async () => {
      await login(page, credentials.email, credentials.password);
    });
    
    console.log(`Processing ${accountList.length} account(s)...`);
    
    // Process each account sequentially
    for (let i = 0; i < accountList.length; i++) {
      const account = accountList[i];
      
      console.log(`\n[${i + 1}/${accountList.length}] Processing: ${account.name}`);
      
      try {
        // Switch to account (if not the first/current one)
        if (i > 0 || account.id !== await getCurrentAccount(page)) {
          console.log(`Switching to account: ${account.id}`);
          await switchToAccount(page, account.id);
        }
        
        // Scrape account data with retry
        const data = await withRetry(async () => {
          return await scrapeAccount(page, account.id);
        }, 2); // 2 retries for scraping
        
        // Add to results
        results.push({
          accountId: account.id,
          accountName: account.name,
          data: data,
          timestamp: new Date().toISOString(),
          success: true
        });
        
        console.log(`✓ Successfully processed: ${account.name}`);
        
        // Wait between accounts to avoid rate limiting
        if (i < accountList.length - 1) {
          const waitTime = config.DELAY_BETWEEN_ACCOUNTS;
          console.log(`Waiting ${waitTime/1000}s before next account...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
      } catch (error) {
        console.error(`✗ Failed to process ${account.name}:`, error.message);
        
        errors.push({
          accountId: account.id,
          accountName: account.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        // Continue with next account even if one fails
        continue;
      }
    }
    
    // Summary
    console.log('\n=== Scraping Summary ===');
    console.log(`Total accounts: ${accountList.length}`);
    console.log(`Successful: ${results.length}`);
    console.log(`Failed: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(err => {
        console.log(`  - ${err.accountName}: ${err.error}`);
      });
    }
    
    return {
      success: errors.length === 0,
      data: results,
      errors: errors,
      summary: {
        total: accountList.length,
        successful: results.length,
        failed: errors.length
      }
    };
    
  } catch (error) {
    console.error('Fatal error during scraping:', error);
    
    return {
      success: false,
      data: results,
      errors: [{ message: error.message, timestamp: new Date().toISOString() }],
      summary: {
        total: accountList.length,
        successful: results.length,
        failed: accountList.length - results.length
      }
    };
    
  } finally {
    // Clean up
    if (browser) {
      console.log('\nClosing browser...');
      await browser.close();
      console.log('Browser closed');
    }
  }
}

module.exports = {
  initBrowser,
  login,
  scrapeAccount,
  scrapeAllAccounts,
  withRetry
};

