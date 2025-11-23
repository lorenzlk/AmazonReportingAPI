/**
 * Scraper Configuration
 * Configuration settings for Amazon Associates scraper
 */

module.exports = {
  // Browser settings
  HEADLESS: process.env.HEADLESS !== 'false', // Run headless by default
  
  // Timeouts (milliseconds)
  PAGE_LOAD_TIMEOUT: 30000,      // 30 seconds
  ELEMENT_TIMEOUT: 15000,        // 15 seconds
  NAVIGATION_TIMEOUT: 30000,     // 30 seconds
  
  // Delays
  DELAY_BETWEEN_ACCOUNTS: 3000,  // 3 seconds between accounts
  TYPING_DELAY: 100,             // Delay between keypresses (ms)
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,             // 5 seconds
  
  // User agent (appears as real browser)
  USER_AGENT: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  
  // Amazon URLs
  URLS: {
    LOGIN: 'https://affiliate-program.amazon.com/signin',
    HOME: 'https://affiliate-program.amazon.com/home',
    REPORTS: 'https://affiliate-program.amazon.com/home/reports',
    REPORTS_OVERVIEW: 'https://affiliate-program.amazon.com/home/reports',
    REPORTS_PRODUCTS: 'https://affiliate-program.amazon.com/home/reports/products',
    REPORTS_EARNINGS: 'https://affiliate-program.amazon.com/home/reports/earnings',
  },
  
  // Selectors (UPDATED WITH REAL AMAZON ASSOCIATES SELECTORS - Nov 3, 2025)
  SELECTORS: {
    // Login (verified working)
    emailInput: '#ap_email',
    continueButton: '#continue',
    passwordInput: '#ap_password',
    signInButton: '#signInSubmit',
    accountListIndicator: '#nav-link-accountList-nav-line-1',
    
    // Account switcher (REAL SELECTORS from Amazon Associates)
    accountSwitcher: '#a-autoid-0-announce',                              // Main dropdown button
    accountSwitcherPrompt: '#a-autoid-0-announce > span.a-dropdown-prompt', // Dropdown text (shows current account)
    accountOptionPrefix: '#menu-tab-store-id-picker_',                    // Account options (append number: _1, _2, _3, etc.)
    currentAccountName: '#a-autoid-0-announce > span.a-dropdown-prompt',  // Same as prompt - shows selected account
    
    // Dashboard (REAL SELECTOR)
    dashboardContainer: '#a-page > div:nth-child(4) > div.ac-page.ac-page-wrapper > div.remote-content-container > div',
    
    // Commission Report Metrics (REAL SELECTORS from Summary tab)
    metricClicks: '#ac-report-commission-commision-clicks',              // Total clicks
    metricOrdered: '#ac-report-commission-commision-ordered',            // Ordered items
    metricShipped: '#ac-report-commission-commision-shipped',            // Shipped items
    metricReturned: '#ac-report-commission-commision-returned',          // Returned items
    metricConversionRate: '#ac-report-commission-commision-conversion',  // Conversion rate %
    metricShippedRevenue: '#ac-report-commission-commision-shipped-revenue', // Shipped items revenue
    metricTotalEarnings: '#ac-report-commission-commision-total',        // Total earnings
    
    // Aliases for consistency with code
    metricRevenue: '#ac-report-commission-commision-shipped-revenue',    // Alias for revenue
    metricEarnings: '#ac-report-commission-commision-total',             // Alias for earnings
    metricOrders: '#ac-report-commission-commision-ordered',             // Alias for orders
    metricItemsOrdered: '#ac-report-commission-commision-ordered',       // Alias for items ordered
    metricItemsShipped: '#ac-report-commission-commision-shipped',       // Alias for items shipped
    
    // Product table (PLACEHOLDERS - will need to navigate to product detail view to get these)
    productTable: '.product-table',
    productRow: '.product-row',
    productAsin: '.product-asin',
    productName: '.product-name',
    productClicks: '.product-clicks',
    productOrders: '.product-orders',
    productRevenue: '.product-revenue',
  },
  
  // Data extraction settings
  MAX_PRODUCTS: 100,             // Maximum number of products to extract
  DATE_FORMAT: 'YYYY-MM-DD',     // Date format for reporting
  
  // Feature flags
  EXTRACT_PRODUCTS: true,        // Extract product-level data
  TAKE_SCREENSHOTS: true,        // Take screenshots on errors
  VERBOSE_LOGGING: true,         // Enable verbose logging
};

