import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    // Initialize Supabase client with service role key for full access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date in UTC and format it as YYYY-MM-DD
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const formattedDate = today.toISOString().split('T')[0];

    console.log('Fetching recipe for date:', formattedDate);

    // Fetch today's recipe from Supabase
    const { data, error } = await supabase
      .from('daily_recipes')
      .select('recipe_data, date')
      .eq('date', formattedDate)
      .single();

    if (error) {
      console.error('Error fetching today\'s recipe:', error);
      
      // Try to get the most recent recipe instead
      console.log('Attempting to fetch most recent recipe...');
      const { data: latestData, error: latestError } = await supabase
        .from('daily_recipes')
        .select('recipe_data, date')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (latestError) {
        console.error('Error fetching latest recipe:', latestError);
        return NextResponse.json(
          { error: 'Failed to fetch recipe', details: latestError.message },
          { status: 500 }
        );
      }

      if (!latestData) {
        console.log('No recipes found in database');
        return NextResponse.json(
          { error: 'No recipe available' },
          { status: 404 }
        );
      }

      console.log('Found latest recipe from:', latestData.date);
      return NextResponse.json(latestData.recipe_data);
    }

    if (!data) {
      console.log('No recipe found for today, fetching most recent...');
      // Try to get the most recent recipe instead
      const { data: latestData, error: latestError } = await supabase
        .from('daily_recipes')
        .select('recipe_data, date')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (latestError) {
        console.error('Error fetching latest recipe:', latestError);
        return NextResponse.json(
          { error: 'Failed to fetch recipe', details: latestError.message },
          { status: 500 }
        );
      }

      if (!latestData) {
        console.log('No recipes found in database');
        return NextResponse.json(
          { error: 'No recipe available' },
          { status: 404 }
        );
      }

      console.log('Found latest recipe from:', latestData.date);
      return NextResponse.json(latestData.recipe_data);
    }

    console.log('Successfully found today\'s recipe');
    return NextResponse.json(data.recipe_data);
  } catch (error) {
    console.error('Error in recipe-of-the-day route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch recipe', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 