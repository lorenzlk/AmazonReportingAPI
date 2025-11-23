/**
 * Pipedream Step: Amazon Associates Scraper
 * Using Browserless - checking for completion properly
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
    
    const script = `
      module.exports = async ({ page, context }) => {
        try {
          const email = ${JSON.stringify(email)};
          const password = ${JSON.stringify(password)};
          
          console.log('🔐 Logging in...');
          await page.goto('https://affiliate-program.amazon.com/signin', { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
          });
          
          await page.type('#ap_email', email, { delay: 100 });
          await page.click('#continue');
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
          
          await page.type('#ap_password', password, { delay: 100 });
          await page.click('#signInSubmit');
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
          
          console.log('✅ Login successful');
          
          console.log('📊 Navigating to reports...');
          await page.goto('https://affiliate-program.amazon.com/home/reports', { 
            waitUntil: 'networkidle2',
            timeout: 30000
          });
          
          await page.waitForSelector('#ac-report-commission-commision-total', { 
            timeout: 20000 
          });
          
          console.log('📈 Extracting data...');
          const data = await page.evaluate(() => {
            const getText = (s) => {
              const el = document.querySelector(s);
              return el ? el.textContent.trim() : '';
            };
            
            return {
              clicks: getText('#ac-report-commission-commision-clicks'),
              ordered: getText('#ac-report-commission-commision-ordered'),
              shipped: getText('#ac-report-commission-commision-shipped'),
              conversionRate: getText('#ac-report-commission-commision-conversion'),
              revenue: getText('#ac-report-commission-commision-shipped-revenue'),
              earnings: getText('#ac-report-commission-commision-total')
            };
          });
          
          console.log('✅ SCRAPER SUCCESS - Data:', JSON.stringify(data));
          
          // Write to a workspace file so we can retrieve it
          await context.write('result.json', JSON.stringify(data));
          
          return data;
        } catch (error) {
          console.error('❌ SCRAPER ERROR:', error.message);
          await context.write('error.txt', error.message);
          throw error;
        }
      };
    `;
    
    // Step 1: Submit the job
    console.log('📤 Submitting scraper job to Browserless...');
    
    const submitResponse = await $.send.http({
      method: 'POST',
      url: `https://chrome.browserless.io/function?token=${browserlessToken}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: { 
        code: script
      }
    });
    
    const jobId = typeof submitResponse === 'string' ? submitResponse : submitResponse.id;
    console.log('📋 Job submitted, ID:', jobId);
    console.log('🔗 Check status at: https://chrome.browserless.io/workspace');
    
    // Step 2: Wait and check for workspace file
    console.log('⏳ Waiting for job to complete (checking workspace files)...');
    
    const maxAttempts = 50; // 100 seconds total
    const pollInterval = 2000; // 2 seconds
    let attempts = 0;
    let result = null;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`Still waiting... (${attempts}/${maxAttempts} attempts, ${attempts * 2}s elapsed)`);
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      try {
        // Try to fetch the result file we wrote
        const fileResponse = await $.send.http({
          method: 'GET',
          url: `https://chrome.browserless.io/workspace/${jobId}/result.json?token=${browserlessToken}`,
          validateStatus: () => true
        });
        
        if (fileResponse && typeof fileResponse === 'object' && 
            (fileResponse.clicks || fileResponse.revenue)) {
          console.log('✅ Job complete! Found result.json');
          result = fileResponse;
          break;
        }
        
        if (typeof fileResponse === 'string' && fileResponse.includes('clicks')) {
          try {
            result = JSON.parse(fileResponse);
            console.log('✅ Job complete! Parsed result.json');
            break;
          } catch (e) {
            // Continue waiting
          }
        }
        
        // Check for error file
        if (attempts % 10 === 0) {
          try {
            const errorCheck = await $.send.http({
              method: 'GET',
              url: `https://chrome.browserless.io/workspace/${jobId}/error.txt?token=${browserlessToken}`,
              validateStatus: () => true
            });
            
            if (errorCheck && typeof errorCheck === 'string' && errorCheck.length > 0) {
              throw new Error(`Scraper failed: ${errorCheck}`);
            }
          } catch (e) {
            // No error file yet, that's fine
          }
        }
        
      } catch (error) {
        if (error.message.includes('Scraper failed')) {
          throw error;
        }
        // Continue waiting on other errors
      }
    }
    
    if (!result) {
      throw new Error(`Job timed out after ${maxAttempts * 2} seconds. Job ID: ${jobId}. Check Browserless dashboard at https://cloud.browserless.io/workspaces for logs.`);
    }
    
    console.log('📊 Scraped data:', JSON.stringify(result));
    
    // Parse the data
    const parseCurrency = (s) => {
      if (!s) return 0;
      return parseFloat(String(s).replace(/[$,]/g, '')) || 0;
    };
    const parseInteger = (s) => {
      if (!s) return 0;
      return parseInt(String(s).replace(/,/g, '')) || 0;
    };
    const parsePercentage = (s) => {
      if (!s) return 0;
      return parseFloat(String(s).replace(/%/g, '')) || 0;
    };
    
    return {
      date: new Date().toISOString().split('T')[0],
      accountName: 'mula09a-20',
      revenue: parseCurrency(result.revenue),
      earnings: parseCurrency(result.earnings),
      clicks: parseInteger(result.clicks),
      orders: parseInteger(result.ordered),
      conversionRate: parsePercentage(result.conversionRate),
      itemsOrdered: parseInteger(result.ordered),
      itemsShipped: parseInteger(result.shipped),
      revenuePerClick: parseInteger(result.clicks) > 0 
        ? parseCurrency(result.revenue) / parseInteger(result.clicks) 
        : 0,
      lastUpdated: new Date().toISOString(),
      jobId: jobId
    };
  }
});
