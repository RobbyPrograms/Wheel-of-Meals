import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const spoonacularApiKey = process.env.SPOONACULAR_API_KEY;
    const cronSecretKey = process.env.CRON_SECRET_KEY;

    // Log environment variable status
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasSpoonacularKey: !!spoonacularApiKey,
      hasCronKey: !!cronSecretKey
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    if (!spoonacularApiKey) {
      throw new Error('Spoonacular API key not configured');
    }

    if (!cronSecretKey) {
      throw new Error('CRON_SECRET_KEY not configured');
    }

    // Verify the request is from our cron job
    const authHeader = request.headers.get('authorization');
    console.log('Auth check:', {
      receivedHeader: authHeader,
      expectedHeader: `Bearer ${cronSecretKey}`,
      matches: authHeader === `Bearer ${cronSecretKey}`
    });

    if (authHeader !== `Bearer ${cronSecretKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching random recipe...'); 
    // Get a random recipe
    const response = await fetch(
      `https://api.spoonacular.com/recipes/random?apiKey=${spoonacularApiKey}&number=1&tags=main%20course`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Spoonacular random recipe error:', errorText);
      throw new Error(`Spoonacular API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Random recipe fetched:', data.recipes[0].title);

    const recipe = data.recipes[0];

    // Get nutrition data
    console.log('Fetching nutrition data...');
    const nutritionResponse = await fetch(
      `https://api.spoonacular.com/recipes/${recipe.id}/nutritionWidget.json?apiKey=${spoonacularApiKey}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    let nutritionData;
    if (nutritionResponse.ok) {
      nutritionData = await nutritionResponse.json();
      console.log('Nutrition data fetched successfully');
    } else {
      console.error('Failed to fetch nutrition data:', await nutritionResponse.text());
    }

    // Get detailed recipe information
    console.log('Fetching detailed recipe information...');
    const detailedResponse = await fetch(
      `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${spoonacularApiKey}&includeNutrition=true`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!detailedResponse.ok) {
      const errorText = await detailedResponse.text();
      console.error('Detailed recipe error:', errorText);
      throw new Error(`Spoonacular API request failed with status ${detailedResponse.status}: ${errorText}`);
    }

    const detailedRecipe = await detailedResponse.json();
    console.log('Detailed recipe info fetched successfully');

    // Helper function to parse nutrition value
    const parseNutritionValue = (value: any): number => {
      if (typeof value === 'string') {
        const numericValue = value.replace(/[^\d.]/g, '');
        return numericValue ? parseFloat(numericValue) : 0;
      }
      return typeof value === 'number' ? value : 0;
    };

    // Create nutrition object using both sources
    const nutrition = {
      nutrients: [
        {
          name: 'Calories',
          amount: parseNutritionValue(nutritionData?.calories) || 
                 parseNutritionValue(detailedRecipe.nutrition?.nutrients?.find((n: any) => 
                   n.name.toLowerCase() === 'calories'
                 )?.amount) || 0,
          unit: 'kcal'
        },
        {
          name: 'Protein',
          amount: parseNutritionValue(nutritionData?.protein) || 
                 parseNutritionValue(detailedRecipe.nutrition?.nutrients?.find((n: any) => 
                   n.name.toLowerCase() === 'protein'
                 )?.amount) || 0,
          unit: 'g'
        },
        {
          name: 'Fat',
          amount: parseNutritionValue(nutritionData?.fat) || 
                 parseNutritionValue(detailedRecipe.nutrition?.nutrients?.find((n: any) => 
                   n.name.toLowerCase() === 'fat'
                 )?.amount) || 0,
          unit: 'g'
        }
      ]
    };

    // Combine all the data
    const combinedRecipe = {
      ...recipe,
      ...detailedRecipe,
      nutrition
    };

    // Get today's date in UTC and format it as YYYY-MM-DD
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const formattedDate = today.toISOString().split('T')[0];

    console.log('Storing recipe in Supabase...');
    // Store the recipe in Supabase
    const { error: supabaseError } = await supabase
      .from('daily_recipes')
      .upsert({
        id: recipe.id,
        date: formattedDate,
        recipe_data: combinedRecipe
      });

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
      throw supabaseError;
    }

    console.log('Recipe stored successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in daily recipe update:', error);
    
    // Properly format the error response
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string'
      ? error
      : 'An unknown error occurred';

    const errorResponse = {
      success: false,
      error: errorMessage,
      details: error instanceof Error ? {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : undefined
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 