import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface ApiErrorResponse {
  success: false;
  error: string;
  details?: {
    name?: string;
    stack?: string;
  };
}

interface ApiSuccessResponse {
  success: true;
}

type ApiResponse = ApiErrorResponse | ApiSuccessResponse;

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check if server is ready
async function isServerReady(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3000/api/cron/update-daily-recipe');
    return response.status === 401; // We expect 401 Unauthorized if server is ready
  } catch (error) {
    return false;
  }
}

async function waitForServer(maxAttempts: number = 30): Promise<void> {
  console.log('Waiting for development server to be ready...');
  for (let i = 0; i < maxAttempts; i++) {
    if (await isServerReady()) {
      console.log('Server is ready!');
      return;
    }
    await wait(1000);
    process.stdout.write('.');
  }
  throw new Error('Server did not become ready in time');
}

async function triggerDailyRecipe() {
  const CRON_SECRET_KEY = process.env.CRON_SECRET_KEY;

  if (!CRON_SECRET_KEY) {
    console.error('\nError: CRON_SECRET_KEY environment variable is not set');
    console.log('Please set it in your .env.local file');
    process.exit(1);
  }

  try {
    // Wait for server to be ready
    await waitForServer();

    console.log('\nTriggering daily recipe update...');
    const response = await fetch('http://localhost:3000/api/cron/update-daily-recipe', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET_KEY}`
      }
    });

    let data: ApiResponse;
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse response:', text);
      throw new Error('Invalid JSON response');
    }

    if (!response.ok) {
      throw new Error(`Failed with status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
    }

    if (!data.success) {
      const errorData = data as ApiErrorResponse;
      throw new Error(errorData.error);
    }

    console.log('\nSuccess: Daily recipe has been updated!');

  } catch (error: any) {
    console.error('\nError:', error?.message || 'An unknown error occurred');
    
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.log('\nTip: Make sure your local development server is running (npm run dev)');
    }
    
    process.exit(1);
  }
}

triggerDailyRecipe(); 