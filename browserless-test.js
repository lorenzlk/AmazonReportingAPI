/**
 * Simple Browserless test - just verify it can scrape anything
 * Copy this to a Pipedream step to test if Browserless is working
 */

export default defineComponent({
  props: {
    browserless: {
      type: "app",
      app: "browserless",
    }
  },
  async run({ steps, $ }) {
    console.log('🧪 Testing Browserless with simple scrape...');
    
    const browserlessToken = this.browserless.$auth.api_key;
    
    const script = `
      module.exports = async ({ page, context }) => {
        console.log('Loading Google...');
        await page.goto('https://www.google.com', { 
          waitUntil: 'networkidle2', 
          timeout: 30000 
        });
        
        const title = await page.title();
        console.log('Page title:', title);
        
        const data = { success: true, title, timestamp: new Date().toISOString() };
        await context.write('result.json', JSON.stringify(data));
        
        return data;
      };
    `;
    
    const submitResponse = await $.send.http({
      method: 'POST',
      url: `https://chrome.browserless.io/function?token=${browserlessToken}`,
      headers: { 'Content-Type': 'application/json' },
      data: { code: script }
    });
    
    const jobId = typeof submitResponse === 'string' ? submitResponse : submitResponse.id;
    console.log('Job ID:', jobId);
    
    // Wait and poll
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Attempt ${i + 1}/20...`);
      
      try {
        const result = await $.send.http({
          method: 'GET',
          url: `https://chrome.browserless.io/workspace/${jobId}/result.json?token=${browserlessToken}`,
          validateStatus: () => true
        });
        
        if (result && (result.success || result.title)) {
          console.log('✅ Test passed!', result);
          return result;
        }
      } catch (e) {
        // Keep waiting
      }
    }
    
    throw new Error('Test timed out');
  }
});

