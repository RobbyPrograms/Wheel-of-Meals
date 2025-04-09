import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Check if we have the required environment variables
if (!process.env.CRON_SECRET_KEY) {
  console.error('Error: CRON_SECRET_KEY is not set in .env.local');
  process.exit(1);
}

async function triggerDailyRecipe() {
  try {
    console.log('Checking environment...');
    console.log('CRON_SECRET_KEY:', process.env.CRON_SECRET_KEY ? '✓ Found' : '✗ Missing');
    
    console.log('\nTriggering daily recipe update...');
    const response = await fetch('http://localhost:3000/api/cron/update-daily-recipe', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET_KEY}`
      }
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      throw new Error('Invalid JSON response');
    }

    if (!response.ok) {
      throw new Error(`Failed with status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
    }

    console.log('\nSuccess! Recipe updated:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.error('\nError:', error?.message || 'Unknown error occurred');
    if (typeof error?.message === 'string' && error.message.includes('ECONNREFUSED')) {
      console.log('\nTip: Make sure your local development server is running (npm run dev)');
    }
    process.exit(1);
  }
}

triggerDailyRecipe(); 