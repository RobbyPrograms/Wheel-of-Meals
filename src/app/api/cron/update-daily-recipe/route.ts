import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Verify the request is from our cron job
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader); // Debug auth
    console.log('Expected:', `Bearer ${process.env.CRON_SECRET_KEY}`); // Debug auth
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new Error('Spoonacular API key not configured');
    }

    console.log('Fetching random recipe...'); // Debug API call
    // Get a random recipe
    const response = await fetch(
      `https://api.spoonacular.com/recipes/random?apiKey=${apiKey}&number=1&tags=main%20course`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Spoonacular random recipe error:', errorText); // Debug API error
      throw new Error(`Spoonacular API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Random recipe fetched:', data.recipes[0].title); // Debug recipe data

    const recipe = data.recipes[0];

    // Get nutrition data
    console.log('Fetching nutrition data...'); // Debug nutrition API call
    const nutritionResponse = await fetch(
      `https://api.spoonacular.com/recipes/${recipe.id}/nutritionWidget.json?apiKey=${apiKey}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    let nutritionData;
    if (nutritionResponse.ok) {
      nutritionData = await nutritionResponse.json();
      console.log('Nutrition data fetched successfully'); // Debug nutrition data
    } else {
      console.error('Failed to fetch nutrition data:', await nutritionResponse.text()); // Debug nutrition error
    }

    // Get detailed recipe information
    console.log('Fetching detailed recipe information...'); // Debug detailed info API call
    const detailedResponse = await fetch(
      `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${apiKey}&includeNutrition=true`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!detailedResponse.ok) {
      const errorText = await detailedResponse.text();
      console.error('Detailed recipe error:', errorText); // Debug detailed recipe error
      throw new Error(`Spoonacular API request failed with status ${detailedResponse.status}: ${errorText}`);
    }

    const detailedRecipe = await detailedResponse.json();
    console.log('Detailed recipe info fetched successfully'); // Debug detailed recipe data

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

    console.log('Storing recipe in Supabase...'); // Debug Supabase
    // Store the recipe in Supabase
    const { error: supabaseError } = await supabase
      .from('daily_recipes')
      .upsert({
        id: recipe.id,
        date: formattedDate,
        recipe_data: combinedRecipe
      });

    if (supabaseError) {
      console.error('Supabase error:', supabaseError); // Debug Supabase error
      throw supabaseError;
    }

    console.log('Recipe stored successfully'); // Debug success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating daily recipe:', error);
    return NextResponse.json(
      { error: 'Failed to update daily recipe', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 