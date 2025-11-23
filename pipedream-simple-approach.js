/**
 * Pipedream: Amazon Associates Scraper - WORKING APPROACH
 * Regular Node.js Code step with Browserless /function endpoint
 */

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
    
    // Browserless function code - must use module.exports for their system
    const functionCode = `
module.exports = async ({ page }) => {
  const email = ${JSON.stringify(email)};
  const password = ${JSON.stringify(password)};
  
  console.log('Logging in...');
  await page.goto('https://affiliate-program.amazon.com/signin', { 
    waitUntil: 'networkidle2',
    timeout: 60000 
  });
  
  await page.type('#ap_email', email, { delay: 50 });
  await page.click('#continue');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
  
  await page.type('#ap_password', password, { delay: 50 });
  await page.click('#signInSubmit');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
  
  console.log('Navigating to reports...');
  await page.goto('https://affiliate-program.amazon.com/home/reports', { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });
  
  await page.waitForSelector('#ac-report-commission-commision-total', { 
    timeout: 20000 
  });
  
  console.log('Extracting data...');
  const data = await page.evaluate(() => {
    const getText = (s) => document.querySelector(s)?.textContent?.trim() || '';
    return {
      clicks: getText('#ac-report-commission-commision-clicks'),
      ordered: getText('#ac-report-commission-commision-ordered'),
      shipped: getText('#ac-report-commission-commision-shipped'),
      conversionRate: getText('#ac-report-commission-commision-conversion'),
      revenue: getText('#ac-report-commission-commision-shipped-revenue'),
      earnings: getText('#ac-report-commission-commision-total')
    };
  });
  
  console.log('Data extracted:', data);
  return data;
};
`;
    
    console.log('📤 Sending request to Browserless (SYNCHRONOUS mode)...');
    
    // Use the /function endpoint with launch parameter to force synchronous
    const response = await $.send.http({
      method: 'POST',
      url: `https://chrome.browserless.io/function`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${browserlessToken}`
      },
      data: {
        code: functionCode,
        context: {},
        launch: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      },
      timeout: 120000 // 2 minute timeout
    });
    
    console.log('📊 Response type:', typeof response);
    console.log('📊 Response:', JSON.stringify(response).substring(0, 500));
    
    // Check if we got data
    if (!response || typeof response === 'string') {
      throw new Error(`Unexpected response format. Got: ${JSON.stringify(response).substring(0, 200)}`);
    }
    
    // Parse values
    const parseCurrency = (str) => {
      if (!str) return 0;
      return parseFloat(String(str).replace(/[$,]/g, '')) || 0;
    };
    
    const parseInteger = (str) => {
      if (!str) return 0;
      return parseInt(String(str).replace(/,/g, '')) || 0;
    };
    
    const parsePercentage = (str) => {
      if (!str) return 0;
      return parseFloat(String(str).replace(/%/g, '')) || 0;
    };
    
    return {
      date: new Date().toISOString().split('T')[0],
      accountName: 'mula09a-20',
      revenue: parseCurrency(response.revenue),
      earnings: parseCurrency(response.earnings),
      clicks: parseInteger(response.clicks),
      orders: parseInteger(response.ordered),
      conversionRate: parsePercentage(response.conversionRate),
      itemsOrdered: parseInteger(response.ordered),
      itemsShipped: parseInteger(response.shipped),
      revenuePerClick: parseInteger(response.clicks) > 0 
        ? parseCurrency(response.revenue) / parseInteger(response.clicks) 
        : 0,
      lastUpdated: new Date().toISOString()
    };
  }
});
