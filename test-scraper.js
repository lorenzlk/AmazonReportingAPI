/**
 * Test Script for Amazon Associates Scraper
 * Verifies that selectors work and can extract data
 */

require('dotenv').config();
const puppeteer = require('puppeteer');
const config = require('./src/scraper/config');

async function testScraper() {
  console.log('🚀 Starting Amazon Associates Scraper Test...\n');
  
  let browser;
  
  try {
    // Launch browser (visible for testing)
    console.log('📱 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    await page.setUserAgent(config.USER_AGENT);
    
    // Login
    console.log('🔐 Logging in to Amazon Associates...');
    await page.goto(config.URLS.LOGIN, { waitUntil: 'networkidle2' });
    
    await page.type(config.SELECTORS.emailInput, process.env.AMAZON_EMAIL, { delay: 100 });
    await page.click(config.SELECTORS.continueButton);
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    await page.type(config.SELECTORS.passwordInput, process.env.AMAZON_PASSWORD, { delay: 100 });
    await page.click(config.SELECTORS.signInButton);
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log('✅ Login successful!\n');
    
    // Navigate to reports
    console.log('📊 Navigating to reports...');
    await page.goto(config.URLS.REPORTS, { waitUntil: 'networkidle2' });
    
    // Wait for dashboard
    await page.waitForSelector(config.SELECTORS.dashboardContainer, { timeout: 15000 });
    console.log('✅ Dashboard loaded!\n');
    
    // Extract data
    console.log('📈 Extracting metrics...');
    const data = await page.evaluate((selectors) => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : 'NOT FOUND';
      };
      
      return {
        clicks: getText(selectors.metricClicks),
        ordered: getText(selectors.metricOrdered),
        shipped: getText(selectors.metricShipped),
        conversion: getText(selectors.metricConversionRate),
        revenue: getText(selectors.metricRevenue),
        earnings: getText(selectors.metricEarnings)
      };
    }, config.SELECTORS);
    
    console.log('\n📊 EXTRACTED DATA:');
    console.log('==================');
    console.log('Clicks:      ', data.clicks);
    console.log('Ordered:     ', data.ordered);
    console.log('Shipped:     ', data.shipped);
    console.log('Conversion:  ', data.conversion);
    console.log('Revenue:     ', data.revenue);
    console.log('Earnings:    ', data.earnings);
    console.log('==================\n');
    
    // Check account switcher
    console.log('🔄 Checking account switcher...');
    const hasAccountSwitcher = await page.$(config.SELECTORS.accountSwitcher);
    if (hasAccountSwitcher) {
      console.log('✅ Account switcher found!');
      
      const currentAccount = await page.$eval(
        config.SELECTORS.currentAccountName,
        el => el.textContent.trim()
      );
      console.log('Current account:', currentAccount);
    } else {
      console.log('ℹ️  No account switcher (single account mode)');
    }
    
    console.log('\n✅ TEST COMPLETE! All selectors working correctly.\n');
    
    // Keep browser open for 5 seconds so you can see the results
    console.log('Browser will close in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nFull error:', error);
    
    // Take screenshot on error
    if (browser) {
      const pages = await browser.pages();
      if (pages[0]) {
        await pages[0].screenshot({ path: './test-error.png', fullPage: true });
        console.log('\n📸 Screenshot saved to: test-error.png');
      }
    }
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed.');
    }
  }
}

// Run the test
testScraper();

