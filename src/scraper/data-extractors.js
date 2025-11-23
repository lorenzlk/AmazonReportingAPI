/**
 * Data Extractors
 * Functions for extracting metrics from Amazon Associates dashboard
 * 
 * @module data-extractors
 * 
 * NOTE: Selectors in this file are PLACEHOLDERS. 
 * You must inspect the actual Amazon Associates dashboard to get real selectors.
 */

const config = require('./config');

/**
 * Parse currency string to float
 * @param {string} str - Currency string (e.g., "$1,234.56")
 * @returns {number} Parsed float value
 */
function parseCurrency(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/[$,]/g, '')) || 0;
}

/**
 * Parse integer string
 * @param {string} str - Number string (e.g., "1,234")
 * @returns {number} Parsed integer value
 */
function parseInteger(str) {
  if (!str) return 0;
  return parseInt(str.replace(/,/g, '')) || 0;
}

/**
 * Parse percentage string
 * @param {string} str - Percentage string (e.g., "3.5%")
 * @returns {number} Parsed float value
 */
function parsePercentage(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/%/g, '')) || 0;
}

/**
 * Wait for element with timeout
 * @param {Page} page - Puppeteer page
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<boolean>} True if found
 */
async function waitForElementSafe(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.warn(`Element not found: ${selector}`);
    return false;
  }
}

/**
 * Extract overview/dashboard metrics
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<Object>} Overview metrics
 */
async function extractOverviewData(page) {
  console.log('Extracting overview data...');
  
  try {
    // Navigate to reports overview if not already there
    await page.goto(config.URLS.REPORTS_OVERVIEW, {
      waitUntil: 'networkidle2',
      timeout: config.PAGE_LOAD_TIMEOUT
    });
    
    // Wait for dashboard to load
    const dashboardLoaded = await waitForElementSafe(
      page,
      config.SELECTORS.dashboardContainer,
      config.ELEMENT_TIMEOUT
    );
    
    if (!dashboardLoaded) {
      console.warn('Dashboard did not load properly');
    }
    
    // Extract metrics from page
    const overview = await page.evaluate((selectors) => {
      // Helper to get text content safely
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : '';
      };
      
      return {
        revenue: getText(selectors.metricRevenue),
        earnings: getText(selectors.metricEarnings),
        clicks: getText(selectors.metricClicks),
        orders: getText(selectors.metricOrders),
        conversionRate: getText(selectors.metricConversionRate),
        itemsOrdered: getText(selectors.metricItemsOrdered),
        itemsShipped: getText(selectors.metricItemsShipped),
      };
    }, config.SELECTORS);
    
    // Parse and normalize data
    const normalized = {
      revenue: parseCurrency(overview.revenue),
      earnings: parseCurrency(overview.earnings),
      clicks: parseInteger(overview.clicks),
      orders: parseInteger(overview.orders),
      conversionRate: parsePercentage(overview.conversionRate),
      itemsOrdered: parseInteger(overview.itemsOrdered),
      itemsShipped: parseInteger(overview.itemsShipped),
      revenuePerClick: overview.clicks > 0 
        ? parseCurrency(overview.revenue) / parseInteger(overview.clicks) 
        : 0
    };
    
    console.log('Overview data extracted:', normalized);
    return normalized;
    
  } catch (error) {
    console.error('Failed to extract overview data:', error.message);
    
    // Return empty data structure on error
    return {
      revenue: 0,
      earnings: 0,
      clicks: 0,
      orders: 0,
      conversionRate: 0,
      itemsOrdered: 0,
      itemsShipped: 0,
      revenuePerClick: 0,
      error: error.message
    };
  }
}

/**
 * Extract product-level data
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<Array>} Array of product data
 */
async function extractProductData(page) {
  console.log('Extracting product data...');
  
  // Skip if feature disabled
  if (!config.EXTRACT_PRODUCTS) {
    console.log('Product extraction disabled');
    return [];
  }
  
  try {
    // Navigate to products report
    await page.goto(config.URLS.REPORTS_PRODUCTS, {
      waitUntil: 'networkidle2',
      timeout: config.PAGE_LOAD_TIMEOUT
    });
    
    // Wait for product table
    const tableLoaded = await waitForElementSafe(
      page,
      config.SELECTORS.productTable,
      config.ELEMENT_TIMEOUT
    );
    
    if (!tableLoaded) {
      console.warn('Product table not found');
      return [];
    }
    
    // Extract product rows
    const products = await page.evaluate((selectors, maxProducts) => {
      const rows = document.querySelectorAll(selectors.productRow);
      const productData = [];
      
      // Limit to maxProducts
      const limit = Math.min(rows.length, maxProducts);
      
      for (let i = 0; i < limit; i++) {
        const row = rows[i];
        
        try {
          const asin = row.querySelector(selectors.productAsin)?.textContent.trim() || '';
          const name = row.querySelector(selectors.productName)?.textContent.trim() || '';
          const clicks = row.querySelector(selectors.productClicks)?.textContent.trim() || '0';
          const orders = row.querySelector(selectors.productOrders)?.textContent.trim() || '0';
          const revenue = row.querySelector(selectors.productRevenue)?.textContent.trim() || '$0.00';
          
          productData.push({
            asin,
            name,
            clicks,
            orders,
            revenue
          });
        } catch (err) {
          console.error('Error parsing product row:', err);
        }
      }
      
      return productData;
    }, config.SELECTORS, config.MAX_PRODUCTS);
    
    // Parse and normalize product data
    const normalized = products.map(product => ({
      asin: product.asin,
      name: product.name,
      clicks: parseInteger(product.clicks),
      orders: parseInteger(product.orders),
      revenue: parseCurrency(product.revenue),
      conversionRate: product.clicks > 0 
        ? (parseInteger(product.orders) / parseInteger(product.clicks) * 100) 
        : 0
    }));
    
    console.log(`Extracted ${normalized.length} products`);
    return normalized;
    
  } catch (error) {
    console.error('Failed to extract product data:', error.message);
    return [];
  }
}

/**
 * Extract earnings data
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<Object>} Earnings data
 */
async function extractEarningsData(page) {
  console.log('Extracting earnings data...');
  
  try {
    // Navigate to earnings report
    await page.goto(config.URLS.REPORTS_EARNINGS, {
      waitUntil: 'networkidle2',
      timeout: config.PAGE_LOAD_TIMEOUT
    });
    
    // Wait for earnings section to load
    await waitForElementSafe(
      page,
      '.earnings-summary',
      config.ELEMENT_TIMEOUT
    );
    
    // Extract earnings metrics
    const earnings = await page.evaluate(() => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : '';
      };
      
      return {
        totalEarnings: getText('.total-earnings'),
        pendingEarnings: getText('.pending-earnings'),
        paidEarnings: getText('.paid-earnings'),
        // Add more earnings metrics as needed
      };
    });
    
    // Parse and normalize
    const normalized = {
      totalEarnings: parseCurrency(earnings.totalEarnings),
      pendingEarnings: parseCurrency(earnings.pendingEarnings),
      paidEarnings: parseCurrency(earnings.paidEarnings),
    };
    
    console.log('Earnings data extracted:', normalized);
    return normalized;
    
  } catch (error) {
    console.error('Failed to extract earnings data:', error.message);
    
    return {
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      error: error.message
    };
  }
}

/**
 * Extract all available data
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<Object>} Complete data object
 */
async function extractAllData(page) {
  console.log('Extracting all data...');
  
  const startTime = Date.now();
  
  try {
    // Extract all data types
    const [overview, products, earnings] = await Promise.all([
      extractOverviewData(page).catch(err => {
        console.error('Overview extraction failed:', err);
        return {};
      }),
      extractProductData(page).catch(err => {
        console.error('Product extraction failed:', err);
        return [];
      }),
      extractEarningsData(page).catch(err => {
        console.error('Earnings extraction failed:', err);
        return {};
      })
    ]);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Data extraction completed in ${duration}s`);
    
    return {
      overview,
      products,
      earnings,
      metadata: {
        extractedAt: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        durationSeconds: parseFloat(duration)
      }
    };
    
  } catch (error) {
    console.error('Failed to extract all data:', error.message);
    throw error;
  }
}

/**
 * Extract data for a specific date range
 * @param {Page} page - Puppeteer page instance
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Data for date range
 */
async function extractDateRangeData(page, startDate, endDate) {
  console.log(`Extracting data for range: ${startDate} to ${endDate}`);
  
  try {
    // Navigate to reports with date range
    // This is a placeholder - actual implementation depends on Amazon's UI
    await page.goto(config.URLS.REPORTS, {
      waitUntil: 'networkidle2',
      timeout: config.PAGE_LOAD_TIMEOUT
    });
    
    // Set date range (placeholder selectors)
    await page.click('#date-range-picker');
    await page.type('#start-date', startDate);
    await page.type('#end-date', endDate);
    await page.click('#apply-date-range');
    
    // Wait for data to reload
    await page.waitForSelector(config.SELECTORS.dashboardContainer, {
      timeout: config.ELEMENT_TIMEOUT
    });
    
    // Extract data with date range
    return await extractAllData(page);
    
  } catch (error) {
    console.error('Failed to extract date range data:', error.message);
    throw error;
  }
}

module.exports = {
  extractOverviewData,
  extractProductData,
  extractEarningsData,
  extractAllData,
  extractDateRangeData,
  // Export helpers for testing
  parseCurrency,
  parseInteger,
  parsePercentage
};

