/**
 * Account Switcher
 * Handles navigation between multiple Amazon Associates accounts
 * 
 * @module account-switcher
 */

const config = require('./config');

/**
 * Get the currently active account
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<string|null>} Current account ID or null if not found
 */
async function getCurrentAccount(page) {
  try {
    // Wait for account indicator to be present
    await page.waitForSelector(config.SELECTORS.currentAccountName, { 
      timeout: 5000 
    });
    
    // Extract current account name/ID
    const accountName = await page.$eval(
      config.SELECTORS.currentAccountName,
      el => el.textContent.trim()
    );
    
    console.log(`Current account: ${accountName}`);
    return accountName;
    
  } catch (error) {
    console.warn('Could not determine current account:', error.message);
    return null;
  }
}

/**
 * Check if account switcher is available on page
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<boolean>} True if account switcher exists
 */
async function hasAccountSwitcher(page) {
  try {
    const switcher = await page.$(config.SELECTORS.accountSwitcher);
    return switcher !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get list of available accounts
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<Array>} List of available accounts
 */
async function getAvailableAccounts(page) {
  try {
    // Click account switcher to open dropdown
    await page.click(config.SELECTORS.accountSwitcher);
    
    // Wait for dropdown to appear
    await page.waitForSelector(config.SELECTORS.accountSwitcherDropdown, {
      timeout: 5000
    });
    
    // Extract available accounts
    const accounts = await page.evaluate((dropdownSelector) => {
      const dropdown = document.querySelector(dropdownSelector);
      if (!dropdown) return [];
      
      const accountElements = dropdown.querySelectorAll('[data-account-id]');
      return Array.from(accountElements).map(el => ({
        id: el.getAttribute('data-account-id'),
        name: el.textContent.trim()
      }));
    }, config.SELECTORS.accountSwitcherDropdown);
    
    // Close dropdown (click elsewhere)
    await page.keyboard.press('Escape');
    
    console.log(`Found ${accounts.length} available accounts`);
    return accounts;
    
  } catch (error) {
    console.warn('Could not get available accounts:', error.message);
    return [];
  }
}

/**
 * Switch to a specific account
 * @param {Page} page - Puppeteer page instance
 * @param {string} targetAccountId - Account ID to switch to
 * @returns {Promise<boolean>} True if switch was successful
 */
async function switchToAccount(page, targetAccountId) {
  try {
    console.log(`Attempting to switch to account: ${targetAccountId}`);
    
    // Check if account switcher exists
    const hasSwitcher = await hasAccountSwitcher(page);
    
    if (!hasSwitcher) {
      console.warn('Account switcher not found. May be single-account or different UI.');
      return true; // Assume we're on the right account
    }
    
    // Check if already on target account
    const currentAccount = await getCurrentAccount(page);
    if (currentAccount === targetAccountId) {
      console.log('Already on target account');
      return true;
    }
    
    // Click account switcher to open dropdown
    await page.click(config.SELECTORS.accountSwitcher);
    
    // Wait for dropdown menu to appear
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Amazon uses numbered menu items: #menu-tab-store-id-picker_1, _2, _3, etc.
    // Try to find the account by its ID (store ID like "mula09a-20") or by index
    
    // Strategy 1: If targetAccountId is a number (index), use it directly
    let accountSelector;
    if (!isNaN(targetAccountId)) {
      accountSelector = `${config.SELECTORS.accountOptionPrefix}${targetAccountId}`;
    } else {
      // Strategy 2: Search for account by store ID text (e.g., "mula09a-20")
      // Get all account menu items and find the one with matching text
      const accountFound = await page.evaluate((accountId, prefix) => {
        // Try multiple account indices (typically 1-10)
        for (let i = 1; i <= 10; i++) {
          const element = document.querySelector(`${prefix}${i}`);
          if (element && element.textContent.includes(accountId)) {
            return i;
          }
        }
        return null;
      }, targetAccountId, config.SELECTORS.accountOptionPrefix);
      
      if (!accountFound) {
        throw new Error(`Account not found in dropdown: ${targetAccountId}`);
      }
      
      accountSelector = `${config.SELECTORS.accountOptionPrefix}${accountFound}`;
    }
    
    // Wait for the specific account option to be available
    const accountElement = await page.$(accountSelector);
    
    if (!accountElement) {
      throw new Error(`Account selector not found: ${accountSelector}`);
    }
    
    // Click the account option
    await accountElement.click();
    
    // Wait for page to reload/update
    await page.waitForNavigation({ 
      waitUntil: 'networkidle2',
      timeout: 30000 
    }).catch(() => {
      console.warn('Navigation timeout after account switch (may be normal)');
    });
    
    // Wait for dashboard to load
    await page.waitForSelector(config.SELECTORS.dashboardContainer, {
      timeout: 15000
    }).catch(() => {
      console.warn('Dashboard container not found after switch (may be normal)');
    });
    
    // Verify switch was successful
    const newAccount = await getCurrentAccount(page);
    if (newAccount !== targetAccountId) {
      console.warn(`Account switch verification failed. Expected: ${targetAccountId}, Got: ${newAccount}`);
    } else {
      console.log(`Successfully switched to account: ${targetAccountId}`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`Failed to switch to account ${targetAccountId}:`, error.message);
    
    // Take screenshot for debugging
    try {
      await page.screenshot({ 
        path: `./account-switch-error-${targetAccountId}.png`,
        fullPage: true 
      });
      console.log(`Screenshot saved: account-switch-error-${targetAccountId}.png`);
    } catch (screenshotError) {
      // Ignore screenshot errors
    }
    
    throw error;
  }
}

/**
 * Switch to account with retry logic
 * @param {Page} page - Puppeteer page instance
 * @param {string} targetAccountId - Account ID to switch to
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<boolean>} True if successful
 */
async function switchToAccountWithRetry(page, targetAccountId, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await switchToAccount(page, targetAccountId);
    } catch (error) {
      lastError = error;
      console.warn(`Account switch attempt ${i + 1}/${maxRetries} failed`);
      
      if (i < maxRetries - 1) {
        console.log('Retrying...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
  
  throw lastError;
}

module.exports = {
  getCurrentAccount,
  hasAccountSwitcher,
  getAvailableAccounts,
  switchToAccount,
  switchToAccountWithRetry
};

