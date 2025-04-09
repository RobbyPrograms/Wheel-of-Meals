const dotenv = require('dotenv');
// @ts-ignore
const nodeFetch = require('node-fetch');

dotenv.config({ path: '.env.local' });

async function triggerProductionRecipe() {
  try {
    console.log('Triggering production recipe update...');
    // Replace with your production URL
    const response = await nodeFetch('https://wheel-of-meals.vercel.app/api/cron/update-daily-recipe', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Success! Production recipe updated:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

triggerProductionRecipe(); 