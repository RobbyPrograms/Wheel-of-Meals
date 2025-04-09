import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date in UTC and format it as YYYY-MM-DD
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const formattedDate = today.toISOString().split('T')[0];

    console.log('Fetching recipe for date:', formattedDate);

    // Fetch today's recipe from Supabase
    const { data, error } = await supabase
      .from('daily_recipes')
      .select('recipe_data')
      .eq('date', formattedDate)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      // Try to get the most recent recipe instead
      console.log('Attempting to fetch most recent recipe...');
      const { data: latestData, error: latestError } = await supabase
        .from('daily_recipes')
        .select('recipe_data')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (latestError) {
        console.error('Error fetching latest recipe:', latestError);
        throw latestError;
      }

      if (!latestData) {
        console.log('No recipes found in database');
        return NextResponse.json(
          { error: 'No recipe available' },
          { status: 404 }
        );
      }

      console.log('Found latest recipe');
      return NextResponse.json(latestData.recipe_data);
    }

    if (!data) {
      console.log('No recipe found for today, fetching most recent...');
      // Try to get the most recent recipe instead
      const { data: latestData, error: latestError } = await supabase
        .from('daily_recipes')
        .select('recipe_data')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (latestError) {
        console.error('Error fetching latest recipe:', latestError);
        throw latestError;
      }

      if (!latestData) {
        console.log('No recipes found in database');
        return NextResponse.json(
          { error: 'No recipe available' },
          { status: 404 }
        );
      }

      console.log('Found latest recipe');
      return NextResponse.json(latestData.recipe_data);
    }

    console.log('Successfully found today\'s recipe');
    return NextResponse.json(data.recipe_data);
  } catch (error) {
    console.error('Error in recipe-of-the-day route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipe', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 